import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'
import {
  capOrmTemplates,
  normalGreenFlipSources,
  sideOrmTemplates,
  terrainTextures,
} from '../../scripts/textures/terrain-textures.config.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))
const outputRoot = `${root}/public/textures`
const manifest = JSON.parse(readFileSync(`${outputRoot}/manifest.json`, 'utf8'))

function readTexture(name: string) {
  return PNG.sync.read(readFileSync(`${outputRoot}/${name}`))
}

function sourceFiles(value: unknown): string[] {
  if (typeof value === 'string') {
    return /\.(bmp|png)$/i.test(value) ? [value] : []
  }
  if (Array.isArray(value)) return value.flatMap(sourceFiles)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(sourceFiles)
  }
  return []
}

function channelDifference(
  image: PNG,
  firstX: number,
  firstY: number,
  secondX: number,
  secondY: number,
) {
  let max = 0
  for (let channel = 0; channel < 4; channel += 1) {
    const first = (firstY * image.width + firstX) * 4 + channel
    const second = (secondY * image.width + secondX) * 4 + channel
    max = Math.max(max, Math.abs(image.data[first] - image.data[second]))
  }
  return max
}

describe('packed terrain textures', () => {
  it('includes a manifest entry for every terrain', () => {
    expect(Object.keys(manifest.terrains).sort()).toEqual(
      Object.keys(terrainTextures).sort(),
    )
    expect(Object.keys(manifest.terrains)).toHaveLength(21)
  })

  it('references source images that exist', () => {
    const sources = sourceFiles([
      terrainTextures,
      capOrmTemplates,
      sideOrmTemplates,
      normalGreenFlipSources,
    ])
    for (const source of sources) {
      expect(existsSync(`${root}/textures/${source}`), source).toBe(true)
    }
  })

  it('keeps manifest layer indices and strip dimensions in range', () => {
    for (const [filename, details] of Object.entries(manifest.files) as [
      string,
      {
        width: number
        height: number
        frameWidth: number
        frameHeight: number
        layers: number
      },
    ][]) {
      const image = readTexture(filename)
      expect(image.width).toBe(details.width)
      expect(image.height).toBe(details.height)
      expect(details.width).toBe(details.frameWidth)
      expect(details.height).toBe(details.layers * details.frameHeight)
    }

    const layerFiles = {
      capDiffuseLayer: 'caps-diffuse.png',
      capDiffusePbrLayer: 'caps-diffuse-pbr.png',
      capOrmLayer: 'caps-orm.png',
      capNormalLayer: 'caps-normal.png',
      sideDiffuseLayer: 'sides-diffuse.png',
      sideOrmLayer: 'sides-orm.png',
      sideNormalLayer: 'sides-normal.png',
    } as const

    for (const terrain of Object.values(manifest.terrains)) {
      for (const [field, filename] of Object.entries(layerFiles) as [
        keyof typeof layerFiles,
        (typeof layerFiles)[keyof typeof layerFiles],
      ][]) {
        const layer = terrain[field]
        expect(layer).toBeGreaterThanOrEqual(-1)
        if (layer >= 0) {
          expect(layer).toBeLessThan(manifest.files[filename].layers)
        }
      }
    }
  })

  it('repairs side edges and removes the bright top rows', () => {
    for (const filename of [
      'sides-diffuse.png',
      'sides-normal.png',
      'sides-orm.png',
    ]) {
      const image = readTexture(filename)
      const { frameHeight, layers } = manifest.files[filename]
      for (let layer = 0; layer < layers; layer += 1) {
        const layerTop = layer * frameHeight
        for (let y = 0; y < frameHeight; y += 1) {
          expect(
            channelDifference(
              image,
              0,
              layerTop + y,
              image.width - 1,
              layerTop + y,
            ),
          ).toBeLessThanOrEqual(1)
        }
        for (let x = 0; x < image.width; x += 1) {
          expect(
            channelDifference(image, x, layerTop, x, layerTop + 2),
          ).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('uses the flat cap-normal layer for every fluid terrain', () => {
    const flatLayer = 2
    for (const [name, terrain] of Object.entries(manifest.terrains)) {
      if (terrainTextures[name].isFluid) {
        expect(terrain.capNormalLayer).toBe(flatLayer)
      }
    }
  })

  it('reports no drift from the committed output files', () => {
    expect(
      execFileSync('npm', ['run', 'textures:check'], {
        cwd: root,
        encoding: 'utf8',
      }),
    ).toContain('match committed outputs')
  })
})

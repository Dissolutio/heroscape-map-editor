import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Pieces } from '../types'
import {
  type MarvelRuinMeshName,
  getMarvelRuinParts,
} from '../world/models/marvelRuinParts'

type GlbJson = {
  accessors: Array<{
    min?: number[]
    max?: number[]
  }>
  bufferViews?: Array<unknown>
  images?: Array<{
    bufferView?: number
    mimeType?: string
    uri?: string
  }>
  materials?: Array<{
    doubleSided?: boolean
    pbrMetallicRoughness?: {
      baseColorTexture?: { index: number }
    }
  }>
  meshes: Array<{
    name: string
    primitives: Array<{
      attributes: Record<string, number>
      material?: number
    }>
  }>
  textures?: Array<{ source?: number }>
}

function readGlbJson(path: string): GlbJson {
  const buffer = readFileSync(resolve(process.cwd(), path))
  const jsonChunkLength = buffer.readUInt32LE(12)
  return JSON.parse(
    buffer.toString('utf8', 20, 20 + jsonChunkLength),
  ) as GlbJson
}

function getMeshBounds(glb: GlbJson, name: string) {
  const mesh = glb.meshes.find((item) => item.name === name)
  if (!mesh) throw new Error(`Missing mesh ${name}`)
  const positionIndex = mesh.primitives[0].attributes.POSITION
  const accessor = glb.accessors[positionIndex]
  if (!accessor.min || !accessor.max) {
    throw new Error(`Mesh ${name} is missing position bounds`)
  }
  return { min: accessor.min, max: accessor.max }
}

function getCombinedBounds(glb: GlbJson) {
  const bounds = glb.meshes.map(({ name }) => getMeshBounds(glb, name))
  return {
    min: [0, 1, 2].map((axis) =>
      Math.min(...bounds.map(({ min }) => min[axis])),
    ),
    max: [0, 1, 2].map((axis) =>
      Math.max(...bounds.map(({ max }) => max[axis])),
    ),
  }
}

function expectBoundsClose(
  oldBounds: { min: number[]; max: number[] },
  newBounds: { min: number[]; max: number[] },
  axes: number[],
  tolerance: number,
) {
  for (const axis of axes) {
    expect(
      Math.abs(oldBounds.min[axis] - newBounds.min[axis]),
    ).toBeLessThanOrEqual(tolerance)
    expect(
      Math.abs(oldBounds.max[axis] - newBounds.max[axis]),
    ).toBeLessThanOrEqual(tolerance)
  }
}

// Bounds recorded from the original Marvel Ruin model before its removal.
const originalMarvelBounds = {
  combined: {
    min: [-1.064774751663208, 2.9802322387695312e-8, -1.0891509056091309],
    max: [4.909017562866211, 4.199999809265137, 1.7004338502883911],
  },
  upperFloor: {
    min: [-0.8647747039794922, 2.5842881202697754, -1.0891509056091309],
    max: [4.909017562866211, 2.8299996852874756, 1.5004329681396484],
  },
}

const expectedMeshes: Array<[string, MarvelRuinMeshName[]]> = [
  [
    Pieces.marvel,
    [
      'MarvelRuinLeft',
      'MarvelRuinFront',
      'MarvelRuinBack',
      'MarvelRuinUpperFloor',
    ],
  ],
  [
    Pieces.marvelBroken,
    [
      'MarvelRuinLeft',
      'MarvelRuinFrontBroken',
      'MarvelRuinBackBroken',
      'MarvelRuinUpperFloor',
    ],
  ],
  [
    Pieces.marvelNoUpper,
    ['MarvelRuinLeft', 'MarvelRuinFront', 'MarvelRuinBack'],
  ],
  [
    Pieces.marvelNoUpperBroken,
    ['MarvelRuinLeft', 'MarvelRuinFrontBroken', 'MarvelRuinBackBroken'],
  ],
]

describe('textured Marvel Ruin model', () => {
  it('embeds UV-mapped base-color textures on all six meshes', () => {
    const glb = readGlbJson('public/marvel-ruin-6-textured.glb')
    expect(glb.meshes.map((mesh) => mesh.name)).toEqual([
      'MarvelRuinLeft',
      'MarvelRuinFront',
      'MarvelRuinBack',
      'MarvelRuinFrontBroken',
      'MarvelRuinBackBroken',
      'MarvelRuinUpperFloor',
    ])

    for (const { name, primitives } of glb.meshes) {
      const primitive = primitives[0]
      expect(primitive.attributes.TEXCOORD_0).toBeDefined()
      const material = glb.materials?.[primitive.material ?? -1]
      expect(material?.doubleSided).toBe(true)
      const textureIndex =
        material?.pbrMetallicRoughness?.baseColorTexture?.index
      expect(textureIndex).toBeDefined()
      const imageIndex = glb.textures?.[textureIndex ?? -1]?.source
      const image = glb.images?.[imageIndex ?? -1]
      expect(image?.mimeType).toBe('image/jpeg')
      expect(image?.bufferView).toBeDefined()
      expect(image?.uri).toBeUndefined()
      expect(glb.bufferViews?.[image?.bufferView ?? -1]).toBeDefined()
      expect(getMeshBounds(glb, name)).toBeDefined()
    }
  })

  it('keeps the original footprint and upper-floor height', () => {
    const newModel = readGlbJson('public/marvel-ruin-6-textured.glb')
    expectBoundsClose(
      originalMarvelBounds.combined,
      getCombinedBounds(newModel),
      [0, 2],
      0.35,
    )
    expectBoundsClose(
      originalMarvelBounds.upperFloor,
      getMeshBounds(newModel, 'MarvelRuinUpperFloor'),
      [1],
      0.2,
    )
  })

  it.each(expectedMeshes)(
    'renders the correct parts for piece %s',
    (id, names) => {
      expect(getMarvelRuinParts(id).meshNames).toEqual(names)
    },
  )
})

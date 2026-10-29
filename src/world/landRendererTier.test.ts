import { describe, expect, it } from 'vitest'
import { getTerrainTextureStrips } from './textures/terrainTextureArrays'
import { getLandRendererMode } from './landRendererTier'

describe('graphics tier land renderer mapping', () => {
  it.each([
    ['low', 'legacy', []],
    ['medium', 'per-hex', ['caps-diffuse.png', 'sides-diffuse.png']],
    [
      'high',
      'per-hex',
      [
        'caps-diffuse-pbr.png',
        'caps-diffuse.png',
        'sides-diffuse.png',
        'caps-orm.png',
        'sides-orm.png',
        'caps-normal.png',
        'sides-normal.png',
      ],
    ],
  ] as const)(
    '%s uses the %s renderer and the expected texture arrays',
    (tier, renderer, textures) => {
      expect(getLandRendererMode(tier)).toBe(renderer)
      expect(getTerrainTextureStrips(tier)).toEqual(textures)
    },
  )

  it('allows the e2e override to force per-hex rendering at Low', () => {
    expect(getLandRendererMode('low', true)).toBe('per-hex')
    expect(getTerrainTextureStrips('low')).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { SETTINGS_DEFAULTS } from '../local-storage/settings'
import { HexTerrain } from '../types'
import { getTerrainTileLetterColor } from '../utils/tileLetters'
import { getGenericTerrainColors } from '../world/maphex/genericTerrainColors'

describe('Generic terrain colors and letter contrast', () => {
  it('resolves independent cap and side colors for each terrain', () => {
    expect(
      getGenericTerrainColors(HexTerrain.generic, SETTINGS_DEFAULTS),
    ).toEqual({
      cap: '#e63cc8',
      side: '#a01e8c',
    })
    expect(
      getGenericTerrainColors(HexTerrain.genericFluid, SETTINGS_DEFAULTS),
    ).toEqual({
      cap: '#ff96e6',
      side: '#c864b4',
    })
    expect(getGenericTerrainColors(HexTerrain.grass, SETTINGS_DEFAULTS)).toBe(
      null,
    )
  })

  it('chooses black or white against each Generic cap color', () => {
    expect(
      getTerrainTileLetterColor(HexTerrain.generic, '#ffffff', '#000000'),
    ).toBe('#000000')
    expect(
      getTerrainTileLetterColor(HexTerrain.generic, '#000000', '#ffffff'),
    ).toBe('#FFFFFF')
    expect(
      getTerrainTileLetterColor(HexTerrain.genericFluid, '#000000', '#ffffff'),
    ).toBe('#000000')
    expect(
      getTerrainTileLetterColor(HexTerrain.genericFluid, '#ffffff', '#000000'),
    ).toBe('#FFFFFF')
  })
})

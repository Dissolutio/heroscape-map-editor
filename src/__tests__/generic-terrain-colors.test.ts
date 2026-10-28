import { describe, expect, it } from 'vitest'
import { SETTINGS_DEFAULTS } from '../local-storage/settings'
import { type DecodedPieceID, HexTerrain } from '../types'
import {
  getSvgHexBorderColor,
  getSvgHexSubLevelBorderColor,
} from '../svg-map/getSvgHexColors'
import { getTerrainTileLetterColor } from '../utils/tileLetters'
import {
  blendHexWithWhite,
  getGenericTerrain2DColors,
  getGenericTerrain2DColorsFromCap,
  getGenericTerrainColors,
} from '../world/maphex/genericTerrainColors'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'

const decodedPiece = (
  inventoryID: string,
  terrain: string,
): DecodedPieceID => ({
  boardPieceID: `${inventoryID}-board-piece`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  boardHexID: '0~0~0',
  pieceCoords: { q: 0, r: 0, s: 0 },
  terrain,
})

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

  it('blends each channel halfway toward white with half-up rounding', () => {
    expect(blendHexWithWhite('#e63cc8')).toBe('#f39ee4')
    expect(blendHexWithWhite('#ff96e6')).toBe('#ffcbf3')
    expect(blendHexWithWhite('#000000')).toBe('#808080')
    expect(blendHexWithWhite('#ffffff')).toBe('#ffffff')
    expect(blendHexWithWhite('#ABCDEF')).toBe('#d5e6f7')
    expect(() => blendHexWithWhite('magenta')).toThrow(
      'Expected a six-digit hex color',
    )
  })

  it('resolves 2D colors from cap settings, not side settings', () => {
    const settings = {
      ...SETTINGS_DEFAULTS,
      genericSolidCapColor: '#00bfff',
      genericSolidSideColor: '#111111',
      genericFluidCapColor: '#00ff00',
      genericFluidSideColor: '#222222',
    }

    expect(getGenericTerrain2DColors(HexTerrain.generic, settings)).toEqual({
      main: '#00bfff',
      subLevel: '#80dfff',
    })
    expect(
      getGenericTerrain2DColors(HexTerrain.genericFluid, settings),
    ).toEqual({
      main: '#00ff00',
      subLevel: '#80ff80',
    })
    expect(
      getGenericTerrain2DColors(HexTerrain.grass, SETTINGS_DEFAULTS),
    ).toBeNull()
  })

  it('resolves SVG colors from the subscribed cap color', () => {
    expect(
      getGenericTerrain2DColorsFromCap(HexTerrain.generic, '#00bfff'),
    ).toEqual({
      main: '#00bfff',
      subLevel: '#80dfff',
    })
    expect(
      getGenericTerrain2DColorsFromCap(HexTerrain.genericFluid, '#00ff00'),
    ).toEqual({
      main: '#00ff00',
      subLevel: '#80ff80',
    })
    expect(
      getGenericTerrain2DColorsFromCap(HexTerrain.grass, '#00bfff'),
    ).toBeNull()
  })

  it('keeps static Generic sub-level colors aligned with default settings', () => {
    expect(svgSubLevelColors[HexTerrain.generic]).toBe('#f39ee4')
    expect(svgSubLevelColors[HexTerrain.genericFluid]).toBe('#ffcbf3')
    expect(svgSubLevelColors[HexTerrain.generic]).toBe(
      getGenericTerrain2DColors(HexTerrain.generic, SETTINGS_DEFAULTS)
        ?.subLevel,
    )
    expect(svgSubLevelColors[HexTerrain.genericFluid]).toBe(
      getGenericTerrain2DColors(HexTerrain.genericFluid, SETTINGS_DEFAULTS)
        ?.subLevel,
    )
  })

  it('uses the fluid outline for Generic fluid at both levels', () => {
    const fluidHex = decodedPiece('gf1', HexTerrain.genericFluid)

    expect(getSvgHexBorderColor(fluidHex)).toBe(svgColors.outlineWater)
    expect(getSvgHexSubLevelBorderColor(fluidHex)).toBe(
      svgSubLevelColors.outlineWater,
    )
  })
})

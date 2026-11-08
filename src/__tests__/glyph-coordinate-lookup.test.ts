import { describe, expect, it } from 'vitest'
import {
  getGlyphExportOptions,
  makeGlyphCoordinateLookup,
} from '../pdf-svg-shared/glyphExportOptions'
import { type BoardHex, HexTerrain, Pieces } from '../types'

const makeHex = (
  q: number,
  r: number,
  terrain: string,
  inventoryID: string,
): BoardHex => ({
  id: `0~${q}~${r}`,
  q,
  r,
  s: -q - r,
  altitude: 0,
  pieceID: `0~${q}~${r}~0~${inventoryID}`,
  inventoryID,
  terrain,
  pieceRotation: 0,
})

describe('glyph coordinate lookup', () => {
  it('matches glyph and non-glyph export options without rescanning the board', () => {
    const glyph = makeHex(0, 0, HexTerrain.glyphPower, Pieces.glyphPower)
    const treasure = makeHex(
      1,
      0,
      HexTerrain.glyphTreasure,
      Pieces.glyphTreasure,
    )
    const coveredLand = makeHex(0, 0, HexTerrain.grass, Pieces.grass1)
    const ordinaryLand = makeHex(2, 0, HexTerrain.grass, Pieces.grass1)
    const coordinates = makeGlyphCoordinateLookup({
      [glyph.id]: glyph,
      [treasure.id]: treasure,
      [ordinaryLand.id]: ordinaryLand,
    })
    const settings = {
      isHideHeightsOnGlyphs: true,
    }

    expect(getGlyphExportOptions(glyph, coordinates, settings)).toEqual({
      hideHeight: true,
    })
    expect(getGlyphExportOptions(coveredLand, coordinates, settings)).toEqual({
      hideHeight: true,
    })
    expect(getGlyphExportOptions(ordinaryLand, coordinates, settings)).toEqual({
      hideHeight: false,
    })
    expect(getGlyphExportOptions(treasure, coordinates, settings)).toEqual({
      hideHeight: true,
    })
  })
})

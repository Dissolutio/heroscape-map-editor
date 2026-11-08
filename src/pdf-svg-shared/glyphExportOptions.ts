import { HexTerrain, type BoardHex, type BoardHexes } from '../types'

export type GlyphExportSettings = {
  isTransparentGlyphSpaces: boolean
  isHideHeightsOnGlyphs: boolean
}

export type GlyphCoordinateLookup = ReadonlySet<string>

const glyphCoordinateKey = (hex: Pick<BoardHex, 'q' | 'r' | 's'>) =>
  `${hex.q},${hex.r},${hex.s}`

export function makeGlyphCoordinateLookup(
  boardHexes: BoardHexes,
): GlyphCoordinateLookup {
  return new Set(
    Object.values(boardHexes)
      .filter(
        (hex) =>
          hex.terrain === HexTerrain.glyphPower ||
          hex.terrain === HexTerrain.glyphTreasure,
      )
      .map(glyphCoordinateKey),
  )
}

export function getGlyphExportOptions(
  hex: Pick<BoardHex, 'q' | 'r' | 's' | 'terrain'>,
  glyphCoordinates: GlyphCoordinateLookup,
  settings: GlyphExportSettings,
) {
  const isGlyph =
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure
  const hasGlyphAtCoordinates =
    isGlyph ||
    (settings.isHideHeightsOnGlyphs &&
      glyphCoordinates.has(glyphCoordinateKey(hex)))

  return {
    isTransparent: isGlyph && settings.isTransparentGlyphSpaces,
    hideHeight: settings.isHideHeightsOnGlyphs && hasGlyphAtCoordinates,
  }
}

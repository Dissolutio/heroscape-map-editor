import { HexTerrain, type BoardHex, type BoardHexes } from '../types'

type GlyphExportSettings = {
  isTransparentGlyphSpaces: boolean
  isHideHeightsOnGlyphs: boolean
}

export function getGlyphExportOptions(
  hex: Pick<BoardHex, 'q' | 'r' | 's' | 'terrain'>,
  boardHexes: BoardHexes,
  settings: GlyphExportSettings,
) {
  const isGlyph =
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure
  const hasGlyphAtCoordinates =
    isGlyph ||
    (settings.isHideHeightsOnGlyphs &&
      Object.values(boardHexes).some(
        (candidate) =>
          candidate.q === hex.q &&
          candidate.r === hex.r &&
          candidate.s === hex.s &&
          (candidate.terrain === HexTerrain.glyphPower ||
            candidate.terrain === HexTerrain.glyphTreasure),
      ))

  return {
    isTransparent: isGlyph && settings.isTransparentGlyphSpaces,
    hideHeight: settings.isHideHeightsOnGlyphs && hasGlyphAtCoordinates,
  }
}

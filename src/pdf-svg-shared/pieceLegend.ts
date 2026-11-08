import { piecesSoFar } from '../data/pieces'
import { HexTerrain, Pieces } from '../types'
import { getLaurAddonExportSymbol } from './laurAddonExportSymbol'

export type PdfPieceLegendSymbol =
  | 'hex'
  | 'glyph'
  | 'start-zone'
  | 'ladder'
  | 'rope-ladder'
  | 'laur-long'
  | 'laur-arch'
  | 'laur-short'
  | 'laur-ruin'

export const getPieceExportSymbol = (
  inventoryID: string,
): PdfPieceLegendSymbol | undefined => {
  const piece = piecesSoFar[inventoryID]
  if (!piece) return undefined

  if (
    piece.landPrefix ||
    inventoryID === Pieces.tree11 ||
    inventoryID === Pieces.tree12 ||
    inventoryID === Pieces.glacier1 ||
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1 ||
    inventoryID === Pieces.toxicOutcrop1
  ) {
    return 'hex'
  }

  if (
    piece.terrain === HexTerrain.glyphPower ||
    piece.terrain === HexTerrain.glyphTreasure
  ) {
    return 'glyph'
  }
  if (piece.terrain === HexTerrain.startZone) return 'start-zone'
  if (inventoryID === Pieces.ropeLadder) return 'rope-ladder'
  if (piece.terrain === HexTerrain.ladder) return 'ladder'

  const laurSymbol = getLaurAddonExportSymbol(inventoryID)
  if (laurSymbol === 'long') return 'laur-long'
  if (laurSymbol === 'arch') return 'laur-arch'
  if (laurSymbol === 'short') return 'laur-short'
  if (laurSymbol === 'ruin') return 'laur-ruin'

  return undefined
}

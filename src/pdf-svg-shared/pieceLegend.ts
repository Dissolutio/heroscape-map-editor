import { piecesSoFar } from '../data/pieces'
import type { BoardPiece, Piece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { getLaurAddonExportSymbol } from './laurAddonExportSymbol'

export type PdfPieceLegendCategory = 'land' | 'obstacles' | 'abstract'

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

export type PdfPieceLegendEntry = {
  inventoryID: string
  title: string
  terrain: string
  count: number
  category: PdfPieceLegendCategory
  symbol?: PdfPieceLegendSymbol
  glyphLetter?: string
}

const getPieceCategory = (
  inventoryID: string,
  piece: Piece,
): PdfPieceLegendCategory => {
  if (piece.landPrefix) return 'land'
  if (getLaurAddonExportSymbol(inventoryID)) return 'obstacles'
  if (
    piece.terrain === HexTerrain.glyphPower ||
    piece.terrain === HexTerrain.glyphTreasure ||
    piece.terrain === HexTerrain.startZone ||
    piece.terrain === HexTerrain.ladder ||
    piece.terrain === HexTerrain.ropeLadder ||
    piece.isOverlayPiece ||
    !piece.isObstaclePiece
  ) {
    return 'abstract'
  }
  return 'obstacles'
}

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

export const getPdfPieceLegendEntries = (
  boardPieces: Pick<BoardPiece, 'inventoryID'>[],
): PdfPieceLegendEntry[] => {
  const entries = new Map<string, PdfPieceLegendEntry>()
  for (const boardPiece of boardPieces) {
    const inventoryID = boardPiece.inventoryID
    const piece = piecesSoFar[inventoryID]
    if (!piece) continue

    const existing = entries.get(inventoryID)
    if (existing) {
      existing.count += 1
      continue
    }

    entries.set(inventoryID, {
      inventoryID,
      title: piece.title || inventoryID,
      terrain: piece.terrain,
      count: 1,
      category: getPieceCategory(inventoryID, piece),
      symbol: getPieceExportSymbol(inventoryID),
      glyphLetter: piece.glyphLetter,
    })
  }

  const categoryOrder: Record<PdfPieceLegendCategory, number> = {
    land: 0,
    obstacles: 1,
    abstract: 2,
  }
  return [...entries.values()].sort(
    (a, b) =>
      categoryOrder[a.category] - categoryOrder[b.category] ||
      a.title.localeCompare(b.title),
  )
}

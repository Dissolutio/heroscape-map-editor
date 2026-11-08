import { HexTerrain, type BoardPiece } from '../types'
import { piecesSoFar } from './pieces'

export const START_ZONES_HIDDEN_MESSAGE =
  'Start zones are hidden in 3D. Turn them on in the View tab.'
export const GLYPHS_HIDDEN_MESSAGE =
  'Glyphs are hidden in 3D. Turn them on in the View tab.'

export function isStartZoneBoardPiece(
  piece: Pick<BoardPiece, 'inventoryID'> | null | undefined,
) {
  return piecesSoFar[piece?.inventoryID ?? '']?.terrain === HexTerrain.startZone
}

export function isGlyphBoardPiece(
  piece: Pick<BoardPiece, 'inventoryID'> | null | undefined,
) {
  const terrain = piecesSoFar[piece?.inventoryID ?? '']?.terrain
  return (
    terrain === HexTerrain.glyphPower || terrain === HexTerrain.glyphTreasure
  )
}

export function shouldRenderPlacedPiece(
  piece: Pick<BoardPiece, 'inventoryID'>,
  isShowStartZones: boolean,
  isShowGlyphs = true,
) {
  return (
    (isShowStartZones || !isStartZoneBoardPiece(piece)) &&
    (isShowGlyphs || !isGlyphBoardPiece(piece))
  )
}

export function filterVisiblePieceIDs(
  selectedPieceIDs: readonly string[],
  boardPieces: readonly BoardPiece[],
  isShowStartZones: boolean,
  isShowGlyphs = true,
) {
  if (isShowStartZones && isShowGlyphs) return [...selectedPieceIDs]

  const hiddenPieceUIDs = new Set(
    boardPieces
      .filter(
        (piece) =>
          (!isShowStartZones && isStartZoneBoardPiece(piece)) ||
          (!isShowGlyphs && isGlyphBoardPiece(piece)),
      )
      .map((piece) => piece.uid),
  )
  return selectedPieceIDs.filter((uid) => !hiddenPieceUIDs.has(uid))
}

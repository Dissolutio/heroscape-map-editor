import { HexTerrain, type BoardPiece } from '../types'
import { piecesSoFar } from './pieces'

export const START_ZONES_HIDDEN_MESSAGE =
  'Start zones are hidden in 3D. Turn them on in the View tab.'

export function isStartZoneBoardPiece(
  piece: Pick<BoardPiece, 'inventoryID'> | null | undefined,
) {
  return piecesSoFar[piece?.inventoryID ?? '']?.terrain === HexTerrain.startZone
}

export function shouldRenderPlacedPiece(
  piece: Pick<BoardPiece, 'inventoryID'>,
  isShowStartZones: boolean,
) {
  return isShowStartZones || !isStartZoneBoardPiece(piece)
}

export function filterVisiblePieceIDs(
  selectedPieceIDs: readonly string[],
  boardPieces: readonly BoardPiece[],
  isShowStartZones: boolean,
) {
  if (isShowStartZones) return [...selectedPieceIDs]

  const hiddenStartZoneUIDs = new Set(
    boardPieces.filter(isStartZoneBoardPiece).map((piece) => piece.uid),
  )
  return selectedPieceIDs.filter((uid) => !hiddenStartZoneUIDs.has(uid))
}

import { piecesSoFar } from '../data/pieces'
import type { BoardHex, BoardHexes, BoardPiece } from '../types'
import { isFluidTerrainHex, isSolidTerrainHex } from './board-utils'
import { makeBuriedStatusChecker, type BuriedStatus } from './buriedStatus'

export type BuriedMarksByUID = ReadonlyMap<string, string>

export const getBuriedTileMarks = (
  boardPiece: BoardPiece | undefined,
  status: BuriedStatus | null,
) => {
  if (!boardPiece || !status) return ''
  const piece = piecesSoFar[boardPiece.inventoryID]
  if (
    !piece ||
    piece.isObstaclePiece ||
    piece.isOverlayPiece ||
    (!isSolidTerrainHex(piece.terrain) && !isFluidTerrainHex(piece.terrain))
  ) {
    return ''
  }
  return `${status.isBuried ? '*' : ''}${status.isSubterrainBuried ? '†' : ''}`
}

export const makeBuriedMarksByUID = (
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
): BuriedMarksByUID => {
  const checkBuriedStatus = makeBuriedStatusChecker(boardHexes, boardPieces)
  return new Map(
    boardPieces.map((boardPiece) => [
      boardPiece.uid,
      getBuriedTileMarks(boardPiece, checkBuriedStatus(boardPiece)),
    ]),
  )
}

export const getBuriedMarksForHex = (
  hex: BoardHex,
  viewingLevel: number,
  marksByUID: BuriedMarksByUID,
) => {
  if (
    hex.altitude !== viewingLevel ||
    !hex.isObstacleOrigin ||
    hex.isObstacleAuxiliary ||
    hex.isVerticalClearanceHex ||
    !hex.boardPieceUID
  ) {
    return ''
  }
  return marksByUID.get(hex.boardPieceUID) ?? ''
}

export const BURIED_MARKS_KEY =
  '* = top will be covered. † = sides will be covered. Both = fully hidden; any same-size, same-kind tile works (solid for solid, fluid for fluid).'

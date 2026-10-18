import type { BoardHexes, BoardPieces, CubeCoordinate, Piece } from '../types'
import { addPiece } from './addPiece'
import { piecesSoFar } from './pieces'
import { computeConflictedPieceUIDs } from './rebuildBoardState'
import { removePiece } from './removePiece'

export type MovePieceArgs = {
  uid: string
  newPieceCoords: CubeCoordinate
  newAltitude?: number
  newRotation?: number
}

type MoveBoard = {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
  conflictedPieceUIDs: string[]
}

export type MovedBoard = MoveBoard & {
  /** The highest altitude a piece was placed at (for the viewing level). */
  highestAltitude: number
}

/**
 * Moves one or more placed pieces at once (the store's movePiece and
 * movePieces). Every moving piece is lifted off the board first, so moving
 * pieces never collide with each other's old spots; pieces they displaced
 * before are put back; then the movers are placed again, lowest new
 * altitude first (ties in the order given), permissively like painting, so
 * a mover may still displace a piece that stays.
 *
 * Returns null, touching nothing, when no move names a known piece. A uid
 * given twice moves by its first entry. `addPiece` and `removePiece` edit
 * the hex objects they are given; inside the store those are Immer drafts.
 */
export function applyPieceMoves(
  board: MoveBoard,
  moves: MovePieceArgs[],
): MovedBoard | null {
  // 1. Resolve every move against the starting board
  const resolved: {
    order: number
    uid: string
    piece: Piece
    coords: CubeCoordinate
    altitude: number
    rotation: number
  }[] = []
  for (const [order, move] of moves.entries()) {
    if (resolved.some((m) => m.uid === move.uid)) continue
    const boardPiece = board.boardPieces.find((bp) => bp.uid === move.uid)
    const piece = boardPiece && piecesSoFar[boardPiece.inventoryID]
    if (!boardPiece || !piece) continue
    resolved.push({
      order,
      uid: move.uid,
      piece,
      coords: move.newPieceCoords,
      altitude: move.newAltitude ?? boardPiece.altitude,
      rotation: move.newRotation ?? boardPiece.rotation,
    })
  }
  if (!resolved.length) return null
  const movingUIDs = new Set(resolved.map((m) => m.uid))

  // 2. Remove every moving piece, clearing its hex ownership
  let workingHexes = board.boardHexes
  let workingPieces = board.boardPieces
  for (const { uid } of resolved) {
    const removed = removePiece({
      uid,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
    })
    workingHexes = removed.newBoardHexes
    workingPieces = removed.newBoardPieces
  }

  // 3. Restore hexes for every previously-conflicted piece that stays.
  //    When a mover overwrote another's hexes, those hexes carried the
  //    mover's UID (or are gone after step 2). Remove each conflicted piece
  //    from boardPieces then re-add it so its hex entries are fresh.
  for (const conflictedUID of board.conflictedPieceUIDs) {
    if (movingUIDs.has(conflictedUID)) continue
    const conflictedBP = workingPieces.find((bp) => bp.uid === conflictedUID)
    if (!conflictedBP) continue
    const conflictedPiece = piecesSoFar[conflictedBP.inventoryID]
    if (!conflictedPiece) continue
    const removed = removePiece({
      uid: conflictedUID,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
    })
    const added = addPiece({
      piece: conflictedPiece,
      boardHexes: removed.newBoardHexes,
      boardPieces: removed.newBoardPieces,
      pieceCoords: conflictedBP.pieceCoords,
      placementAltitude: conflictedBP.altitude,
      rotation: conflictedBP.rotation,
      isVsTile: false,
      uid: conflictedUID,
      permissive: true,
    })
    workingHexes = added.newBoardHexes
    workingPieces = added.newBoardPieces
  }

  // 4. Place the movers again, lowest new altitude first
  const placingOrder = [...resolved].sort(
    (a, b) => a.altitude - b.altitude || a.order - b.order,
  )
  for (const move of placingOrder) {
    const placed = addPiece({
      piece: move.piece,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
      pieceCoords: move.coords,
      placementAltitude: move.altitude,
      rotation: move.rotation,
      isVsTile: false,
      uid: move.uid,
      permissive: true,
    })
    workingHexes = placed.newBoardHexes
    workingPieces = placed.newBoardPieces
  }

  return {
    boardHexes: workingHexes,
    boardPieces: workingPieces,
    // Recompute globally so move and paint use the same conflict source of truth.
    conflictedPieceUIDs: computeConflictedPieceUIDs(workingPieces),
    highestAltitude: Math.max(...resolved.map((m) => m.altitude)),
  }
}

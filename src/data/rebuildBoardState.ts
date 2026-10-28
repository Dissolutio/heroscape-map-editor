import type { MapState } from '../types'
import { normalizeBoardPieces } from '../utils/map-utils'
import { addPiece } from './addPiece'
import { piecesSoFar } from './pieces'
import { evaluateLaurAddonConflicts } from './laurAddonConflicts'

/** Just the list of conflicted piece uids from a full replay. */
export function computeConflictedPieceUIDs(
  boardPieces: MapState['boardPieces'],
) {
  const { conflictedPieceUIDs } = rebuildBoardStateFromPieces(boardPieces)
  return conflictedPieceUIDs
}

/**
 * Replay `boardPieces`, in array order, onto an empty board using permissive
 * placement (the same mode the app paints and loads with), and report which
 * pieces ended up in conflict.
 *
 * Rules this encodes, which the tests in src/__tests__/replay-conflicts.test.ts
 * pin down:
 *  - A hex has one owner, so a later piece takes over a contested hex and both
 *    it and the piece it displaced are reported as conflicted.
 *  - Pieces whose inventoryID is not registered are skipped (and therefore
 *    absent from the returned boardPieces).
 *  - Laur add-on edges and verified footprints also contribute conflicts.
 *
 * (Moved verbatim out of store/map-slice.ts so it can be tested without
 * constructing the zustand store.)
 */
export function rebuildBoardStateFromPieces(
  boardPieces: MapState['boardPieces'],
) {
  const conflicts = new Set<string>()
  let workingHexes: MapState['boardHexes'] = {}
  let workingPieces: MapState['boardPieces'] = []

  for (const boardPiece of normalizeBoardPieces(boardPieces)) {
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) continue

    const result = addPiece({
      piece,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
      pieceCoords: boardPiece.pieceCoords,
      placementAltitude: boardPiece.altitude,
      rotation: boardPiece.rotation,
      isVsTile: false,
      uid: boardPiece.uid,
      permissive: true,
    })

    workingHexes = result.newBoardHexes
    workingPieces = result.newBoardPieces
    for (const displacedUID of result.displacedUIDs ?? []) {
      conflicts.add(displacedUID)
      conflicts.add(boardPiece.uid)
    }
  }

  for (const uid of evaluateLaurAddonConflicts(workingPieces, workingHexes)) {
    conflicts.add(uid)
  }

  return {
    boardHexes: workingHexes,
    boardPieces: workingPieces,
    conflictedPieceUIDs: [...conflicts],
  }
}

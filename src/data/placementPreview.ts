import type { BoardHex, Piece } from '../types'
import { evaluateLaurAddonConflicts } from './laurAddonConflicts'
import { isLaurAddonSupported } from './laurAddonSupport'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import {
  type PlacementEvaluation,
  type PlacementResolution,
  evaluatePlacement,
  resolvePlacement,
} from './placement'
import type { PlacementBoard } from './placement'

export type PlacementPreviewState = {
  resolution: PlacementResolution
  evaluation: PlacementEvaluation
  unsupported: boolean
}

export function getPlacementPreviewState(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  board: PlacementBoard,
  worldPoint?: { x: number; z: number },
): PlacementPreviewState {
  const resolution = resolvePlacement(piece, pointerHex, rotation, board, {
    deferOffMapCheck: true,
    worldPoint,
  })
  const evaluation = evaluatePlacement(board, resolution)
  let unsupported = false
  if (isLaurWallAddonPieceID(piece.id) && !('blocked' in resolution)) {
    const previewPiece = {
      uid: 'placement-preview-laur-addon',
      inventoryID: piece.id,
      altitude: resolution.altitude,
      rotation: resolution.rotation,
      pieceCoords: resolution.coords,
    }
    unsupported = isLaurAddonSupported(board, previewPiece) === 'unsupported'
    const conflicted = evaluateLaurAddonConflicts(
      [...board.boardPieces, previewPiece],
      board.boardHexes,
    ).includes(previewPiece.uid)
    if (conflicted && evaluation.status !== 'blocked') {
      evaluation.status = 'conflict'
      evaluation.reason = 'Conflicts with a Laur add-on'
    }
    if (unsupported) {
      const supportReason = 'Missing required Laur pillar ports'
      evaluation.reason = evaluation.reason
        ? `${evaluation.reason}; ${supportReason}`
        : supportReason
    }
  }
  return {
    resolution,
    evaluation,
    unsupported,
  }
}

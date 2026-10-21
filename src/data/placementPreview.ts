import type { BoardHex, Piece } from '../types'
import { evaluateLaurAddonConflicts } from './laurAddonConflicts'
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
  if (isLaurWallAddonPieceID(piece.id) && !('blocked' in resolution)) {
    const previewPiece = {
      uid: 'placement-preview-laur-addon',
      inventoryID: piece.id,
      altitude: resolution.altitude,
      rotation: resolution.rotation,
      pieceCoords: resolution.coords,
    }
    const conflicted = evaluateLaurAddonConflicts(
      [...board.boardPieces, previewPiece],
      board.boardHexes,
    ).includes(previewPiece.uid)
    if (conflicted && evaluation.status !== 'blocked') {
      evaluation.status = 'conflict'
      evaluation.reason = 'Overlaps a Laur add-on footprint'
    }
  }
  return {
    resolution,
    evaluation,
  }
}

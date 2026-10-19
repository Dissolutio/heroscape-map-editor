import type { BoardHex, Piece } from '../types'
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
): PlacementPreviewState {
  const resolution = resolvePlacement(piece, pointerHex, rotation, board, {
    deferOffMapCheck: true,
  })
  return {
    resolution,
    evaluation: evaluatePlacement(board, resolution),
  }
}

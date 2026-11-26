import type { BoardHex, Piece } from '../types'
import { Pieces } from '../types'
import { evaluateLaurAddonConflicts } from './laurAddonConflicts'
import { isLaurAddonSupported } from './laurAddonSupport'
import { getPortAddon, isPortAddonPieceID } from './portPieces'
import {
  evaluateShipWallSupport,
  getShipWallSupportReasons,
} from './shipWallSupport'
import {
  type PlacementEvaluation,
  type ResolvedPlacement,
  type PlacementResolution,
  evaluatePlacementPlan,
  resolvePlacementPlan,
} from './placement'
import type { PlacementBoard } from './placement'

export type PlacementPreviewState = {
  resolution: PlacementResolution
  evaluation: PlacementEvaluation
  unsupported: boolean
  automaticBases?: ResolvedPlacement[]
}

export function getPlacementPreviewState(
  piece: Piece,
  pointerHex: BoardHex,
  rotation: number,
  board: PlacementBoard,
  worldPoint?: { x: number; z: number },
): PlacementPreviewState {
  const plan = resolvePlacementPlan(piece, pointerHex, rotation, board, {
    deferOffMapCheck: true,
    worldPoint,
  })
  const { resolution } = plan
  const evaluation = evaluatePlacementPlan(board, plan)
  let unsupported = false
  if (isPortAddonPieceID(piece.id) && !('blocked' in resolution)) {
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
      const supportReason =
        getPortAddon(piece.id)?.family === 'void'
          ? 'Missing required pylon ports'
          : 'Missing required Laur pillar ports'
      evaluation.reason = evaluation.reason
        ? `${evaluation.reason}; ${supportReason}`
        : supportReason
    }
  }
  if (piece.id === Pieces.shipWall && !('blocked' in resolution)) {
    // Ship Walls may be placed anywhere; this only flags them amber.
    const support = evaluateShipWallSupport(
      {
        altitude: resolution.altitude,
        rotation: resolution.rotation,
        pieceCoords: resolution.coords,
      },
      board.boardHexes,
      board.boardPieces,
    )
    unsupported = !support.supported
    if (unsupported) {
      const supportReason = getShipWallSupportReasons(support).join('; ')
      evaluation.reason = evaluation.reason
        ? `${evaluation.reason}; ${supportReason}`
        : supportReason
    }
  }
  return {
    resolution,
    evaluation,
    unsupported,
    ...(plan.automaticBases ? { automaticBases: plan.automaticBases } : {}),
  }
}

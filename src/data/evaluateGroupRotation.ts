import type { BoardHex, BoardPiece, CubeCoordinate, Piece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import type { HexEdgeId } from './hexGrid/edgesAndNodes'
import { getPieceEdgeAnchor, getPieceEdgeId } from './hexGrid/pieceFeatures'
import type { MovePieceArgs } from './movePieces'
import { piecesSoFar } from './pieces'
import {
  type PlacementBlockedReason,
  type PlacementBoard,
  type ResolvedPlacement,
  evaluatePlacement,
  isPlacementBlocked,
  resolvePlacement,
} from './placement'

function getTargetHex(
  board: PlacementBoard,
  coords: MovePieceArgs['newPieceCoords'],
  altitude: number,
  movingUIDs: Set<string>,
): BoardHex | undefined {
  for (
    let candidateAltitude = altitude;
    candidateAltitude >= 0;
    candidateAltitude -= 0.5
  ) {
    const hex =
      board.boardHexes[
        genBoardHexID({ ...coords, altitude: candidateAltitude })
      ]
    if (!hex) continue
    if (!movingUIDs.has(hex.boardPieceUID ?? '')) return hex
  }
}

function getResolverTarget(
  piece: Piece,
  coords: CubeCoordinate,
  rotation: number,
  edgeId?: HexEdgeId,
) {
  if (
    piece.id !== Pieces.battlement &&
    piece.id !== Pieces.roadWall &&
    piece.terrain !== HexTerrain.ropeLadder
  ) {
    return { coords, altitudeOffset: 1 }
  }

  const resolvedEdgeId =
    edgeId ??
    getPieceEdgeId({
      inventoryID: piece.id,
      pieceCoords: coords,
      rotation,
    }) ??
    undefined
  const supportCoords =
    getPieceEdgeAnchor({
      inventoryID: piece.id,
      pieceCoords: coords,
      rotation,
    }) ?? coords
  return {
    coords: supportCoords,
    altitudeOffset: 1,
    edgeId: resolvedEdgeId,
  }
}

export function getGroupRotationBlockedReason(
  board: PlacementBoard,
  selectedPieces: readonly BoardPiece[],
  moves: readonly MovePieceArgs[],
): PlacementBlockedReason | undefined {
  const movingUIDs = new Set(selectedPieces.map((piece) => piece.uid))
  const ignoredUIDs = [...movingUIDs]

  for (const move of moves) {
    const boardPiece = selectedPieces.find((piece) => piece.uid === move.uid)
    if (!boardPiece) {
      throw new Error(`Rotation move ${move.uid} is not in the selected pieces`)
    }
    const piece = piecesSoFar[boardPiece.inventoryID]
    if (!piece) {
      throw new Error(`Missing piece definition for ${boardPiece.inventoryID}`)
    }

    const rotation = move.newRotation ?? boardPiece.rotation
    const altitude = move.newAltitude ?? boardPiece.altitude
    const resolverTarget = getResolverTarget(
      piece,
      move.newPieceCoords,
      rotation,
      move.newEdgeId,
    )
    const targetHex = getTargetHex(
      board,
      resolverTarget.coords,
      altitude + resolverTarget.altitudeOffset,
      movingUIDs,
    )
    if (!targetHex) return 'offMap'
    const resolved = resolvePlacement(piece, targetHex, rotation, board, {
      ignoreUID: ignoredUIDs,
      deferOffMapCheck: true,
      edgeId: resolverTarget.edgeId,
    })
    if (isPlacementBlocked(resolved)) return resolved.blocked
    const resolution: ResolvedPlacement = {
      ...resolved,
      coords: move.newPieceCoords,
      altitude,
      rotation,
    }

    const evaluation = evaluatePlacement(board, resolution, {
      ignoreUID: ignoredUIDs,
      checkHeightBounds: true,
    })
    if (evaluation.status === 'blocked') {
      if (!evaluation.reason) {
        throw new Error(`Blocked rotation for ${move.uid} has no reason`)
      }
      return evaluation.reason as PlacementBlockedReason
    }
  }
}

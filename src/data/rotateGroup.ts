import type { BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { type HexEdgeId, edgeIdFromHex } from './hexGrid/edgesAndNodes'
import { getPieceEdgeAnchor, getPieceEdgeId } from './hexGrid/pieceFeatures'
import { hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import type { MovePieceArgs } from './movePieces'

export function rotateCubeCoordinate(
  coords: CubeCoordinate,
  direction: 1 | -1,
): CubeCoordinate {
  return hexUtilsRotateAroundOrigin_000(coords, direction === 1 ? 1 : 5)
}

function rotateAroundPivot(
  coords: CubeCoordinate,
  pivot: CubeCoordinate,
  direction: 1 | -1,
) {
  const relative = {
    q: coords.q - pivot.q,
    r: coords.r - pivot.r,
    s: coords.s - pivot.s,
  }
  const rotated = rotateCubeCoordinate(relative, direction)
  return {
    q: pivot.q + rotated.q,
    r: pivot.r + rotated.r,
    s: pivot.s + rotated.s,
  }
}

function rotatedEdgeId(
  piece: BoardPiece,
  pivot: CubeCoordinate,
  direction: 1 | -1,
): HexEdgeId | undefined {
  if (
    piece.inventoryID !== Pieces.battlement &&
    piece.inventoryID !== Pieces.roadWall &&
    piece.inventoryID !== Pieces.ropeLadder
  ) {
    return undefined
  }
  const edgeId = getPieceEdgeId(piece)
  const anchor = getPieceEdgeAnchor(piece)
  if (!edgeId || !anchor) return undefined
  const edgeIndex = Array.from({ length: 6 }, (_, index) => index).find(
    (index) => edgeIdFromHex(anchor, index) === edgeId,
  )
  if (edgeIndex === undefined) return undefined
  return edgeIdFromHex(
    rotateAroundPivot(anchor, pivot, direction),
    edgeIndex + direction,
  )
}

export function rotateGroupAroundPivot(
  boardPieces: readonly BoardPiece[],
  pivot: string | CubeCoordinate,
  direction: 1 | -1,
): MovePieceArgs[] {
  let pivotCoords: CubeCoordinate
  if (typeof pivot === 'string') {
    const pivotPiece = boardPieces.find((piece) => piece.uid === pivot)
    if (!pivotPiece) {
      throw new Error(`Rotation pivot ${pivot} is not in the selected pieces`)
    }
    pivotCoords = pivotPiece.pieceCoords
  } else {
    pivotCoords = pivot
  }

  return boardPieces.map((piece) => {
    const relative = {
      q: piece.pieceCoords.q - pivotCoords.q,
      r: piece.pieceCoords.r - pivotCoords.r,
      s: piece.pieceCoords.s - pivotCoords.s,
    }
    const rotated = rotateCubeCoordinate(relative, direction)
    const newPieceCoords = {
      q: pivotCoords.q + rotated.q,
      r: pivotCoords.r + rotated.r,
      s: pivotCoords.s + rotated.s,
    }
    const newRotation = (((piece.rotation + direction) % 6) + 6) % 6
    const newEdgeId = rotatedEdgeId(piece, pivotCoords, direction)
    return {
      uid: piece.uid,
      newPieceCoords,
      newRotation,
      ...(newEdgeId === undefined ? {} : { newEdgeId }),
    }
  })
}

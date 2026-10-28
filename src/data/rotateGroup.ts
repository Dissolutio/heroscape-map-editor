import type { BoardPiece, CubeCoordinate } from '../types'
import { hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import type { MovePieceArgs } from './movePieces'

export function rotateCubeCoordinate(
  coords: CubeCoordinate,
  direction: 1 | -1,
): CubeCoordinate {
  return hexUtilsRotateAroundOrigin_000(coords, direction === 1 ? 1 : 5)
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
    return {
      uid: piece.uid,
      newPieceCoords: {
        q: pivotCoords.q + rotated.q,
        r: pivotCoords.r + rotated.r,
        s: pivotCoords.s + rotated.s,
      },
      newRotation: (((piece.rotation + direction) % 6) + 6) % 6,
    }
  })
}

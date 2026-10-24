import type { BoardPiece } from '../types'
import { hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import type { MovePieceArgs } from './movePieces'

export function rotateGroupAroundPivot(
  boardPieces: readonly BoardPiece[],
  pivotUID: string,
  direction: 1 | -1,
): MovePieceArgs[] {
  const pivot = boardPieces.find((piece) => piece.uid === pivotUID)
  if (!pivot) {
    throw new Error(`Rotation pivot ${pivotUID} is not in the selected pieces`)
  }

  return boardPieces.map((piece) => {
    const relative = {
      q: piece.pieceCoords.q - pivot.pieceCoords.q,
      r: piece.pieceCoords.r - pivot.pieceCoords.r,
      s: piece.pieceCoords.s - pivot.pieceCoords.s,
    }
    const rotated = hexUtilsRotateAroundOrigin_000(
      relative,
      direction === 1 ? 1 : 5,
    )
    return {
      uid: piece.uid,
      newPieceCoords: {
        q: pivot.pieceCoords.q + rotated.q,
        r: pivot.pieceCoords.r + rotated.r,
        s: pivot.pieceCoords.s + rotated.s,
      },
      newRotation: (((piece.rotation + direction) % 6) + 6) % 6,
    }
  })
}

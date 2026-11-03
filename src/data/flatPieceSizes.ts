import type { Dictionary } from 'lodash'
import type { Piece } from '../types'
import { piecesSoFar } from './pieces'

const landSizes = Object.values(piecesSoFar).reduce(
  (prev, curr) => {
    //  the presence of a landPrefix on a piece's data means it has flat-piece-sizes
    const landPrefix = curr.landPrefix
    if (landPrefix) {
      prev[landPrefix] = [...(prev[landPrefix as string] ?? []), curr.size]
      return prev
    }
    return prev
  },
  {} as Dictionary<number[]>,
)

const pieceSizeFamilies = Object.values(piecesSoFar).reduce(
  (families, piece) => {
    if (!piece.pieceSizeFamily) return families
    families[piece.pieceSizeFamily] = [
      ...(families[piece.pieceSizeFamily] ?? []),
      piece,
    ]
    return families
  },
  {} as Dictionary<Piece[]>,
)

const getObstaclePieceSizes = (mode: string) => {
  const familyName = piecesSoFar[mode]?.pieceSizeFamily
  if (!familyName) return []
  const pieces = pieceSizeFamilies[familyName]
  const sizes = [...new Set(pieces.map((piece) => piece.size))].sort(
    (a, b) => a - b,
  )
  return sizes.length > 1 ? sizes : []
}

export const getPieceSizeOptionsForPenMode = (mode: string) =>
  landSizes[mode] ?? getObstaclePieceSizes(mode)

export const getPieceIDForPenMode = (mode: string, size: number) => {
  if (!size) return mode

  const piece = piecesSoFar[mode]
  if (piece?.pieceSizeFamily) {
    if (piece.size === size) return mode
    return (
      pieceSizeFamilies[piece.pieceSizeFamily].find(
        (familyPiece) => familyPiece.size === size,
      )?.id ?? mode
    )
  }

  return `${mode}${size}`
}

export const getNewPieceSizeForPenMode = (
  newMode: string,
  oldMode: string,
  oldPieceSize: number,
): { newSize: number; newSizes: number[] } => {
  /*
    Returns a new piece size, and an array of piece sizes 
    OR
    a piece size of ZERO, and an empty array 
  */
  const newPieceSizes = getPieceSizeOptionsForPenMode(newMode)
  if (!(newPieceSizes.length > 0)) {
    return { newSize: 0, newSizes: [] }
  }
  const obstaclePiece = piecesSoFar[newMode]
  if (obstaclePiece?.pieceSizeFamily) {
    return { newSize: obstaclePiece.size, newSizes: newPieceSizes }
  }
  if (newPieceSizes.includes(oldPieceSize)) {
    return { newSize: oldPieceSize, newSizes: newPieceSizes }
  }
  const oldIndex = landSizes?.[oldMode]?.indexOf(oldPieceSize)
  return {
    newSize: newPieceSizes?.[oldIndex] ?? newPieceSizes[0],
    newSizes: newPieceSizes,
  }
}

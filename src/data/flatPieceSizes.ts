import type { Dictionary } from 'lodash'
import type { Piece } from '../types'
import { piecesSoFar } from './pieces'

const landSizes = Object.values(piecesSoFar).reduce(
  (prev, curr) => {
    // The presence of a landPrefix means the piece has flat piece sizes.
    const landPrefix = curr.landPrefix
    if (landPrefix) {
      prev[landPrefix] = [...(prev[landPrefix as string] ?? []), curr.size]
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

const getObstaclePieceVariants = (mode: string) => {
  const familyName = piecesSoFar[mode]?.pieceSizeFamily
  if (!familyName) return []
  return [...pieceSizeFamilies[familyName]].sort(
    (a, b) => (a.variantOrder ?? 0) - (b.variantOrder ?? 0),
  )
}

export const isObstacleVariantFamily = (mode: string) =>
  Boolean(piecesSoFar[mode]?.pieceSizeFamily)

export const getPieceVariantForPenMode = (mode: string, variant: number) => {
  const piece = piecesSoFar[mode]
  if (!piece?.pieceSizeFamily) return piecesSoFar[`${mode}${variant}`]
  return getObstaclePieceVariants(mode).find(
    (familyPiece) => familyPiece.variantOrder === variant,
  )
}

export const getPieceSizeOptionsForPenMode = (mode: string) => {
  const variants = getObstaclePieceVariants(mode)
  if (variants.length) return variants.map((_, index) => index + 1)
  return landSizes[mode] ?? []
}

export const getPieceIDForPenMode = (mode: string, size: number) => {
  if (!size) return mode

  const piece = piecesSoFar[mode]
  if (piece?.pieceSizeFamily) {
    return getPieceVariantForPenMode(mode, size)?.id ?? mode
  }

  return `${mode}${size}`
}

export const getNextPieceSizeOption = (
  currentSize: number,
  options: number[],
  direction: 1 | -1,
) => {
  if (options.length === 0) return null
  const currentIndex = options.indexOf(currentSize)
  const startIndex = currentIndex === -1 ? 0 : currentIndex
  return options[(startIndex + direction + options.length) % options.length]
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
  const newPiece = piecesSoFar[newMode]
  if (newPiece?.pieceSizeFamily) {
    return {
      newSize: newPiece.variantOrder ?? newPieceSizes[0],
      newSizes: newPieceSizes,
    }
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

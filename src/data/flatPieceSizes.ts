import { Dictionary } from 'lodash'
import { piecesSoFar } from './pieces'

const landSizes = Object.values(piecesSoFar).reduce(
  (prev, curr) => {
    const landPrefix = curr.landPrefix
    if (landPrefix) {
      return {
        ...prev,
        [landPrefix]: [...(prev?.[landPrefix as string] ?? []), curr.size],
      }
    }
    return prev
  },
  {} as Dictionary<number[]>,
)
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
  const terrainsWithFlatPieceSizes = Object.keys(landSizes).filter((t) => {
    return landSizes[t].length > 0
  })
  const newPieceSizes = terrainsWithFlatPieceSizes.includes(newMode)
    ? landSizes[newMode]
    : []
  if (!(newPieceSizes.length > 0)) {
    return { newSize: 0, newSizes: [] }
  }
  if (newPieceSizes.includes(oldPieceSize)) {
    return { newSize: oldPieceSize, newSizes: newPieceSizes }
  } else {
    const oldIndex = landSizes?.[oldMode]?.indexOf(oldPieceSize)
    return {
      newSize: newPieceSizes?.[oldIndex] ?? newPieceSizes[0],
      newSizes: newPieceSizes,
    }
  }
}

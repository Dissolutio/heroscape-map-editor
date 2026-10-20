import type { BoardPiece, BoardPieces, HexMap } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

export type MapDimension = 'length' | 'width'

export function resizeMap(
  hexMap: HexMap,
  boardPieces: BoardPieces,
  dimension: MapDimension,
  delta: 1 | -1,
): { hexMap: HexMap; boardPieces: BoardPieces } {
  const resizedHexMap = {
    ...hexMap,
    [dimension]: hexMap[dimension] + delta,
    ...(hexMap.shape === 'hexagon'
      ? {
          length: hexMap.length + delta,
          width: hexMap.width + delta,
        }
      : {}),
  }

  if (hexMap.shape !== 'hexagon') {
    return { hexMap: resizedHexMap, boardPieces }
  }

  const firstDirection = delta === 1 ? 0 : 3
  const secondDirection = delta === 1 ? 1 : 4
  const shift = HEX_DIRECTIONS[firstDirection]
  const secondShift = HEX_DIRECTIONS[secondDirection]
  const shiftedPieces: BoardPieces = boardPieces.map(
    (boardPiece: BoardPiece) => {
      const firstCoords = hexUtilsAdd(boardPiece.pieceCoords, shift)
      return {
        ...boardPiece,
        pieceCoords: hexUtilsAdd(firstCoords, secondShift),
      }
    },
  )

  return { hexMap: resizedHexMap, boardPieces: shiftedPieces }
}

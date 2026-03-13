import JSONCrush from 'jsoncrush'
import type { BoardPiecesEncodedArr, HexMap } from '../types'
import { isHexMap } from '../utils/type-checker'
import { decodePieceID } from '../utils/map-utils'

export const getUrlMapString = ({
  hexMap,
  boardPiecesEncodedArr,
}: {
  hexMap: HexMap
  boardPiecesEncodedArr: BoardPiecesEncodedArr
}) => {
  return encodeURI(
    JSONCrush.crush(
      JSON.stringify([
        hexMap, // 1
        ...boardPiecesEncodedArr,
      ]),
    ),
  )
}
type ParsedJSONCrushMap = {
  hexMap: HexMap
  boardPiecesEncodedArr: BoardPiecesEncodedArr
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  extra?: any[]
}
export function parseMapDataArrayFromCrushed(
  crushed: string,
): ParsedJSONCrushMap {
  const data = JSON.parse(JSONCrush.uncrush(crushed))
  let hexMap: HexMap | undefined = undefined
  const boardPiecesEncodedArr: BoardPiecesEncodedArr = []

  for (const item of data) {
    // Detect hexMap: must be an object with expected keys
    if (isHexMap(item)) {
      hexMap = item
    }
    // Detect boardPiece ID: string format, e.g. "a~q~r~rot~id"
    else if (typeof item === 'string' && item.includes('~')) {
      boardPiecesEncodedArr.push(item)
      // below, for when boardPieces was an object
      // boardPieces[item] = decodePieceID(item).inventoryID
    }
  }

  if (!hexMap) {
    throw new Error('HexMap is missing in the JSON-crush data')
  }
  return { hexMap, boardPiecesEncodedArr }
}

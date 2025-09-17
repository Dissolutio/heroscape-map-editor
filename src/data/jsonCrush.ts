import JSONCrush from 'jsoncrush'
import type { BoardPieces, HexMap } from '../types'
import { isHexMap } from '../utils/type-checker'
import { decodePieceID } from '../utils/map-utils'

export const getUrlMapString = ({
  hexMap,
  boardPieces,
}: {
  hexMap: HexMap
  boardPieces: BoardPieces
}) => {
  return encodeURI(
    JSONCrush.crush(
      JSON.stringify([
        hexMap, // 1
        ...Object.keys(boardPieces),
      ]),
    ),
  )
}
type ParsedJSONCrushMap = {
  hexMap: HexMap
  boardPieces: BoardPieces
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  extra?: any[]
}
export function parseMapDataArrayFromCrushed(
  crushed: string,
): ParsedJSONCrushMap {
  const data = JSON.parse(JSONCrush.uncrush(crushed))
  let hexMap: HexMap | undefined = undefined
  const boardPieces: BoardPieces = {}
  const extra = []

  for (const item of data) {
    // Detect hexMap: must be an object with expected keys
    if (isHexMap(item)) {
      hexMap = item
    }
    // Detect boardPiece ID: string format, e.g. "a~q~r~rot~id"
    else if (typeof item === 'string' && item.includes('~')) {
      boardPieces[item] = decodePieceID(item).inventoryID
    }
    // Detect array of board piece objects (a projected possible change in format)
    else if (
      Array.isArray(item) &&
      item.length &&
      typeof item[0] === 'object'
    ) {
      extra.push(item)
    }
    // Anything else
    else {
      extra.push(item)
    }
  }

  if (!hexMap) {
    throw new Error('HexMap is missing in the crushed data')
  }
  return { hexMap, boardPieces, extra: extra.length ? extra : undefined }
}

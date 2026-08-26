import JSONCrush from 'jsoncrush'
import type { BoardPiece, BoardPiecesEncodedArr, HexMap } from '../types'
import { isHexMap } from '../utils/type-checker'
import { encodeBoardPiecesToIds } from '../utils/map-utils'

// JSONCrush's compression scans every substring (length 2-50) of the input
// with repeated indexOf calls, which is effectively O(n^2). Large blobs like
// a base64 map portrait image (can be 1MB+) make it hang the page for
// minutes, so anything that can't fit in a URL anyway must be stripped
// before we ever hand the string to JSONCrush.
const MAX_CRUSH_INPUT_LENGTH = 20_000

export const getUrlMapString = ({
  hexMap,
  boardPieces,
}: {
  hexMap: HexMap
  boardPieces: BoardPiece[]
}) => {
  const boardPiecesEncodedArr = encodeBoardPiecesToIds(boardPieces)
  // mapPortraitBase64/mapNotes are written as blank strings in URL-shareable
  // format (see HexMap type) since they can be arbitrarily large and can
  // never actually fit in a URL.
  const urlSafeHexMap: HexMap = {
    ...hexMap,
    mapPortraitBase64: '',
    mapNotes: '',
  }
  const uncrushed = JSON.stringify([
    urlSafeHexMap, // 1
    ...boardPiecesEncodedArr,
  ])
  if (uncrushed.length > MAX_CRUSH_INPUT_LENGTH) {
    throw new Error('Map is too large to be stored in a URL')
  }
  return encodeURI(JSONCrush.crush(uncrushed))
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

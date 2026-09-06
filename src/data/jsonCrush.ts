import JSONCrush from 'jsoncrush'
import type { BoardPiece, BoardPiecesEncodedArr, HexMap } from '../types'
import { encodeBoardPiecesToIds } from '../utils/map-utils'
import { isHexMap } from '../utils/type-checker'

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
  // Query-string values must use component encoding, not encodeURI. The
  // compressed payload is arbitrary JSONCrush data and can legally include
  // characters like commas, spaces, pluses, ampersands, etc. Those are not
  // safe in a URL parameter unless percent-encoded.
  return encodeURIComponent(JSONCrush.crush(uncrushed))
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
  const candidates = [crushed]

  try {
    candidates.push(decodeURIComponent(crushed))
  } catch {
    // Ignore invalid percent-encoding; the raw payload is already the best attempt.
  }

  let data: unknown[] | undefined

  for (const candidate of candidates) {
    try {
      data = JSON.parse(JSONCrush.uncrush(candidate))
      break
    } catch {
      // Try the next decoded form if this one is malformed.
    }
  }

  if (!data || !Array.isArray(data)) {
    throw new Error(
      'Invalid shared map payload: could not decode JSON-crush data',
    )
  }

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

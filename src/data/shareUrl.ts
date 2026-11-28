import { getUrlMapString, MAP_TOO_LARGE_ERROR } from './jsonCrush'
import type { BoardPiece, HexMap } from '../types'
import { PiecePrefixes } from '../types'
import {
  MAX_SHARE_URL_LENGTH,
  SHARE_URL_FALLBACK_DROP_ORDER,
} from './shareUrlConstants'

export type ShareUrlRemoved = (typeof SHARE_URL_FALLBACK_DROP_ORDER)[number]

type ShareUrlCandidate = {
  hexMap: HexMap
  boardPieces: BoardPiece[]
  removed: ShareUrlRemoved[]
}

type ShareUrlResult =
  | { url: string; removed: ShareUrlRemoved[] }
  | { error: 'too-large' }

export function buildShareUrlWithFallback({
  hexMap,
  boardPieces,
  baseUrl,
  view,
}: {
  hexMap: HexMap
  boardPieces: BoardPiece[]
  baseUrl: string
  view?: 'a' | 'b'
}): ShareUrlResult {
  const withoutStartZones = boardPieces.filter(
    (piece) => !piece.inventoryID.startsWith(PiecePrefixes.startZone),
  )
  const withoutGlyphs = withoutStartZones.filter(
    (piece) => !piece.inventoryID.startsWith(PiecePrefixes.glyph),
  )
  const candidates: ShareUrlCandidate[] = [
    { hexMap, boardPieces, removed: [] },
    {
      hexMap,
      boardPieces: withoutStartZones,
      removed: [SHARE_URL_FALLBACK_DROP_ORDER[0]],
    },
    {
      hexMap: { ...hexMap, objectiveMarkers: [] },
      boardPieces: withoutStartZones,
      removed: SHARE_URL_FALLBACK_DROP_ORDER.slice(0, 2),
    },
    {
      hexMap: { ...hexMap, objectiveMarkers: [] },
      boardPieces: withoutGlyphs,
      removed: [...SHARE_URL_FALLBACK_DROP_ORDER],
    },
  ]

  for (const candidate of candidates) {
    let mapData: string
    try {
      mapData = getUrlMapString(candidate)
    } catch (error) {
      if (error instanceof Error && error.message === MAP_TOO_LARGE_ERROR) {
        continue
      }
      throw error
    }

    const viewParam = view ? `&v=${view}` : ''
    const url = `${baseUrl}?m=${mapData}${viewParam}`
    if (url.length <= MAX_SHARE_URL_LENGTH) {
      return { url, removed: candidate.removed }
    }
  }

  return { error: 'too-large' }
}

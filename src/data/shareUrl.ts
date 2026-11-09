import { getUrlMapString, MAP_TOO_LARGE_ERROR } from './jsonCrush'
import type { BoardPiece, HexMap } from '../types'
import { PiecePrefixes } from '../types'

export type ShareUrlRemoved = 'startZones' | 'objectiveMarkers' | 'glyphs'

type ShareUrlCandidate = {
  hexMap: HexMap
  boardPieces: BoardPiece[]
  removed: ShareUrlRemoved[]
}

type ShareUrlResult =
  | { url: string; removed: ShareUrlRemoved[] }
  | { error: 'too-large' }

const MAX_SHARE_URL_LENGTH = 2082

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
      removed: ['startZones'],
    },
    {
      hexMap: { ...hexMap, objectiveMarkers: [] },
      boardPieces: withoutStartZones,
      removed: ['startZones', 'objectiveMarkers'],
    },
    {
      hexMap: { ...hexMap, objectiveMarkers: [] },
      boardPieces: withoutGlyphs,
      removed: ['startZones', 'objectiveMarkers', 'glyphs'],
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

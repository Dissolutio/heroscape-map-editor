import type { MapFileState } from '../types'
import {
  normalizeBoardPiecesWithDropped,
  type DroppedBoardPiece,
} from '../utils/map-utils'
import { isHexMap } from '../utils/type-checker'
import { restoreMapPortrait } from './mapStorage'
import { safeGetJSON } from './safeStorage'

export type LoadedLocalMap = {
  map: MapFileState
  hasInlinePortrait: boolean
  droppedPieces: DroppedBoardPiece[]
}

export function readMapFromLocalStorage(ls_key: string): LoadedLocalMap | null {
  try {
    const preparsed = safeGetJSON(ls_key)
    const parsed =
      typeof preparsed === 'object' &&
      preparsed !== null &&
      'state' in preparsed
        ? preparsed.state
        : preparsed
    if (parsed === null) return null
    if (
      typeof parsed !== 'object' ||
      !('hexMap' in parsed) ||
      !isHexMap(parsed.hexMap) ||
      !('boardPieces' in parsed)
    ) {
      console.warn(`Invalid map in localStorage key "${ls_key}"`)
      return null
    }

    // normalize boardPieces to BoardPiece[] regardless of legacy format
    const { boardPieces, droppedPieces } = normalizeBoardPiecesWithDropped(
      parsed.boardPieces,
    )
    return {
      map: { hexMap: restoreMapPortrait(parsed.hexMap), boardPieces },
      hasInlinePortrait:
        typeof parsed.hexMap.mapPortraitBase64 === 'string' &&
        parsed.hexMap.mapPortraitBase64.length > 0,
      droppedPieces,
    }
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

export function loadMapFromLocalStorage(ls_key: string): MapFileState | null {
  return readMapFromLocalStorage(ls_key)?.map ?? null
}

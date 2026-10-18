import type { MapFileState } from '../types'
import { normalizeBoardPieces } from '../utils/map-utils'
import { isHexMap } from '../utils/type-checker'
import { restoreMapPortrait } from './mapStorage'
import { safeGetJSON } from './safeStorage'

export function loadMapFromLocalStorage(ls_key: string): MapFileState | null {
  try {
    const preparsed = safeGetJSON(ls_key)
    // zustand nests under 'state', we do not
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
    const boardPieces = normalizeBoardPieces(parsed.boardPieces)
    return { hexMap: restoreMapPortrait(parsed.hexMap), boardPieces }
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

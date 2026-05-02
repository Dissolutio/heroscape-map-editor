import type { MapFileState, MapState } from "../types"
import { inflateBoardPiecesFromIds, normalizeBoardPieces } from "../utils/map-utils";
import { LS_KEYS } from "./keys"

function isPlainObject(value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function loadMapFromLocalStorage(ls_key: string): MapFileState | null {
  try {
    // const raw = localStorage.getItem(LS_KEYS.lastMap)
    const raw = localStorage.getItem(ls_key)
    if (!raw) return null
    const preparsed = JSON.parse(raw)
    // zustand nests under 'state', we do not
    const parsed = preparsed?.state ?? preparsed
    if (!parsed) return null

    // handle legacy format where map stored boardPieces as {[pieceID: string]: string}
    if (isPlainObject(parsed.boardPieces) && Object.keys(parsed.boardPieces).length && typeof Object.keys(parsed.boardPieces)[0] === 'string') {
      const migrated1 = normalizeBoardPieces(parsed.boardPieces)
      return { hexMap: parsed.hexMap, boardPieces: migrated1 }
    }
    // handle legacy format where map stored boardPieces as string[]
    if (Array.isArray(parsed.boardPieces) && parsed.boardPieces.length && typeof parsed.boardPieces[0] === 'string') {
      const migrated2 = parsed.boardPieces as string[]
      return { hexMap: parsed.hexMap, boardPieces: migrated2 }
    }

    // already new shape
    const existingMap = { hexMap: parsed.hexMap, boardPieces: parsed.boardPieces }
    return existingMap
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

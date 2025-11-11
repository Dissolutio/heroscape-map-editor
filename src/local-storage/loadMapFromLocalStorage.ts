import { MapState } from "../types"
import { inflateBoardPiecesFromIds, normalizeBoardPieces } from "../utils/map-utils";
import { LS_KEYS } from "./keys"

function isPlainObject(value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function loadMapFromLocalStorage(): MapState | null {
  try {
    const raw = localStorage.getItem(LS_KEYS.lastMap)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null

    // handle legacy format where map stored boardPieces as {[pieceID: string]: string}
    if (isPlainObject(parsed.boardPieces) && Object.keys(parsed.boardPieces).length && typeof Object.keys(parsed.boardPieces)[0] === 'string') {
      const migrated1 = inflateBoardPiecesFromIds(normalizeBoardPieces(parsed.boardPieces))
      console.log("🚀 ~ loadMapFromLocalStorage ~ migrated1:", migrated1)
      return { hexMap: parsed.hexMap, boardPieces: migrated1 }
    }
    // handle legacy format where map stored boardPieces as string[]
    if (Array.isArray(parsed.boardPieces) && parsed.boardPieces.length && typeof parsed.boardPieces[0] === 'string') {
      const migrated2 = inflateBoardPiecesFromIds(parsed.boardPieces as string[])
      console.log("🚀 ~ loadMapFromLocalStorage ~ migrated2:", migrated2)
      return { hexMap: parsed.hexMap, boardPieces: migrated2 }
    }

    // already new shape
    const existingMap = { hexMap: parsed.hexMap, boardPieces: parsed.boardPieces }
    console.log("🚀 ~ loadMapFromLocalStorage ~ existingMap:", existingMap)
    return existingMap
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

import type { MapFileState } from "../types"
import { normalizeBoardPieces } from "../utils/map-utils";
import { LS_KEYS } from "./keys"

export function loadMapFromLocalStorage(ls_key: string): MapFileState | null {
  try {
    const raw = localStorage.getItem(ls_key)
    if (!raw) return null
    const preparsed = JSON.parse(raw)
    // zustand nests under 'state', we do not
    const parsed = preparsed?.state ?? preparsed
    if (!parsed) return null

    // normalize boardPieces to BoardPiece[] regardless of legacy format
    const boardPieces = normalizeBoardPieces(parsed.boardPieces)
    return { hexMap: parsed.hexMap, boardPieces }
  } catch (e) {
    console.warn('Failed loading last map from localStorage', e)
    return null
  }
}

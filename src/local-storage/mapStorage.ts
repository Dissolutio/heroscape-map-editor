import type { HexMap } from '../types'
import { LS_KEYS } from './keys'
import { safeGetJSON, safeRemove, safeSetItem } from './safeStorage'

export type MapStorageResult =
  | { ok: true; quotaFallback?: boolean }
  | { ok: false; quota: boolean }

export function mapStorageFailure(quota: boolean): MapStorageResult {
  return { ok: false, quota }
}

export function withoutMapPortrait(hexMap: HexMap): HexMap {
  const { mapPortraitBase64: _portrait, ...result } = hexMap
  return result
}

export function restoreMapPortrait(hexMap: HexMap): HexMap {
  // Inline portraits from older saves remain usable until the next save.
  if (hexMap.mapPortraitBase64) return hexMap
  const portrait = safeGetJSON(LS_KEYS.lastMapPortrait)
  if (
    typeof portrait === 'object' &&
    portrait !== null &&
    'mapId' in portrait &&
    portrait.mapId === hexMap.id &&
    'mapPortraitBase64' in portrait &&
    typeof portrait.mapPortraitBase64 === 'string'
  ) {
    return { ...hexMap, mapPortraitBase64: portrait.mapPortraitBase64 }
  }
  return hexMap
}

export function saveMapPortrait(
  hexMap: HexMap,
  quotaFallback?: string,
): MapStorageResult {
  if (!hexMap.mapPortraitBase64) {
    return safeRemove(LS_KEYS.lastMapPortrait)
      ? { ok: true }
      : mapStorageFailure(false)
  }
  const result = safeSetItem(
    LS_KEYS.lastMapPortrait,
    JSON.stringify({
      mapId: hexMap.id,
      mapPortraitBase64: hexMap.mapPortraitBase64,
    }),
  )
  if (result.ok || !result.quota || !quotaFallback) return result

  const fallbackResult = safeSetItem(
    LS_KEYS.lastMapPortrait,
    JSON.stringify({
      mapId: hexMap.id,
      mapPortraitBase64: quotaFallback,
    }),
  )
  return fallbackResult.ok ? { ok: true, quotaFallback: true } : result
}

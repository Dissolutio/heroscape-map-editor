import { enqueueSnackbar } from 'notistack'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import type { AppState } from '../store/store'
import type { HexMap } from '../types'
import { LS_KEYS } from './keys'
import { safeGetJSON, safeRemove, safeSetItem } from './safeStorage'

type StoredMapState = Pick<AppState, 'boardPieces' | 'hexMap'>

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

export function saveMapPortrait(hexMap: HexMap): boolean {
  if (!hexMap.mapPortraitBase64) {
    safeRemove(LS_KEYS.lastMapPortrait)
    return true
  }
  const result = safeSetItem(
    LS_KEYS.lastMapPortrait,
    JSON.stringify({
      mapId: hexMap.id,
      mapPortraitBase64: hexMap.mapPortraitBase64,
    }),
  )
  if (!result.ok && typeof enqueueSnackbar === 'function') {
    enqueueSnackbar({
      message: result.quota
        ? 'Storage is full. The map portrait could not be saved. Download the map to keep a copy.'
        : 'The map portrait could not be saved locally. Download the map to keep a copy.',
      variant: 'warning',
      preventDuplicate: true,
      key: 'portrait-storage-error',
    })
  }
  return result.ok
}

export function partializeMap(state: AppState): StoredMapState {
  return {
    boardPieces: state.boardPieces,
    hexMap: withoutMapPortrait(state.hexMap),
  }
}

export const mapStorage: PersistStorage<StoredMapState> = {
  getItem: (name) => safeGetJSON<StorageValue<StoredMapState>>(name),
  setItem: (name, value) => {
    const result = safeSetItem(name, JSON.stringify(value))
    if (!result.ok && typeof enqueueSnackbar === 'function') {
      enqueueSnackbar({
        message: result.quota
          ? 'Storage is full. Your map could not be saved locally. Download the map to keep a copy.'
          : 'Your map could not be saved locally. Download the map to keep a copy.',
        variant: 'warning',
        preventDuplicate: true,
        key: 'map-storage-error',
      })
    }
  },
  removeItem: safeRemove,
}

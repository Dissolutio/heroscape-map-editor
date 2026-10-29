import { enqueueSnackbar } from 'notistack'
import type { StoreApi } from 'zustand/vanilla'
import type { AppState } from '../store/store'
import type { BoardPiece, HexMap, MapFileState } from '../types'
import { getMapPortraitStorageFallback } from '../utils/mapPortrait'
import { readMapFromLocalStorage } from './get-local-item'
import { LS_KEYS } from './keys'
import {
  type MapStorageResult,
  saveMapPortrait,
  withoutMapPortrait,
} from './mapStorage'
import { safeSetItem } from './safeStorage'

export type MapSnapshot = Pick<MapFileState, 'hexMap' | 'boardPieces'>

export interface MapAutosaveStorage {
  load: () => ReturnType<typeof readMapFromLocalStorage>
  save: (map: MapSnapshot) => MapStorageResult
}

export type MapAutosaveFailure = {
  quota: boolean
}

type AutosaveState = Pick<
  AppState,
  'hexMap' | 'boardPieces' | 'isAutosaveHeld' | 'mapLoadRevision'
>

type MapAutosaveOptions = {
  storage?: MapAutosaveStorage
  delay?: number
  onError?: (failure: MapAutosaveFailure) => void
}

export function createLocalMapAutosaveStorage(): MapAutosaveStorage {
  let lastSavedMapId: string | undefined
  let lastSavedPortrait: string | undefined
  let hasInlinePortraitToMigrate = false

  return {
    load() {
      const saved = readMapFromLocalStorage(LS_KEYS.lastMap)
      lastSavedMapId = saved?.map.hexMap.id
      lastSavedPortrait = saved?.map.hexMap.mapPortraitBase64
      hasInlinePortraitToMigrate = saved?.hasInlinePortrait ?? false
      return saved
    },
    save(map) {
      const portraitChanged =
        map.hexMap.id !== lastSavedMapId ||
        map.hexMap.mapPortraitBase64 !== lastSavedPortrait
      let portraitResult: MapStorageResult = { ok: true }
      if (portraitChanged || hasInlinePortraitToMigrate) {
        portraitResult = saveMapPortrait(
          map.hexMap,
          getMapPortraitStorageFallback(map.hexMap.mapPortraitBase64 ?? ''),
        )
      }

      const mapResult = safeSetItem(
        LS_KEYS.lastMap,
        JSON.stringify({
          v: 1,
          hexMap: withoutMapPortrait(map.hexMap),
          boardPieces: map.boardPieces,
        }),
      )
      if (portraitResult.ok) {
        lastSavedMapId = map.hexMap.id
        lastSavedPortrait = map.hexMap.mapPortraitBase64
        hasInlinePortraitToMigrate = false
      }
      if (!portraitResult.ok && !mapResult.ok) {
        return { ok: false, quota: portraitResult.quota || mapResult.quota }
      }
      if (!mapResult.ok) {
        return {
          ok: false,
          quota:
            mapResult.quota ||
            (portraitResult.ok && portraitResult.quotaFallback === true),
        }
      }
      if (!portraitResult.ok) return portraitResult
      return portraitResult.quotaFallback ? portraitResult : mapResult
    },
  }
}

export function createMapAutosaveWriter(
  storage: Pick<MapAutosaveStorage, 'save'>,
  onError: (failure: MapAutosaveFailure) => void,
  delay = 750,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: MapSnapshot | undefined

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    pending = undefined
  }

  const write = (map: MapSnapshot) => {
    try {
      const result = storage.save(map)
      if (!result.ok) onError({ quota: result.quota })
      else if (result.quotaFallback) onError({ quota: true })
      return result.ok
    } catch (error) {
      const quota =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      onError({ quota })
      return false
    }
  }

  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (pending === undefined) return false
    const map = pending
    pending = undefined
    return write(map)
  }

  return {
    schedule(map: MapSnapshot) {
      pending = map
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    flush,
    cancel,
    writeNow(map: MapSnapshot) {
      cancel()
      return write(map)
    },
  }
}

function notifyMapStorageError({ quota }: MapAutosaveFailure) {
  if (typeof enqueueSnackbar !== 'function') return
  enqueueSnackbar({
    message: quota
      ? 'Storage is full. Your map could not be saved locally. Download the map to keep a copy.'
      : 'Your map could not be saved locally. Download the map to keep a copy.',
    variant: 'warning',
    preventDuplicate: true,
    key: 'map-storage-error',
  })
}

function snapshot(hexMap: HexMap, boardPieces: BoardPiece[]): MapSnapshot {
  return { hexMap, boardPieces }
}

export function createMapAutosave<T extends AutosaveState>(
  store: StoreApi<T>,
  options: MapAutosaveOptions = {},
) {
  const storage = options.storage ?? createLocalMapAutosaveStorage()
  const onError = options.onError ?? notifyMapStorageError
  const writer = createMapAutosaveWriter(storage, onError, options.delay ?? 750)
  storage.load()

  store.subscribe((state, previous) => {
    const mapChanged =
      state.hexMap !== previous.hexMap ||
      state.boardPieces !== previous.boardPieces
    const isLoad = state.mapLoadRevision !== previous.mapLoadRevision

    if (isLoad) {
      if (state.isAutosaveHeld) {
        writer.flush()
      } else if (mapChanged) {
        writer.writeNow(snapshot(state.hexMap, state.boardPieces))
      }
      return
    }
    if (!mapChanged) return

    writer.schedule(snapshot(state.hexMap, state.boardPieces))
    if (state.isAutosaveHeld) {
      store.setState((current) => ({ ...current, isAutosaveHeld: false }))
    }
  })

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') writer.flush()
    })
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', writer.flush)
  }

  return writer
}

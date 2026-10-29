import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import { buildupJsonFileMap } from '../data/buildupMap'
import { LS_KEYS } from '../local-storage/keys'
import {
  createLocalMapAutosaveStorage,
  createMapAutosave,
  createMapAutosaveWriter,
} from '../local-storage/mapAutosave'
import type { MapSnapshot } from '../local-storage/mapAutosave'
import type { AppState } from '../store/store'
import {
  canvasToMapPortrait,
  getMapPortraitStorageFallback,
} from '../utils/mapPortrait'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap = {
  id: 'map-a',
  name: 'Autosave test',
  author: '',
  shape: 'rectangle',
  width: 3,
  length: 1,
}

const map: MapSnapshot = { hexMap, boardPieces: [] }

describe('map autosave writer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('coalesces quick edits into one trailing write', () => {
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    const writer = createMapAutosaveWriter({ save }, vi.fn(), 750)

    writer.schedule(map)
    vi.advanceTimersByTime(500)
    const edited = { ...map, hexMap: { ...map.hexMap, name: 'Edited' } }
    writer.schedule(edited)
    vi.advanceTimersByTime(749)
    expect(save).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith(edited)
  })

  it.each([
    [
      'quota',
      Object.assign(new Error('full'), { name: 'QuotaExceededError' }),
      true,
    ],
    ['other', new Error('blocked'), false],
  ])(
    'reports %s failures and retries on a later edit',
    (_name, error, quota) => {
      const onError = vi.fn()
      const save = vi
        .fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
        .mockImplementationOnce(() => {
          throw error
        })
      const writer = createMapAutosaveWriter({ save }, onError, 750)

      writer.schedule(map)
      vi.advanceTimersByTime(750)
      expect(onError).toHaveBeenCalledWith({ quota })
      expect(() => writer.schedule(map)).not.toThrow()
      vi.advanceTimersByTime(750)
      expect(save).toHaveBeenCalledTimes(2)
      expect(onError).toHaveBeenCalledOnce()
    },
  )

  it('does nothing when flush has no pending write', () => {
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    const writer = createMapAutosaveWriter({ save }, vi.fn(), 750)

    expect(writer.flush()).toBe(false)
    expect(save).not.toHaveBeenCalled()
  })

  it.each(['pagehide', 'visibilitychange'])(
    'flushes a pending write on %s',
    async (eventName) => {
      const handlers = new Map<string, (event?: Event) => void>()
      const target = {
        addEventListener: (type: string, listener: (event?: Event) => void) =>
          handlers.set(type, listener),
      }
      vi.stubGlobal('window', target)
      vi.stubGlobal('document', {
        ...target,
        visibilityState:
          eventName === 'visibilitychange' ? 'hidden' : 'visible',
      })

      const store = await createTestStore()
      const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
      createMapAutosave(store, {
        storage: { load: () => null, save },
        onError: vi.fn(),
        delay: 750,
      })
      store.getState().changeMapName('Edited')

      handlers.get(eventName)?.()
      expect(save).toHaveBeenCalledOnce()
      vi.advanceTimersByTime(750)
      expect(save).toHaveBeenCalledOnce()
    },
  )
})

describe('map autosave state gating', () => {
  const values = new Map<string, string>()
  const browserStorage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  }

  beforeEach(() => {
    values.clear()
    vi.clearAllMocks()
    browserStorage.setItem.mockImplementation((key, value) => {
      return values.set(key, value)
    })
    vi.stubGlobal('localStorage', browserStorage)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('ignores held loads, saves the first edit, and saves subsequent edits', async () => {
    const store = await createTestStore()
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
      delay: 750,
    })

    store.getState().loadMap(makeMap('startup'), { holdAutosave: true })
    store.getState().loadMap(makeMap('shared'), { holdAutosave: true })
    expect(save).not.toHaveBeenCalled()
    expect(store.getState().isAutosaveHeld).toBe(true)

    store.getState().changeMapName('First user edit')
    expect(store.getState().isAutosaveHeld).toBe(false)
    vi.advanceTimersByTime(750)
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0][0].hexMap.name).toBe('First user edit')

    store.getState().changeAuthorName('Author')
    vi.advanceTimersByTime(750)
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('flushes a pending prior-map edit before a held load', async () => {
    const store = await createTestStore()
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
      delay: 750,
    })

    store.getState().loadMap(makeMap('map-a'))
    save.mockClear()
    store.getState().changeMapName('Edited map A')
    vi.advanceTimersByTime(300)

    store.getState().loadMap(makeMap('share-map-b'), { holdAutosave: true })
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0][0].hexMap).toMatchObject({
      id: 'map-a',
      name: 'Edited map A',
    })

    vi.advanceTimersByTime(1000)
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0][0].hexMap.id).not.toBe('share-map-b')
  })

  it('saves deliberate map loads immediately', async () => {
    const store = await createTestStore()
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
      delay: 750,
    })

    store.getState().loadMap(makeMap('uploaded'))
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0][0].hexMap.id).toBe('uploaded')
  })

  it('uses the map-storage warning and retries failed local writes', async () => {
    const store = await createTestStore()
    browserStorage.setItem.mockImplementationOnce(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    const { enqueueSnackbar } = await import('notistack')
    createMapAutosave(store)

    expect(() => store.getState().loadMap(makeMap('uploaded'))).not.toThrow()
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Storage is full. Your map could not be saved locally. Download the map to keep a copy.',
        key: 'map-storage-error',
        variant: 'warning',
      }),
    )

    store.getState().changeMapName('Retry')
    vi.advanceTimersByTime(750)
    expect(browserStorage.setItem).toHaveBeenCalledWith(
      LS_KEYS.lastMap,
      expect.any(String),
    )
  })

  it('ignores hover, selection, dialog, and settings updates', async () => {
    const store = await createTestStore()
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
      delay: 750,
    })

    store.getState().toggleHoveredPieceID('piece')
    store.getState().toggleSelectedPieceID('piece')
    store.getState().toggleCurrentDialog('load')
    store.getState().toggleIsOrthoCam(false)
    vi.advanceTimersByTime(1000)

    expect(save).not.toHaveBeenCalled()
  })

  it('leaves lastMap and its portrait untouched until a share-link edit', async () => {
    const savedMap = makeMap('saved')
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        v: 1,
        hexMap: savedMap.hexMap,
        boardPieces: [],
      }),
    )
    values.set(
      LS_KEYS.lastMapPortrait,
      JSON.stringify({
        mapId: 'saved',
        mapPortraitBase64: 'saved-portrait',
      }),
    )

    const store = await createTestStore()
    createMapAutosave(store, { onError: vi.fn() })
    browserStorage.setItem.mockClear()
    browserStorage.removeItem.mockClear()

    store.getState().loadMap(savedMap, { holdAutosave: true })
    store.getState().loadMap(makeMap('shared'), { holdAutosave: true })
    vi.advanceTimersByTime(1000)

    expect(browserStorage.setItem).not.toHaveBeenCalled()
    expect(browserStorage.removeItem).not.toHaveBeenCalled()
    expect(
      browserStorage.getItem.mock.calls.some(([key]) => key === 'lastMapCache'),
    ).toBe(false)

    store.getState().changeMapName('Edited shared map')
    vi.advanceTimersByTime(750)
    expect(browserStorage.setItem).toHaveBeenCalledWith(
      LS_KEYS.lastMap,
      expect.any(String),
    )
  })

  it('does not autosave a fitted legacy share link until its first edit', async () => {
    const store = await createTestStore()
    createMapAutosave(store)
    browserStorage.setItem.mockClear()
    const fittedMap = buildupJsonFileMap(
      [
        {
          uid: 'old-share-edge-piece',
          inventoryID: 'g2',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 4, r: 2, s: -6 },
        },
      ],
      { ...hexMap, width: 6, length: 6 },
    )

    store.getState().loadMap(fittedMap, { holdAutosave: true })
    vi.advanceTimersByTime(1000)

    expect(fittedMap.dimensionsAdjusted).toBe(true)
    expect(browserStorage.setItem).not.toHaveBeenCalledWith(
      LS_KEYS.lastMap,
      expect.any(String),
    )
    expect(values.has(LS_KEYS.lastMap)).toBe(false)

    store.getState().changeMapName('Edited after load')
    vi.advanceTimersByTime(750)

    const saved = JSON.parse(values.get(LS_KEYS.lastMap) ?? '')
    expect(saved.hexMap.width).toBe(7)
    expect(saved.boardPieces).toHaveLength(1)
  })

  it('saves the map after portrait failure and retries the portrait', () => {
    let failPortrait = true
    browserStorage.setItem.mockImplementation((key, value) => {
      if (key === LS_KEYS.lastMapPortrait && failPortrait) {
        failPortrait = false
        throw new DOMException('Full', 'QuotaExceededError')
      }
      return values.set(key, value)
    })
    const storage = createLocalMapAutosaveStorage()
    storage.load()
    const onError = vi.fn()
    const writer = createMapAutosaveWriter(storage, onError, 750)
    const mapWithPortrait = {
      hexMap: { ...hexMap, mapPortraitBase64: 'portrait-a' },
      boardPieces: [],
    }

    expect(writer.writeNow(mapWithPortrait)).toBe(false)
    expect(values.has(LS_KEYS.lastMap)).toBe(true)
    expect(values.has(LS_KEYS.lastMapPortrait)).toBe(false)
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({ quota: true })

    writer.schedule({
      ...mapWithPortrait,
      hexMap: { ...mapWithPortrait.hexMap, name: 'Edited after retry' },
    })
    vi.advanceTimersByTime(750)

    expect(JSON.parse(values.get(LS_KEYS.lastMapPortrait) ?? '')).toEqual({
      mapId: hexMap.id,
      mapPortraitBase64: 'portrait-a',
    })
    expect(onError).toHaveBeenCalledOnce()
  })

  it('stores the smaller portrait after quota while retaining the full image', () => {
    vi.stubGlobal('document', {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          }),
          toDataURL: (_type: string, quality: number) =>
            `${canvas.width}x${canvas.height}:${quality}`,
        }
        return canvas
      },
    })
    const portrait = canvasToMapPortrait({} as CanvasImageSource, 1920, 1080)
    const fallback = getMapPortraitStorageFallback(portrait)
    if (!fallback) throw new Error('Expected a quota fallback portrait')

    browserStorage.setItem.mockImplementation((key, value) => {
      if (
        key === LS_KEYS.lastMapPortrait &&
        JSON.parse(value).mapPortraitBase64 === portrait
      ) {
        throw new DOMException('Full', 'QuotaExceededError')
      }
      return values.set(key, value)
    })
    const storage = createLocalMapAutosaveStorage()
    storage.load()
    const onError = vi.fn()
    const writer = createMapAutosaveWriter(storage, onError, 750)
    const mapWithPortrait = {
      hexMap: { ...hexMap, mapPortraitBase64: portrait },
      boardPieces: [],
    }

    expect(writer.writeNow(mapWithPortrait)).toBe(true)
    expect(mapWithPortrait.hexMap.mapPortraitBase64).toBe(portrait)
    expect(JSON.parse(values.get(LS_KEYS.lastMapPortrait) ?? '')).toEqual({
      mapId: hexMap.id,
      mapPortraitBase64: fallback,
    })
    expect(
      JSON.parse(values.get(LS_KEYS.lastMap) ?? '').hexMap,
    ).not.toHaveProperty('mapPortraitBase64')
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({ quota: true })
  })

  it('retries a failed map write without resaving a successful portrait', () => {
    let failMap = true
    browserStorage.setItem.mockImplementation((key, value) => {
      if (key === LS_KEYS.lastMap && failMap) {
        failMap = false
        throw new Error('blocked')
      }
      return values.set(key, value)
    })
    const storage = createLocalMapAutosaveStorage()
    storage.load()
    const onError = vi.fn()
    const writer = createMapAutosaveWriter(storage, onError, 750)
    const mapWithPortrait = {
      hexMap: { ...hexMap, mapPortraitBase64: 'portrait-a' },
      boardPieces: [],
    }

    expect(writer.writeNow(mapWithPortrait)).toBe(false)
    expect(values.has(LS_KEYS.lastMapPortrait)).toBe(true)
    expect(values.has(LS_KEYS.lastMap)).toBe(false)
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({ quota: false })

    writer.schedule({
      ...mapWithPortrait,
      hexMap: { ...mapWithPortrait.hexMap, name: 'Map retry' },
    })
    vi.advanceTimersByTime(750)

    expect(values.has(LS_KEYS.lastMap)).toBe(true)
    expect(
      browserStorage.setItem.mock.calls.filter(
        ([key]) => key === LS_KEYS.lastMapPortrait,
      ),
    ).toHaveLength(1)
    expect(
      browserStorage.setItem.mock.calls.filter(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toHaveLength(2)
    expect(onError).toHaveBeenCalledOnce()
  })
})

async function createTestStore() {
  vi.resetModules()
  const [{ default: createMapSlice }, { default: createUISlice }] =
    await Promise.all([
      import('../store/map-slice'),
      import('../store/ui-slice'),
    ])
  return createStore<AppState>()((...args) => ({
    ...createMapSlice(...args),
    ...createUISlice(...args),
  }))
}

function makeMap(id: string) {
  return {
    hexMap: { ...hexMap, id },
    boardPieces: [],
    boardHexes: {},
  }
}

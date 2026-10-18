import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { LS_KEYS } from '../local-storage/keys'
import { partializeMap, saveMapPortrait } from '../local-storage/mapStorage'
import type { HexMap } from '../types'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'map-a',
  name: 'Portrait test',
  author: '',
  shape: 'rectangle',
  width: 3,
  length: 1,
}

describe('separate map portrait storage', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
  }

  beforeEach(() => {
    vi.resetModules()
    values.clear()
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', storage)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([false, true])(
    'restores a matching portrait for a plain/wrapped map (wrapped=%s)',
    (wrapped) => {
      const map = { boardPieces: [], hexMap }
      values.set(
        LS_KEYS.lastMap,
        JSON.stringify(wrapped ? { state: map } : map),
      )
      saveMapPortrait({ ...hexMap, mapPortraitBase64: 'portrait-a' })
      expect(loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap).toEqual({
        ...hexMap,
        mapPortraitBase64: 'portrait-a',
      })
      saveMapPortrait({
        ...hexMap,
        id: 'map-b',
        mapPortraitBase64: 'portrait-b',
      })
      expect(
        loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap.mapPortraitBase64,
      ).toBeUndefined()
    },
  )

  it('keeps legacy inline portraits ahead of unrelated separate data', () => {
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        boardPieces: [],
        hexMap: { ...hexMap, mapPortraitBase64: 'legacy-inline' },
      }),
    )
    saveMapPortrait({ ...hexMap, mapPortraitBase64: 'old-separate' })
    expect(
      loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap.mapPortraitBase64,
    ).toBe('legacy-inline')
  })

  it('ignores malformed maps and portrait JSON without throwing', () => {
    values.set(LS_KEYS.lastMapCache, '{')
    expect(loadMapFromLocalStorage(LS_KEYS.lastMapCache)).toBeNull()
    values.set(LS_KEYS.lastMap, JSON.stringify({ boardPieces: [] }))
    expect(loadMapFromLocalStorage(LS_KEYS.lastMap)).toBeNull()
    values.set(LS_KEYS.lastMap, JSON.stringify({ hexMap, boardPieces: [] }))
    values.set(LS_KEYS.lastMapPortrait, '{')
    expect(loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap).toEqual(hexMap)
  })

  it('stores the portrait separately without rewriting it on map/UI edits', async () => {
    const { default: store } = await import('../store/store')
    expect(Object.keys(partializeMap(store.getState()))).toEqual([
      'boardPieces',
      'hexMap',
    ])
    store.getState().loadMap({ hexMap, boardPieces: [], boardHexes: {} })
    store.getState().addMapPortraitBase64('portrait-a')
    const persisted = JSON.parse(values.get(LS_KEYS.lastMap) ?? '')
    expect(persisted.state.hexMap).not.toHaveProperty('mapPortraitBase64')
    expect(store.getState().hexMap.mapPortraitBase64).toBe('portrait-a')
    expect(JSON.parse(values.get(LS_KEYS.lastMapPortrait) ?? '')).toEqual({
      mapId: hexMap.id,
      mapPortraitBase64: 'portrait-a',
    })
    storage.setItem.mockClear()
    store.getState().changeMapName('Edited')
    store.getState().toggleHoveredPieceID('hover')
    expect(
      storage.setItem.mock.calls.filter(
        ([key]) => key === LS_KEYS.lastMapPortrait,
      ),
    ).toHaveLength(0)
    store.getState().addMapPortraitBase64('')
    expect(values.has(LS_KEYS.lastMapPortrait)).toBe(false)
  })

  it('copies the last map at import without duplicating its portrait', async () => {
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        state: {
          hexMap: { ...hexMap, mapPortraitBase64: 'legacy-inline' },
          boardPieces: [],
        },
      }),
    )
    await import('../store/store')
    const cache = JSON.parse(values.get(LS_KEYS.lastMapCache) ?? '')
    expect(cache.hexMap).not.toHaveProperty('mapPortraitBase64')
    expect(
      loadMapFromLocalStorage(LS_KEYS.lastMapCache)?.hexMap.mapPortraitBase64,
    ).toBe('legacy-inline')
  })

  it('does not crash during import or store updates when storage is full', async () => {
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        state: {
          hexMap: { ...hexMap, mapPortraitBase64: 'legacy-inline' },
          boardPieces: [],
        },
      }),
    )
    storage.setItem.mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    try {
      const { default: store } = await import('../store/store')
      expect(() =>
        store.getState().changeMapName('Still editable'),
      ).not.toThrow()
      expect(() => store.getState().addMapPortraitBase64('new')).not.toThrow()
      expect(store.getState().hexMap.name).toBe('Still editable')
      const { enqueueSnackbar } = await import('notistack')
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'warning' }),
      )
    } finally {
      storage.setItem.mockImplementation((key, value) => {
        values.set(key, value)
      })
    }
  })

  it('survives an import-time quota failure before the snackbar provider mounts', async () => {
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        state: {
          hexMap: { ...hexMap, mapPortraitBase64: 'legacy-inline' },
          boardPieces: [],
        },
      }),
    )
    vi.doMock('notistack', () => ({ enqueueSnackbar: undefined }))
    storage.setItem.mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    try {
      await expect(import('../store/store')).resolves.toHaveProperty('default')
      expect(console.warn).toHaveBeenCalled()
    } finally {
      storage.setItem.mockImplementation((key, value) => {
        values.set(key, value)
      })
      vi.doMock('notistack', () => ({ enqueueSnackbar: vi.fn() }))
    }
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { createLocalMapAutosaveStorage } from '../local-storage/mapAutosave'
import { LS_KEYS } from '../local-storage/keys'
import type { HexMap } from '../types'

const hexMap: HexMap = {
  id: 'map-a',
  name: 'Portrait test',
  author: '',
  shape: 'rectangle',
  width: 3,
  length: 1,
}

describe('map storage', () => {
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
    values.clear()
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', storage)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    ['zustand-wrapped', { state: { boardPieces: [], hexMap }, version: 0 }],
    ['versioned', { v: 1, boardPieces: [], hexMap }],
  ])('loads the %s map format and matching portrait', (_name, map) => {
    values.set(LS_KEYS.lastMap, JSON.stringify(map))
    values.set(
      LS_KEYS.lastMapPortrait,
      JSON.stringify({
        mapId: hexMap.id,
        mapPortraitBase64: 'portrait-a',
      }),
    )

    expect(loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap).toEqual({
      ...hexMap,
      mapPortraitBase64: 'portrait-a',
    })
  })

  it('preserves a legacy inline portrait until autosave migrates it', () => {
    values.set(
      LS_KEYS.lastMap,
      JSON.stringify({
        state: {
          boardPieces: [],
          hexMap: { ...hexMap, mapPortraitBase64: 'legacy-inline' },
        },
        version: 0,
      }),
    )
    values.set(
      LS_KEYS.lastMapPortrait,
      JSON.stringify({
        mapId: hexMap.id,
        mapPortraitBase64: 'unrelated-separate',
      }),
    )

    const loaded = loadMapFromLocalStorage(LS_KEYS.lastMap)
    expect(loaded?.hexMap.mapPortraitBase64).toBe('legacy-inline')

    const mapStorage = createLocalMapAutosaveStorage()
    const stored = mapStorage.load()
    if (!stored) throw new Error('Expected the legacy map to load')
    expect(
      mapStorage.save({
        ...stored.map,
        hexMap: { ...stored.map.hexMap, name: 'Edited' },
      }),
    ).toEqual({ ok: true })

    expect(
      JSON.parse(values.get(LS_KEYS.lastMap) ?? '').hexMap,
    ).not.toHaveProperty('mapPortraitBase64')
    expect(JSON.parse(values.get(LS_KEYS.lastMapPortrait) ?? '')).toEqual({
      mapId: hexMap.id,
      mapPortraitBase64: 'legacy-inline',
    })
  })

  it('saves portraits with the map and only when the portrait changes', () => {
    const mapStorage = createLocalMapAutosaveStorage()
    mapStorage.load()
    const mapWithPortrait = {
      hexMap: { ...hexMap, mapPortraitBase64: 'portrait-a' },
      boardPieces: [],
    }

    expect(mapStorage.save(mapWithPortrait)).toEqual({ ok: true })
    expect(JSON.parse(values.get(LS_KEYS.lastMap) ?? '')).toEqual({
      v: 1,
      hexMap,
      boardPieces: [],
    })
    expect(JSON.parse(values.get(LS_KEYS.lastMapPortrait) ?? '')).toEqual({
      mapId: hexMap.id,
      mapPortraitBase64: 'portrait-a',
    })

    storage.setItem.mockClear()
    expect(
      mapStorage.save({
        ...mapWithPortrait,
        hexMap: { ...mapWithPortrait.hexMap, name: 'Renamed' },
      }),
    ).toEqual({ ok: true })
    expect(storage.setItem.mock.calls.map(([key]) => key)).toEqual([
      LS_KEYS.lastMap,
    ])

    mapStorage.save({
      ...mapWithPortrait,
      hexMap: { ...mapWithPortrait.hexMap, mapPortraitBase64: 'portrait-b' },
    })
    const portraitCall =
      storage.setItem.mock.calls[storage.setItem.mock.calls.length - 2]
    expect(portraitCall?.[0]).toBe(LS_KEYS.lastMapPortrait)
  })

  it('ignores malformed maps and portrait JSON without throwing', () => {
    values.set(LS_KEYS.lastMap, JSON.stringify({ boardPieces: [] }))
    expect(loadMapFromLocalStorage(LS_KEYS.lastMap)).toBeNull()
    values.set(LS_KEYS.lastMap, JSON.stringify({ hexMap, boardPieces: [] }))
    values.set(LS_KEYS.lastMapPortrait, '{')
    expect(loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap).toEqual(hexMap)
  })
})

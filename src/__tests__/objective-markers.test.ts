import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { fitMapToPieces, mapTableHexes } from '../data/fitMapToPieces'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
  normalizeObjectiveMarkers,
  objectiveMarkersOverlap,
} from '../data/objectiveMarkers'
import { canShrinkMapWithoutDroppingPieces, resizeMap } from '../data/resizeMap'
import { loadMapFromLocalStorage } from '../local-storage/get-local-item'
import { LS_KEYS } from '../local-storage/keys'
import { createLocalMapAutosaveStorage } from '../local-storage/mapAutosave'
import type { HexMap } from '../types'
import { genBoardHexID } from '../utils/map-utils'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'objective-markers',
  name: 'Objective marker tests',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 3,
  length: 3,
}

const marker = (
  uid: string,
  q: number,
  r = 0,
  options: Partial<ObjectiveMarker> = {},
): ObjectiveMarker => ({
  uid,
  anchor: { q, r, s: -q - r, altitude: 1 },
  size: 1,
  rotation: 0,
  style: 'black',
  content: { kind: 'number', value: 1 },
  ...options,
})

const storageValues = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storageValues.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storageValues.set(key, value)),
  removeItem: vi.fn((key: string) => storageValues.delete(key)),
}

describe('objective marker data', () => {
  it('normalizes values and drops malformed or duplicate entries', () => {
    const markers = normalizeObjectiveMarkers([
      {
        ...marker('first', 0, 0),
        rotation: 8,
        content: { kind: 'number', value: 120 },
        name: '  Hero\u0000 name  ',
      } as unknown,
      marker('first', 1),
      marker('text', 2, 0, {
        content: { kind: 'text', value: '  A\u0000BCDE  ' },
      }),
      { uid: 'broken', anchor: { q: 1, r: 1, s: 1, altitude: 0 } },
    ])

    expect(markers).toHaveLength(2)
    expect(markers[0]).toMatchObject({
      rotation: 5,
      content: { kind: 'number', value: 99 },
      name: 'Hero name',
    })
    expect(markers[1]?.content).toEqual({ kind: 'text', value: 'ABC' })
  })

  it('uses the shared footprint utility for all six size-two rotations', () => {
    const neighbors = new Set<string>()
    for (let rotation = 0; rotation < 6; rotation += 1) {
      const current = marker('two', 0, 0, {
        size: 2,
        rotation: rotation as ObjectiveMarker['rotation'],
      })
      const footprint = getObjectiveMarkerFootprint(current)
      expect(footprint).toHaveLength(2)
      expect(footprint.every(({ altitude }) => altitude === 1)).toBe(true)
      neighbors.add(
        footprint
          .filter(({ q, r }) => q !== 0 || r !== 0)
          .map(({ q, r }) => `${q},${r}`)[0] ?? '',
      )
    }
    expect(neighbors.size).toBe(6)

    const single = getObjectiveMarkerFootprint(marker('one', 2, -1))
    expect(single).toEqual([{ q: 2, r: -1, s: -1, altitude: 1 }])
  })

  it('detects overlap by footprint and surface altitude', () => {
    const twoHex = marker('two', 0, 0, { size: 2 })
    expect(objectiveMarkersOverlap(twoHex, marker('neighbor', 1, 0))).toBe(true)
    expect(
      objectiveMarkersOverlap(
        twoHex,
        marker('upper', 1, 0, {
          anchor: { q: 1, r: 0, s: -1, altitude: 2 },
        }),
      ),
    ).toBe(false)
  })
})

describe('objective marker map integration', () => {
  it('grows maps and prevents shrinking past marker footprints', () => {
    const edgeMarker = marker('edge', 5, 2)
    const fitted = fitMapToPieces(
      { ...hexMap, objectiveMarkers: [edgeMarker] },
      [],
    )
    expect(fitted.changed).toBe(true)
    expect(fitted.hexMap.objectiveMarkers).toEqual([edgeMarker])
    expect(
      getObjectiveMarkerFootprint(edgeMarker).every((hex) =>
        mapTableHexes(fitted.hexMap).has(
          genBoardHexID({ ...hex, altitude: 0 }),
        ),
      ),
    ).toBe(true)

    const bottomMarker = Array.from({ length: 6 }, (_, rotation) =>
      marker('bottom', 0, 1, {
        size: 2,
        rotation: rotation as ObjectiveMarker['rotation'],
      }),
    ).find((candidate) =>
      getObjectiveMarkerFootprint(candidate).some(({ r }) => r === 2),
    )
    if (!bottomMarker) throw new Error('Expected a footprint on the bottom row')
    expect(
      canShrinkMapWithoutDroppingPieces(
        { ...hexMap, objectiveMarkers: [bottomMarker] },
        [],
        'length',
      ),
    ).toBe(false)

    const hexMapWithMarker = {
      ...hexMap,
      shape: 'hexagon',
      length: 4,
      width: 4,
      objectiveMarkers: [marker('hex-resize', 1, 1)],
    }
    const grown = resizeMap(hexMapWithMarker, [], 'length', 1)
    expect(grown.hexMap.objectiveMarkers?.[0]?.anchor).not.toEqual(
      hexMapWithMarker.objectiveMarkers[0]?.anchor,
    )
  })

  it('normalizes and grows markers when loading a saved map', () => {
    const savedMarker = marker('load-marker', 5, 2)
    const loaded = buildupJsonFileMap([], {
      ...hexMap,
      objectiveMarkers: [savedMarker],
    })

    expect(loaded.dimensionsAdjusted).toBe(true)
    expect(loaded.hexMap.objectiveMarkers).toEqual([savedMarker])
    expect(
      getObjectiveMarkerFootprint(savedMarker).every((hex) =>
        mapTableHexes(loaded.hexMap).has(
          genBoardHexID({ ...hex, altitude: 0 }),
        ),
      ),
    ).toBe(true)
  })

  it('drops markers that exceed the bounded map-growth limit', () => {
    const tooFar = marker('too-far', 100, 0)
    const loaded = buildupJsonFileMap([], {
      ...hexMap,
      objectiveMarkers: [tooFar],
    })

    expect(loaded.hexMap.objectiveMarkers).toEqual([])
    expect(loaded.droppedObjectiveMarkers).toEqual([tooFar])
  })

  it('round-trips JSON and autosave names, but omits names from share links', () => {
    const markers = [
      marker('named', 1, 1, { name: '10th Regiment of Foot' }),
      marker('custom', 2, 1, {
        size: 2,
        rotation: 4,
        style: 'white',
        content: { kind: 'text', value: 'A1' },
      }),
    ]
    const mapWithMarkers = { ...hexMap, objectiveMarkers: markers }
    const fileMap = buildupJsonFileMap(
      [],
      JSON.parse(JSON.stringify(mapWithMarkers)) as HexMap,
    )
    expect(fileMap.hexMap.objectiveMarkers).toEqual(markers)

    storageValues.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    expect(
      createLocalMapAutosaveStorage().save({
        hexMap: mapWithMarkers,
        boardPieces: [],
      }),
    ).toEqual({ ok: true })
    expect(
      loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap.objectiveMarkers,
    ).toEqual(markers)

    const shareData = parseMapDataArrayFromCrushed(
      getUrlMapString({ hexMap: mapWithMarkers, boardPieces: [] }),
    )
    const expectedShareMarkers = markers.map(({ name: _name, ...item }) => item)
    expect(shareData.hexMap.objectiveMarkers).toEqual(expectedShareMarkers)
    expect(
      buildupJsonFileMap([], shareData.hexMap).hexMap.objectiveMarkers,
    ).toEqual(expectedShareMarkers)
  })

  it('loads legacy maps and links without objective markers unchanged', () => {
    const legacy = { ...hexMap }
    expect(buildupJsonFileMap([], legacy).hexMap).not.toHaveProperty(
      'objectiveMarkers',
    )
    const shareData = parseMapDataArrayFromCrushed(
      getUrlMapString({ hexMap: legacy, boardPieces: [] }),
    )
    expect(shareData.hexMap).not.toHaveProperty('objectiveMarkers')
  })

  it('keeps forty marker share payloads within the URL input budget', () => {
    const markers = Array.from({ length: 40 }, (_, index) =>
      marker(`marker-${index}`, index, 0, {
        content: { kind: 'number', value: index + 1 },
        name: `Private unit name ${index}`,
      }),
    )
    const crushed = getUrlMapString({
      hexMap: { ...hexMap, width: 40, objectiveMarkers: markers },
      boardPieces: [],
    })

    expect(crushed.length).toBeLessThan(10_000)
    expect(
      parseMapDataArrayFromCrushed(crushed).hexMap.objectiveMarkers,
    ).toHaveLength(40)
    expect(
      parseMapDataArrayFromCrushed(crushed).hexMap.objectiveMarkers?.every(
        (item) => item.name === undefined,
      ),
    ).toBe(true)
  })
})

describe('objective marker store actions', () => {
  let store: typeof import('../store/store').default

  beforeEach(async () => {
    storageValues.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.resetModules()
    ;({ default: store } = await import('../store/store'))
    const temporal = store.temporal.getState()
    temporal.pause()
    store.getState().loadMap(buildupJsonFileMap([], hexMap), {
      holdAutosave: true,
    })
    temporal.clear()
    temporal.resume()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps actions atomic in history and markers outside terrain state', () => {
    const boardPiecesBefore = store.getState().boardPieces
    const boardHexesBefore = store.getState().boardHexes
    const inventoryBefore = store.getState().userPieceInventory
    const uid = store
      .getState()
      .addObjectiveMarker(marker('', 0, 0, { name: 'Saved marker' }))
    if (!uid) throw new Error('Expected the marker to be added')
    expect(store.temporal.getState().pastStates).toHaveLength(1)
    vi.advanceTimersByTime(750)
    expect(
      loadMapFromLocalStorage(LS_KEYS.lastMap)?.hexMap.objectiveMarkers?.[0]
        ?.name,
    ).toBe('Saved marker')

    store.getState().setSelectedObjectiveMarkerUID(uid ?? null)
    store.getState().toggleHoveredPieceID('hover-only')
    expect(store.temporal.getState().pastStates).toHaveLength(1)

    store.getState().updateObjectiveMarker(uid, {
      content: { kind: 'number', value: 7 },
    })
    store.getState().moveObjectiveMarker(uid, {
      q: 2,
      r: 2,
      s: -4,
      altitude: 1,
    })
    expect(store.temporal.getState().pastStates).toHaveLength(3)

    store.getState().removeObjectiveMarker(uid)
    expect(store.temporal.getState().pastStates).toHaveLength(4)
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()
    expect(store.getState().boardPieces).toBe(boardPiecesBefore)
    expect(store.getState().boardHexes).toBe(boardHexesBefore)
    expect(store.getState().userPieceInventory).toBe(inventoryBefore)

    store.temporal.getState().undo()
    expect(store.getState().hexMap.objectiveMarkers?.[0]?.anchor.q).toBe(2)
    store.temporal.getState().undo()
    expect(store.getState().hexMap.objectiveMarkers?.[0]?.anchor.q).toBe(0)
    store.temporal.getState().undo()
    expect(store.getState().hexMap.objectiveMarkers?.[0]?.content).toEqual({
      kind: 'number',
      value: 1,
    })
    store.temporal.getState().undo()
    expect(store.getState().hexMap.objectiveMarkers).toBeUndefined()
    store.temporal.getState().redo()
    expect(store.getState().hexMap.objectiveMarkers).toHaveLength(1)
    store.temporal.getState().redo()
    expect(store.getState().hexMap.objectiveMarkers?.[0]?.content).toEqual({
      kind: 'number',
      value: 7,
    })
    store.temporal.getState().redo()
    expect(store.getState().hexMap.objectiveMarkers?.[0]?.anchor.q).toBe(2)
    store.temporal.getState().redo()
    expect(store.getState().hexMap.objectiveMarkers).toEqual([])

    store.getState().setSelectedObjectiveMarkerUID('stale')
    store.getState().loadMap(buildupJsonFileMap([], hexMap), {
      holdAutosave: true,
    })
    expect(store.getState().selectedObjectiveMarkerUID).toBeNull()
  })

  it('refuses additions and moves that overlap another marker', () => {
    const addMarker = store.getState().addObjectiveMarker
    const firstUID = addMarker(marker('', 0, 0, { size: 2 }))
    if (!firstUID) throw new Error('Expected the first marker to be added')
    const secondUID = addMarker(marker('', 2, 0))
    if (!secondUID) throw new Error('Expected the second marker to be added')
    const before = store.getState().hexMap.objectiveMarkers

    expect(addMarker(marker('', 1, 0))).toBeUndefined()
    store.getState().moveObjectiveMarker(secondUID, {
      q: 1,
      r: 0,
      s: -1,
      altitude: 1,
    })
    expect(store.getState().hexMap.objectiveMarkers).toEqual(before)
  })
})

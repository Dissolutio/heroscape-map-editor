/**
 * Loading a map with community custom (VC) pieces turns Include VC
 * unit/terrain data on, through the store's loadMap (every load path: file,
 * share link, last-map restore, imports). It shows one info snackbar, is not
 * a map edit (no undo step), and does not write the saved last map for a
 * share link (a held load).
 */
import { enqueueSnackbar } from 'notistack'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { VC_MAP_LOADED_MESSAGE } from '../data/vcContent'
import type { MapSnapshot } from '../local-storage/mapAutosave'
import { type BoardPiece, type HexMap, Pieces, SELECT_PEN_MODE } from '../types'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'vc-load',
  name: 'VC load',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 12,
  length: 12,
}

const pylon: BoardPiece = {
  uid: 'pylon',
  inventoryID: Pieces.twoWayPylon,
  pieceCoords: { q: 3, r: 4, s: -7 },
  rotation: 0,
  altitude: 0,
}
const grass: BoardPiece = {
  uid: 'grass',
  inventoryID: Pieces.grass1,
  pieceCoords: { q: 2, r: 2, s: -4 },
  rotation: 0,
  altitude: 0,
}

const storageValues = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => storageValues.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageValues.set(key, value)
  }),
  removeItem: vi.fn((key: string) => {
    storageValues.delete(key)
  }),
}

let store: typeof import('../store/store').default
let createMapAutosave: typeof import('../local-storage/mapAutosave').createMapAutosave

beforeEach(async () => {
  storageValues.clear()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.useFakeTimers()
  vi.resetModules()
  vi.mocked(enqueueSnackbar).mockClear()
  ;({ default: store } = await import('../store/store'))
  ;({ createMapAutosave } = await import('../local-storage/mapAutosave'))
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const vcSnackbars = () =>
  vi
    .mocked(enqueueSnackbar)
    .mock.calls.filter(
      ([options]) =>
        typeof options === 'object' &&
        options !== null &&
        'message' in options &&
        options.message === VC_MAP_LOADED_MESSAGE,
    )

describe('loading a map with VC pieces', () => {
  it('turns Include VC on, once, with one info snackbar', () => {
    expect(store.getState().includeVCContent).toBe(false)
    store.getState().loadMap(buildupJsonFileMap([grass, pylon], hexMap))
    expect(store.getState().includeVCContent).toBe(true)
    expect(vcSnackbars()).toHaveLength(1)
    expect(vcSnackbars()[0][0]).toMatchObject({ variant: 'info' })

    // Already on: nothing more to say.
    store.getState().loadMap(buildupJsonFileMap([pylon], hexMap))
    expect(vcSnackbars()).toHaveLength(1)
  })

  it('leaves the setting alone for a map without VC pieces', () => {
    store.getState().loadMap(buildupJsonFileMap([grass], hexMap))
    expect(store.getState().includeVCContent).toBe(false)
    expect(vcSnackbars()).toHaveLength(0)
  })

  it('does not count as a map edit', () => {
    const temporal = store.temporal.getState()
    temporal.pause()
    store.getState().loadMap(buildupJsonFileMap([grass], hexMap))
    temporal.clear()
    temporal.resume()

    // The setting alone changes nothing undo tracks.
    store.getState().toggleIncludeVCContent(true)
    store.getState().toggleIncludeVCContent(false)
    expect(store.temporal.getState().pastStates).toHaveLength(0)

    // A held load (as a share link does) with VC: the setting turns on, and
    // the only map change is the load itself, which the load sites clear.
    temporal.pause()
    store
      .getState()
      .loadMap(buildupJsonFileMap([pylon], hexMap), { holdAutosave: true })
    temporal.clear()
    temporal.resume()
    expect(store.getState().includeVCContent).toBe(true)
    expect(store.temporal.getState().pastStates).toHaveLength(0)
  })

  it('does not write the saved last map when viewing a share link', () => {
    const save = vi.fn((_snapshot: MapSnapshot) => ({ ok: true as const }))
    createMapAutosave(store, {
      storage: { load: () => null, save },
      onError: vi.fn(),
      delay: 750,
    })
    store.getState().loadMap(buildupJsonFileMap([grass, pylon], hexMap), {
      holdAutosave: true,
    })
    vi.advanceTimersByTime(5000)
    expect(store.getState().includeVCContent).toBe(true)
    expect(save).not.toHaveBeenCalled()
    expect(store.getState().isAutosaveHeld).toBe(true)
  })

  it('turning VC off drops a VC pen', () => {
    store.getState().toggleIncludeVCContent(true)
    store.getState().togglePenMode(Pieces.deflectorShield)
    expect(store.getState().penMode).toBe(Pieces.deflectorShield)
    store.getState().toggleIncludeVCContent(false)
    expect(store.getState().penMode).toBe(SELECT_PEN_MODE)

    store.getState().togglePenMode(Pieces.laurWallSquarePillar)
    store.getState().toggleIncludeVCContent(false)
    expect(store.getState().penMode).toBe(Pieces.laurWallSquarePillar)
  })
})

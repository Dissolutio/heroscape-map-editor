import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import { LS_KEYS } from '../local-storage/keys'
import type { BoardPiece, HexMap, MapState } from '../types'
import { makeRectangleScenario } from '../utils/map-gen'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'store-history',
  name: 'Store history',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 12,
  length: 12,
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

function loadedMap(boardPieces: BoardPiece[] = []): MapState {
  return buildupJsonFileMap(boardPieces, hexMap)
}

function loadWithoutHistory(map: MapState) {
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave: true })
  temporal.clear()
  temporal.resume()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}

function snapshot() {
  const { boardPieces, boardHexes } = store.getState()
  return structuredClone({ boardPieces, boardHexes })
}

function historyLength() {
  return store.temporal.getState().pastStates.length
}

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
  loadWithoutHistory(loadedMap())
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('real store undo and redo', () => {
  it('undoes and redoes painting with exact boardPieces and boardHexes', () => {
    const before = snapshot()
    const error = store.getState().paintTile({
      piece: piecesSoFar.g1,
      clickedHexCoords: { q: 3, r: 4, s: -7 },
      altitude: 0,
      rotation: 0,
    })
    expect(error).toBeUndefined()
    const afterPaint = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterPaint)
  })

  it('undoes and redoes unpainting with exact boardPieces and boardHexes', () => {
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'to-remove',
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 3, r: 4, s: -7 },
        },
      ]),
    )
    const before = snapshot()

    store.getState().unpaintTile('to-remove')
    const afterUnpaint = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterUnpaint)
  })

  it('undoes and redoes moving a piece with exact boardPieces and boardHexes', () => {
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'to-move',
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 2, r: 2, s: -4 },
        },
      ]),
    )
    const before = snapshot()

    store.getState().movePiece({
      uid: 'to-move',
      newPieceCoords: { q: 6, r: 5, s: -11 },
      newAltitude: 1,
      newRotation: 2,
    })
    const afterMove = snapshot()
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterMove)
  })

  // The multi-select UI pauses zundo while applying every move. The current
  // pause/resume pair suppresses those updates instead of grouping them.
  // A future fix should make the batch one undoable change.
  it.fails(
    'KNOWN GAP: paused multi-piece moves do not create one undo step',
    () => {
      loadWithoutHistory(
        loadedMap([
          {
            uid: 'first',
            inventoryID: 'g1',
            altitude: 0,
            rotation: 0,
            pieceCoords: { q: 2, r: 2, s: -4 },
          },
          {
            uid: 'second',
            inventoryID: 'g1',
            altitude: 0,
            rotation: 0,
            pieceCoords: { q: 7, r: 6, s: -13 },
          },
        ]),
      )
      const before = snapshot()
      const temporal = store.temporal.getState()

      temporal.pause()
      store.getState().movePiece({
        uid: 'first',
        newPieceCoords: { q: 4, r: 3, s: -7 },
      })
      store.getState().movePiece({
        uid: 'second',
        newPieceCoords: { q: 9, r: 8, s: -17 },
      })
      temporal.resume()

      const afterMoves = snapshot()
      expect(historyLength()).toBe(1)
      temporal.undo()
      expect(snapshot()).toEqual(before)
      temporal.redo()
      expect(snapshot()).toEqual(afterMoves)
    },
  )

  it('records direct loadMap as one undo step and recomputes conflicts', () => {
    const before = snapshot()
    const conflicting = loadedMap([
      {
        uid: 'overlap-one',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 3, s: -6 },
      },
      {
        uid: 'overlap-two',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 1,
        pieceCoords: { q: 3, r: 3, s: -6 },
      },
    ])

    store.getState().loadMap(conflicting)
    const afterLoad = snapshot()
    expect(historyLength()).toBe(1)
    expect(store.getState().conflictedPieceUIDs).toEqual(
      computeConflictedPieceUIDs(conflicting.boardPieces),
    )
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['overlap-one', 'overlap-two']),
    )

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(afterLoad)
  })

  it('view, pen, drag, and hover changes never add history or autosave the map', () => {
    const { boardHexes, boardPieces, hexMap } = store.getState()
    store.getState().toggleViewingLevel(2)
    store.getState().togglePenMode('g')
    store.getState().setDragState(true, null)
    store.getState().toggleHoveredPieceID('hovered')
    store.getState().toggleHoveredHex(Object.values(boardHexes)[0])
    store.getState().setDragState(false, null)
    store.getState().toggleHoveredPieceID('')
    store.getState().toggleHoveredHex(undefined)
    vi.advanceTimersByTime(1000)

    expect(historyLength()).toBe(0)
    expect(store.getState().boardPieces).toBe(boardPieces)
    expect(store.getState().boardHexes).toBe(boardHexes)
    expect(store.getState().hexMap).toBe(hexMap)
    expect(
      localStorageMock.setItem.mock.calls.some(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toBe(false)
    expect(
      localStorageMock.removeItem.mock.calls.some(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toBe(false)
  })
})

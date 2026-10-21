import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enqueueSnackbar } from 'notistack'
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
  it('recomputes Laur edge conflicts after paint, undo, redo, and remove', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    const anchor = { q: 4, r: 4, s: -8 }
    const neighbor = { q: 5, r: 4, s: -9 }
    loadWithoutHistory(
      loadedMap([
        {
          uid: 'first-addon',
          inventoryID: 'lws',
          altitude: 0,
          rotation: 0,
          pieceCoords: anchor,
        },
      ]),
    )
    expect(store.getState().conflictedPieceUIDs).toEqual([])

    const error = store.getState().paintTile({
      piece: piecesSoFar.lws,
      clickedHexCoords: neighbor,
      altitude: 0,
      rotation: 3,
    })
    expect(error).toBeUndefined()
    const added = store
      .getState()
      .boardPieces.find((piece) => piece.pieceCoords.q === neighbor.q)
    if (!added) throw new Error('Expected the second Laur add-on')
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    expect(
      store.getState().boardPieces.every((piece) => !('conflict' in piece)),
    ).toBe(true)

    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )

    store.getState().unpaintTile(added.uid)
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['first-addon', added.uid]),
    )
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
  })

  it('recomputes Laur footprint conflicts after map load and moving land', async () => {
    const { redoWithSelectionRestore, undoWithSelectionRestore } = await import(
      '../utils/undoWithSelectionRestore'
    )
    const anchor = { q: 4, r: 4, s: -8 }
    const landOrigin = { q: 2, r: 2, s: -4 }
    const blockedHex = { q: 5, r: 4, s: -9 }
    const map = loadedMap([
      {
        uid: 'measured-addon',
        inventoryID: 'lwr2',
        altitude: 0,
        rotation: 0,
        pieceCoords: anchor,
      },
      {
        uid: 'moving-land',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: landOrigin,
      },
    ])
    store.getState().loadMap(map, { holdAutosave: true })
    expect(store.getState().conflictedPieceUIDs).toEqual([])

    store.getState().movePiece({
      uid: 'moving-land',
      newPieceCoords: blockedHex,
      newAltitude: 0,
    })
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['measured-addon', 'moving-land']),
    )

    undoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    redoWithSelectionRestore()
    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['measured-addon', 'moving-land']),
    )
  })

  it('loads fitted pieces and shows one map-dimensions notification', () => {
    const edgePiece: BoardPiece = {
      uid: 'edge-land',
      inventoryID: 'g2',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 4, r: 2, s: -6 },
    }
    const map = buildupJsonFileMap([edgePiece], {
      ...hexMap,
      width: 6,
      length: 6,
    })

    store.getState().loadMap(map, { holdAutosave: true })

    expect(store.getState().hexMap.width).toBe(7)
    expect(store.getState().boardPieces).toHaveLength(1)
    expect(store.getState().boardPieces[0]?.pieceCoords).toEqual(
      edgePiece.pieceCoords,
    )
    expect(enqueueSnackbar).toHaveBeenCalledOnce()
    expect(enqueueSnackbar).toHaveBeenCalledWith({
      message: 'Hexoscape has adjusted your map dimensions to fit all pieces',
      variant: 'info',
      key: 'map-dimensions-adjusted',
      preventDuplicate: true,
    })
  })

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

  it('groups three moves when pausing after the first move', () => {
    const pieces = [
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
      {
        uid: 'third',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 9, s: -12 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))
    const before = snapshot()
    const temporal = store.temporal.getState()
    const destinations = [
      { q: 4, r: 3, s: -7 },
      { q: 9, r: 8, s: -17 },
      { q: 5, r: 10, s: -15 },
    ]

    for (const [index, piece] of pieces.entries()) {
      if (index === 1) temporal.pause()
      const newPieceCoords = destinations[index]
      if (!newPieceCoords) throw new Error('Missing move destination')
      store.getState().movePiece({ uid: piece.uid, newPieceCoords })
    }
    temporal.resume()

    const afterMoves = snapshot()
    expect(historyLength()).toBe(1)
    temporal.undo()
    expect(snapshot()).toEqual(before)
    temporal.redo()
    expect(snapshot()).toEqual(afterMoves)
  })

  it('pausing before the first move records no undo state', () => {
    const pieces = [
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
      {
        uid: 'third',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 3, r: 9, s: -12 },
      },
    ]
    loadWithoutHistory(loadedMap(pieces))
    const temporal = store.temporal.getState()
    const destinations = [
      { q: 4, r: 3, s: -7 },
      { q: 9, r: 8, s: -17 },
      { q: 5, r: 10, s: -15 },
    ]

    temporal.pause()
    for (const [index, piece] of pieces.entries()) {
      const newPieceCoords = destinations[index]
      if (!newPieceCoords) throw new Error('Missing move destination')
      store.getState().movePiece({ uid: piece.uid, newPieceCoords })
    }
    temporal.resume()

    const afterMoves = snapshot()
    expect(historyLength()).toBe(0)
    temporal.undo()
    expect(snapshot()).toEqual(afterMoves)
  })

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
    store.getState().toggleHoveredWorldPoint({ x: 1, z: 2 })
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import type { BoardPiece, HexMap, MapState } from '../types'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'store-conflict-replay',
  name: 'Store conflict replay',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 16,
  length: 16,
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

const at = (q: number, r: number) => ({ q, r, s: -q - r })
const bp = (
  uid: string,
  inventoryID: string,
  q: number,
  r: number,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: at(q, r),
})

const conflictedBoard = [
  bp('water-1', 'w1', 2, 2),
  bp('water-2', 'w1', 3, 2),
  bp('water-3', 'w1', 4, 2),
  bp('ship-wall', 'sl', 2, 2),
  bp('unrelated-water', 'w1', 10, 10),
]

function load(boardPieces: BoardPiece[]) {
  const map: MapState = buildupJsonFileMap(boardPieces, hexMap)
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave: true })
  temporal.clear()
  temporal.resume()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}

function snapshot() {
  const { boardHexes, boardPieces } = store.getState()
  return structuredClone({ boardHexes, boardPieces })
}

function expectReplayMatches(
  boardPieces: BoardPiece[],
  boardHexes: MapState['boardHexes'],
) {
  expect(boardHexes).toEqual(
    rebuildBoardStateFromPieces(boardPieces, boardHexes).boardHexes,
  )
}

function hexesOwnedBy(boardHexes: MapState['boardHexes'], uid: string) {
  return Object.fromEntries(
    Object.entries(boardHexes).filter(([, hex]) => hex.boardPieceUID === uid),
  )
}

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
  load([])
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('conflicted piece replay', () => {
  it('deleting an unrelated water tile preserves other hexes and piece order', () => {
    load(conflictedBoard)
    const before = snapshot()

    expect(store.getState().conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['water-1', 'water-2', 'water-3', 'ship-wall']),
    )

    store.getState().unpaintTile('unrelated-water')

    const after = snapshot()
    const remaining = before.boardPieces.filter(
      (piece) => piece.uid !== 'unrelated-water',
    )
    expect(after.boardPieces).toEqual(remaining)
    for (const piece of remaining) {
      expect(hexesOwnedBy(after.boardHexes, piece.uid)).toEqual(
        hexesOwnedBy(before.boardHexes, piece.uid),
      )
    }
    expectReplayMatches(after.boardPieces, after.boardHexes)
  })

  it('moving a conflicted board preserves order and agrees with replay', () => {
    load(conflictedBoard)
    const before = snapshot()

    store.getState().movePiece({
      uid: 'unrelated-water',
      newPieceCoords: at(11, 10),
    })

    const after = snapshot()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual(
      before.boardPieces.map((piece) => piece.uid),
    )
    expectReplayMatches(after.boardPieces, after.boardHexes)
  })

  it('drag-moving a conflicted board preserves order and agrees with replay', () => {
    load(conflictedBoard)
    const before = snapshot()

    store.getState().movePieces({
      moves: [{ uid: 'unrelated-water', newPieceCoords: at(11, 10) }],
    })

    const after = snapshot()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual(
      before.boardPieces.map((piece) => piece.uid),
    )
    expectReplayMatches(after.boardPieces, after.boardHexes)
  })

  it('rotating a conflicted piece preserves order and agrees with replay', () => {
    load(conflictedBoard)
    const before = snapshot()

    store.getState().movePiece({
      uid: 'ship-wall',
      newPieceCoords: at(2, 2),
      newRotation: 1,
    })

    const after = snapshot()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual(
      before.boardPieces.map((piece) => piece.uid),
    )
    expectReplayMatches(after.boardPieces, after.boardHexes)
  })

  it('conversion preserves order and agrees with replay', () => {
    load(conflictedBoard)
    const before = snapshot()

    expect(
      store.getState().convertTerrainForPieces({
        selectedUIDs: ['unrelated-water'],
        targetInventoryBySourceInventory: { w1: 'g1' },
      }),
    ).toBe(1)

    const after = snapshot()
    expect(after.boardPieces.map((piece) => piece.uid)).toEqual(
      before.boardPieces.map((piece) => piece.uid),
    )
    expectReplayMatches(after.boardPieces, after.boardHexes)
  })

  it('undo and redo restore the exact conflicted delete state', () => {
    load(conflictedBoard)
    const before = snapshot()
    store.getState().unpaintTile('unrelated-water')
    const after = snapshot()

    store.temporal.getState().undo()
    expect(snapshot()).toEqual(before)
    store.temporal.getState().redo()
    expect(snapshot()).toEqual(after)
  })

  it('deleting any piece from seeded overlapping boards agrees with replay', () => {
    for (const seed of [13, 29, 47]) {
      let state = seed
      const random = () => {
        state = (state * 48271) % 2147483647
        return state
      }
      const q = 2 + (random() % 5)
      const r = 2 + (random() % 5)
      const pieces = [
        bp(`water-${seed}-1`, 'w1', q, r),
        bp(`water-${seed}-2`, 'w1', q + 1, r),
        bp(`water-${seed}-3`, 'w1', q + 2, r),
        bp(`ship-${seed}-1`, 'sl', q, r),
        bp(`water-${seed}-4`, 'w1', 10 + (random() % 3), 10),
        bp(`ship-${seed}-2`, 'sl', q + 1, r),
      ]

      for (const target of pieces) {
        load(pieces)
        const before = snapshot()
        store.getState().unpaintTile(target.uid)
        const after = snapshot()
        expect(after.boardPieces.map((piece) => piece.uid)).toEqual(
          before.boardPieces
            .filter((piece) => piece.uid !== target.uid)
            .map((piece) => piece.uid),
        )
        expectReplayMatches(after.boardPieces, after.boardHexes)
      }
    }
  })
})

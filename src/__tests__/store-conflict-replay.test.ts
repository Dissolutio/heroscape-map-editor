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

function withoutOwner(boardHexes: MapState['boardHexes'], uid: string) {
  return Object.fromEntries(
    Object.entries(boardHexes).filter(
      ([, hex]) => hex.boardPieceUID !== uid,
    ),
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
    expect(after.boardHexes).toEqual(
      withoutOwner(before.boardHexes, 'unrelated-water'),
    )
    expect(after.boardHexes).toEqual(
      rebuildBoardStateFromPieces(remaining).boardHexes,
    )
  })
})

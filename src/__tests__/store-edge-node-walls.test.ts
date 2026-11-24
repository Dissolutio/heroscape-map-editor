/**
 * WALLS IN THE STORE (edge/node cells, data/hexGrid/pieceCells.ts)
 *
 * Fortified Walls and Ruins keep boardHexes for rendering, but those hexes
 * never own anything, and conflicts with walls come from the cell rule. Every
 * store action that touches walls must leave boardHexes exactly as a fresh
 * replay of boardPieces would, and undo/redo must restore each step exactly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import { type BoardPiece, type HexMap, type MapState, Pieces } from '../types'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'store-edge-node-walls',
  name: 'Store edge/node walls',
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
let undo: () => void
let redo: () => void

const at = (q: number, r: number) => ({ q, r, s: -q - r })
const bp = (
  uid: string,
  inventoryID: string,
  q: number,
  r: number,
  altitude = 0,
  rotation = 0,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude,
  rotation,
  pieceCoords: at(q, r),
})

// A grass floor under the middle of the map.
const floor: BoardPiece[] = []
for (let q = 0; q < 12; q++) {
  for (let r = 2; r < 13; r++) floor.push(bp(`floor-${q}-${r}`, 'g1', q, r))
}

function load(boardPieces: BoardPiece[]) {
  const map: MapState = buildupJsonFileMap(boardPieces, hexMap)
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave: true })
  temporal.clear()
  temporal.resume()
}

function snapshot() {
  const { boardHexes, boardPieces, conflictedPieceUIDs } = store.getState()
  return structuredClone({
    boardHexes,
    boardPieces,
    conflictedPieceUIDs: [...conflictedPieceUIDs].sort(),
  })
}

function expectReplayMatches() {
  const { boardHexes, boardPieces, conflictedPieceUIDs } = store.getState()
  const replayed = rebuildBoardStateFromPieces(boardPieces, boardHexes)
  expect(boardHexes).toEqual(replayed.boardHexes)
  expect([...conflictedPieceUIDs].sort()).toEqual(
    [...replayed.conflictedPieceUIDs].sort(),
  )
}

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
  // The app's undo/redo, which also recompute conflicts.
  ;({ undoWithSelectionRestore: undo, redoWithSelectionRestore: redo } =
    await import('../utils/undoWithSelectionRestore'))
  load([])
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('walls in the store', () => {
  it('place, rotate, move and remove walls: boardHexes always match a fresh replay, and undo/redo restore each step', () => {
    load([
      ...floor,
      bp('wall', Pieces.fortifiedWall, 5, 6, 1),
      bp('cannon', Pieces.cannon, 5, 7, 1),
      bp('ruin', Pieces.ruins2, 3, 10, 1),
    ])
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expectReplayMatches()
    const steps = [snapshot()]

    // a second Fortified Wall one hex SE: shares hexes, no edge or node
    store.getState().paintTile({
      piece: piecesSoFar[Pieces.fortifiedWall],
      clickedHexCoords: at(5, 7),
      altitude: 1,
      rotation: 0,
    })
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expectReplayMatches()
    steps.push(snapshot())

    // land at the wall's level, in a hex on the wall's edge: a conflict
    store.getState().paintTile({
      piece: piecesSoFar.g1,
      clickedHexCoords: at(4, 7),
      altitude: 1,
      rotation: 0,
    })
    const land =
      store.getState().boardPieces[store.getState().boardPieces.length - 1].uid
    expect(store.getState().conflictedPieceUIDs).toContain(land)
    expectReplayMatches()
    steps.push(snapshot())

    store.getState().movePiece({
      uid: 'wall',
      newPieceCoords: at(5, 6),
      newRotation: 2,
    })
    expectReplayMatches()
    steps.push(snapshot())

    store.getState().movePieces({
      moves: [{ uid: 'ruin', newPieceCoords: at(6, 10) }],
    })
    expectReplayMatches()
    steps.push(snapshot())

    store.getState().unpaintTile(land)
    expectReplayMatches()
    steps.push(snapshot())

    store.getState().unpaintTile('wall')
    expectReplayMatches()
    steps.push(snapshot())

    for (let i = steps.length - 2; i >= 0; i--) {
      undo()
      expect(snapshot()).toEqual(steps[i])
    }
    for (let i = 1; i < steps.length; i++) {
      redo()
      expect(snapshot()).toEqual(steps[i])
    }
  })

  it('removing a piece that took a wall hex gives the hex back to the wall, as a replay would', () => {
    load([
      ...floor,
      bp('wall', Pieces.fortifiedWall, 5, 6, 1),
      bp('cannon', Pieces.cannon, 5, 6, 1),
    ])
    const ownerOfOrigin = () =>
      Object.values(store.getState().boardHexes).find(
        (hex) => hex.q === 5 && hex.r === 6 && hex.altitude === 2,
      )?.boardPieceUID
    expect(ownerOfOrigin()).toBe('cannon')
    store.getState().unpaintTile('cannon')
    expect(ownerOfOrigin()).toBe('wall')
    expectReplayMatches()
  })

  it("undoing a placement over a wall's origin hex gives the hex back", () => {
    load([...floor, bp('wall', Pieces.fortifiedWall, 5, 6, 1)])
    const before = snapshot()
    store.getState().paintTile({
      piece: piecesSoFar[Pieces.cannon],
      clickedHexCoords: at(5, 6),
      altitude: 1,
      rotation: 0,
    })
    const origin = () =>
      Object.values(store.getState().boardHexes).find(
        (hex) => hex.q === 5 && hex.r === 6 && hex.altitude === 2,
      )
    expect(origin()?.inventoryID).toBe(Pieces.cannon)
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    undo()
    expect(origin()).toMatchObject({
      boardPieceUID: 'wall',
      isObstacleOrigin: true,
    })
    expect(snapshot()).toEqual(before)
    expectReplayMatches()
  })
})

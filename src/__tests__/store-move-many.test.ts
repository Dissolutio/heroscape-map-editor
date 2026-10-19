/**
 * MOVING SEVERAL PIECES (store movePieces / movePiece)
 *
 * The selected-piece arrow, rotate and altitude controls move every
 * selected piece. This pins what that does to the board, against the real
 * store. `legacyMovePiece` below is a frozen copy of movePiece as it was
 * before movePieces existed: the single-piece path must keep matching it,
 * and so must a group move whose pieces do not get in each other's way.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addPiece } from '../data/addPiece'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { LS_KEYS } from '../local-storage/keys'
import { removePiece } from '../data/removePiece'
import type {
  BoardHexes,
  BoardPiece,
  CubeCoordinate,
  HexMap,
  MapState,
} from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'store-move-many',
  name: 'Store move many',
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

type MoveArgs = {
  uid: string
  newPieceCoords: CubeCoordinate
  newAltitude?: number
  newRotation?: number
}

const at = (q: number, r: number): CubeCoordinate => ({ q, r, s: -q - r })
const bp = (
  uid: string,
  inventoryID: string,
  coords: CubeCoordinate,
  altitude = 0,
  rotation = 0,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude,
  rotation,
  pieceCoords: coords,
})

/** Loads a map into the store with no undo history and no autosave noise. */
function load(boardPieces: BoardPiece[], viewingLevel?: number) {
  const map: MapState = buildupJsonFileMap(boardPieces, hexMap)
  const temporal = store.temporal.getState()
  temporal.pause()
  store.getState().loadMap(map, { holdAutosave: true })
  if (viewingLevel !== undefined)
    store.getState().toggleViewingLevel(viewingLevel)
  temporal.clear()
  temporal.resume()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}

type BoardState = {
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  conflictedPieceUIDs: string[]
  viewingLevel: number
}

const boardState = (): BoardState => {
  const { boardHexes, boardPieces, conflictedPieceUIDs, viewingLevel } =
    store.getState()
  return structuredClone({
    boardHexes,
    boardPieces,
    conflictedPieceUIDs,
    viewingLevel,
  })
}

const historyLength = () => store.temporal.getState().pastStates.length

/**
 * movePiece exactly as it was before movePieces (map-slice.ts at dev
 * 704d71ed), on a plain copy of the board: remove the mover, re-add every
 * previously conflicted piece, place the mover, raise the viewing level,
 * recompute conflicts. A fixed reference, not shared with the app code.
 */
function legacyMovePiece(state: BoardState, args: MoveArgs): BoardState {
  const next = structuredClone(state)
  const boardPiece = next.boardPieces.find((p) => p.uid === args.uid)
  if (!boardPiece) return next
  const piece = piecesSoFar[boardPiece.inventoryID]
  if (!piece) return next
  let { newBoardHexes: workingHexes, newBoardPieces: workingPieces } =
    removePiece({
      uid: args.uid,
      boardHexes: next.boardHexes,
      boardPieces: next.boardPieces,
    })
  for (const conflictedUID of next.conflictedPieceUIDs) {
    if (conflictedUID === args.uid) continue
    const conflictedBP = workingPieces.find((p) => p.uid === conflictedUID)
    if (!conflictedBP) continue
    const conflictedPiece = piecesSoFar[conflictedBP.inventoryID]
    if (!conflictedPiece) continue
    const removed = removePiece({
      uid: conflictedUID,
      boardHexes: workingHexes,
      boardPieces: workingPieces,
    })
    const added = addPiece({
      piece: conflictedPiece,
      boardHexes: removed.newBoardHexes,
      boardPieces: removed.newBoardPieces,
      pieceCoords: conflictedBP.pieceCoords,
      placementAltitude: conflictedBP.altitude,
      rotation: conflictedBP.rotation,
      isVsTile: false,
      uid: conflictedUID,
      permissive: true,
    })
    workingHexes = added.newBoardHexes
    workingPieces = added.newBoardPieces
  }
  const placementAltitude = args.newAltitude ?? boardPiece.altitude
  const placed = addPiece({
    piece,
    boardHexes: workingHexes,
    boardPieces: workingPieces,
    pieceCoords: args.newPieceCoords,
    placementAltitude,
    rotation: args.newRotation ?? boardPiece.rotation,
    isVsTile: false,
    uid: args.uid,
    permissive: true,
  })
  const placedAtLevel = placementAltitude + 1
  return {
    boardHexes: placed.newBoardHexes,
    boardPieces: placed.newBoardPieces,
    conflictedPieceUIDs: computeConflictedPieceUIDs(placed.newBoardPieces),
    viewingLevel:
      placedAtLevel > next.viewingLevel ? placedAtLevel : next.viewingLevel,
  }
}

const legacySequence = (state: BoardState, moves: MoveArgs[]) =>
  moves.reduce(legacyMovePiece, state)

/**
 * Three pieces far enough apart that moving them one at a time never puts
 * one on another: a 1-hex grass, a 2-hex rock and a 3-hex sand tile.
 */
const SPREAD = [
  bp('G1', 'g1', at(2, 2)),
  bp('R2', 'r2', at(6, 2)),
  bp('S3', 's3', at(2, 7)),
]

// The group moves the selected-piece controls make, as they computed them
// before movePieces (SelectedPieceControls.tsx at dev 704d71ed).
const translate = (pieces: BoardPiece[], direction: number): MoveArgs[] =>
  pieces.map((p) => ({
    uid: p.uid,
    newPieceCoords: hexUtilsAdd(p.pieceCoords, HEX_DIRECTIONS[direction]),
  }))
const rotateToNext = (pieces: BoardPiece[]): MoveArgs[] =>
  pieces.map((p) => ({
    uid: p.uid,
    newPieceCoords: p.pieceCoords,
    newRotation: (p.rotation + 1) % 6,
  }))
const raise = (pieces: BoardPiece[], delta: number): MoveArgs[] =>
  pieces
    .filter((p) => p.altitude + delta >= 0)
    .map((p) => ({
      uid: p.uid,
      newPieceCoords: p.pieceCoords,
      newAltitude: p.altitude + delta,
    }))

beforeEach(async () => {
  storageValues.clear()
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.resetModules()
  ;({ default: store } = await import('../store/store'))
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('movePiece one at a time (characterization)', () => {
  it.each([
    ['translate east', (p: BoardPiece[]) => translate(p, 0)],
    ['rotate', rotateToNext],
    ['raise one level', (p: BoardPiece[]) => raise(p, 1)],
  ])('%s: the store matches the frozen reference', (_, makeMoves) => {
    load(SPREAD)
    const start = boardState()
    const moves = makeMoves(start.boardPieces)
    for (const move of moves) store.getState().movePiece(move)
    expect(boardState()).toEqual(legacySequence(start, moves))
  })
})

const piecesOnly = ({ boardPieces, boardHexes }: BoardState) => ({
  boardPieces,
  boardHexes,
})
const pieceAt = (uid: string) =>
  store.getState().boardPieces.find((p) => p.uid === uid)
const ownerAt = (coords: CubeCoordinate, altitude: number) =>
  store.getState().boardHexes[`${altitude}~${coords.q}~${coords.r}`]
    ?.boardPieceUID

describe('movePieces', () => {
  it.each([
    ['translate east', (p: BoardPiece[]) => translate(p, 0)],
    ['rotate', rotateToNext],
    ['raise one level', (p: BoardPiece[]) => raise(p, 1)],
  ])(
    '%s: one update gives what moving them one at a time did',
    (_, makeMoves) => {
      load(SPREAD)
      const start = boardState()
      const moves = makeMoves(start.boardPieces)
      store.getState().movePieces({ moves })
      expect(boardState()).toEqual(legacySequence(start, moves))
    },
  )

  it('a single move equals movePiece (and the frozen reference)', () => {
    const move = { uid: 'R2', newPieceCoords: at(6, 5), newRotation: 2 }
    load(SPREAD)
    const start = boardState()
    store.getState().movePieces({ moves: [move] })
    const viaMovePieces = boardState()
    load(SPREAD)
    store.getState().movePiece(move)
    expect(boardState()).toEqual(viaMovePieces)
    expect(viaMovePieces).toEqual(legacyMovePiece(start, move))
  })

  it('moves three pieces as one undo step; undo and redo are exact', () => {
    load(SPREAD, 1)
    const before = boardState()
    store.getState().movePieces({ moves: raise(before.boardPieces, 3) })
    const after = boardState()
    expect(after.viewingLevel).toBe(4)
    expect(historyLength()).toBe(1)

    store.temporal.getState().undo()
    const undone = boardState()
    expect(piecesOnly(undone)).toEqual(piecesOnly(before))
    expect(undone.viewingLevel).toBe(before.viewingLevel)

    store.temporal.getState().redo()
    expect(boardState()).toEqual(after)
  })

  it('a rigid group shift: a piece may land where another one left', () => {
    // A at (2, 2) and B at (3, 2), both shifted one hex east. One at a time
    // (movePiece A, then B), A first lands on B and both are flagged; moving
    // B then clears it, so the end state happens to match. In one update
    // there is no in-between state, and A never displaces B.
    load([bp('A', 'g1', at(2, 2)), bp('B', 'g1', at(3, 2))])
    store.getState().movePieces({
      moves: [
        { uid: 'A', newPieceCoords: at(3, 2) },
        { uid: 'B', newPieceCoords: at(4, 2) },
      ],
    })
    expect(pieceAt('A')?.pieceCoords).toEqual(at(3, 2))
    expect(pieceAt('B')?.pieceCoords).toEqual(at(4, 2))
    expect(ownerAt(at(3, 2), 1)).toBe('A')
    expect(ownerAt(at(4, 2), 1)).toBe('B')
    expect(ownerAt(at(2, 2), 1)).toBeUndefined()
    expect(store.getState().conflictedPieceUIDs).toEqual([])
  })

  it('landing on a piece that stays displaces it exactly as movePiece does', () => {
    const pieces = [bp('A', 'g1', at(2, 2)), bp('C', 'g1', at(2, 4))]
    const move = { uid: 'A', newPieceCoords: at(2, 4) }
    load(pieces)
    const start = boardState()
    store.getState().movePieces({ moves: [move] })
    const viaMovePieces = boardState()
    expect(viaMovePieces).toEqual(legacyMovePiece(start, move))
    expect(viaMovePieces.conflictedPieceUIDs).toContain('C')
    load(pieces)
    store.getState().movePiece(move)
    expect(boardState()).toEqual(viaMovePieces)
  })

  it('a piece displaced earlier gets its hexes back when the mover leaves', () => {
    load([bp('A', 'g1', at(2, 2)), bp('C', 'g1', at(2, 4))])
    store.getState().movePiece({ uid: 'A', newPieceCoords: at(2, 4) })
    expect(store.getState().conflictedPieceUIDs).toContain('C')
    expect(ownerAt(at(2, 4), 1)).toBe('A')

    const start = boardState()
    const away = { uid: 'A', newPieceCoords: at(5, 5) }
    store.getState().movePieces({ moves: [away] })
    expect(ownerAt(at(2, 4), 1)).toBe('C')
    expect(store.getState().conflictedPieceUIDs).toEqual([])
    expect(boardState()).toEqual(legacyMovePiece(start, away))
  })

  it('raises the viewing level to the highest placed top, never lowers it', () => {
    load(SPREAD, 1)
    store.getState().movePieces({
      moves: [
        { uid: 'G1', newPieceCoords: at(2, 2), newAltitude: 3 },
        { uid: 'S3', newPieceCoords: at(2, 7), newAltitude: 5 },
      ],
    })
    expect(store.getState().viewingLevel).toBe(6)

    load(SPREAD, 10)
    store.getState().movePieces({
      moves: [{ uid: 'G1', newPieceCoords: at(2, 2), newAltitude: 2 }],
    })
    expect(store.getState().viewingLevel).toBe(10)
  })

  it('skips unknown uids', () => {
    const move = { uid: 'G1', newPieceCoords: at(4, 4) }
    load(SPREAD)
    store.getState().movePieces({
      moves: [{ uid: 'NOPE', newPieceCoords: at(1, 1) }, move],
    })
    const withUnknown = boardState()
    load(SPREAD)
    store.getState().movePieces({ moves: [move] })
    expect(withUnknown).toEqual(boardState())
  })

  it.each([
    ['an empty list', []],
    ['only unknown uids', [{ uid: 'NOPE', newPieceCoords: at(1, 1) }]],
  ])('%s is a complete no-op with no history', (_, moves: MoveArgs[]) => {
    load(SPREAD)
    const before = store.getState()
    store.getState().movePieces({ moves })
    expect(store.getState()).toBe(before)
    expect(historyLength()).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(
      localStorageMock.setItem.mock.calls.some(
        ([key]) => key === LS_KEYS.lastMap,
      ),
    ).toBe(false)
  })

  it('leaves pen and hover alone, and autosaves the moved map once', () => {
    load(SPREAD)
    store.getState().togglePenMode('g')
    store.getState().toggleHoveredPieceID('G1')
    const { penMode, hoveredPieceID } = store.getState()
    store.getState().movePieces({ moves: translate(SPREAD, 0) })
    expect(store.getState().penMode).toBe(penMode)
    expect(store.getState().hoveredPieceID).toBe(hoveredPieceID)

    vi.advanceTimersByTime(1000)
    const writes = localStorageMock.setItem.mock.calls.filter(
      ([key]) => key === LS_KEYS.lastMap,
    )
    expect(writes).toHaveLength(1)
    const saved = JSON.parse(writes[0][1] as string)
    expect(JSON.stringify(saved)).toContain('"G1"')
  })
})

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

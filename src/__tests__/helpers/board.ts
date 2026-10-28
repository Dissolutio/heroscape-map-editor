import { addPiece } from '../../data/addPiece'
import { removePiece } from '../../data/removePiece'
import { piecesSoFar } from '../../data/pieces'
import type {
  AddRemovePieceError,
  BoardHex,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
} from '../../types'
import { makeRectangleScenario } from '../../utils/map-gen'
import { genBoardHexID } from '../../utils/map-utils'

/**
 * The two pieces of state the placement engine reads and writes.
 * (The store also keeps `hexMap`, selection, undo history etc. - none of that
 * matters to the rules, so tests stay at this level.)
 */
export type Board = {
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}

export type Table = Board & {
  /** A hex near the middle of the table, far from every edge. */
  center: CubeCoordinate
}

/**
 * A bare table: every hex exists at altitude 0 as `empty`, nothing placed.
 * Altitude 0 is the table surface; a piece "placed at altitude 0" sits on it
 * and its top surface is the hex at altitude 1 (see the world-space notes in
 * .github/agents/hexoscape.agent.md).
 */
export function makeTable(size = 15): Table {
  const { boardHexes, boardPieces } = makeRectangleScenario({
    length: size,
    width: size,
    mapName: 'test-table',
  })
  const r = Math.floor(size / 2)
  const q = Math.floor(size / 2) - Math.floor(r / 2)
  return { boardHexes, boardPieces, center: { q, r, s: -q - r } }
}

type PlaceArgs = {
  board: Board
  pieceID: string
  at: CubeCoordinate
  altitude: number
  rotation?: number
  uid?: string
  permissive?: boolean
}

/**
 * Place a piece the way the store does, but return a fresh `Board` instead of
 * mutating anything. `permissive: true` is what the real app uses for painting
 * and loading; the default (strict) mode is what reports rule violations.
 */
export function place({
  board,
  pieceID,
  at,
  altitude,
  rotation = 0,
  uid,
  permissive = false,
}: PlaceArgs): {
  board: Board
  error: AddRemovePieceError
  displacedUIDs: string[]
} {
  const piece = piecesSoFar[pieceID]
  if (!piece) {
    throw new Error(`test helper: "${pieceID}" is not a registered piece`)
  }
  const result = addPiece({
    piece,
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    pieceCoords: at,
    placementAltitude: altitude,
    rotation,
    isVsTile: false,
    uid,
    permissive,
  })
  return {
    board: {
      boardHexes: result.newBoardHexes,
      boardPieces: result.newBoardPieces,
    },
    error: result.error,
    displacedUIDs: result.displacedUIDs ?? [],
  }
}

export function remove(board: Board, uid: string) {
  const result = removePiece({
    uid,
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
  })
  return {
    board: {
      boardHexes: result.newBoardHexes,
      boardPieces: result.newBoardPieces,
    },
    error: result.error,
  }
}

/**
 * A fully independent copy for tests that reuse one starting board across
 * many placements.
 */
export function cloneBoard<T extends Board>(board: T): T {
  return structuredClone(board)
}

/** Look up the hex at (coords, altitude), the same key the engine uses. */
export function hexAt(
  board: Board,
  coords: CubeCoordinate,
  altitude: number,
): BoardHex | undefined {
  return board.boardHexes[genBoardHexID({ ...coords, altitude })]
}

/**
 * Cover the whole table with 1-hex grass pieces at altitude 0, so anything
 * placed afterwards at altitude 1 has unambiguous solid support under every
 * hex of its footprint. (A single 24-hex tile is not centered on its origin,
 * so it cannot be relied on to support a large footprint.)
 */
export function withGrassFloor(table: Table): Table {
  // Keep the source table independent from the floor-building placements.
  let board: Board = cloneBoard({
    boardHexes: table.boardHexes,
    boardPieces: table.boardPieces,
  })
  for (const hex of Object.values(table.boardHexes)) {
    const placed = place({
      board,
      pieceID: 'g1',
      at: { q: hex.q, r: hex.r, s: hex.s },
      altitude: 0,
    })
    if (placed.error) {
      throw new Error(
        `test helper: could not lay the grass floor: ${placed.error.message}`,
      )
    }
    board = placed.board
  }
  return { ...board, center: table.center }
}

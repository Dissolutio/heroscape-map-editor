// Which castle walls and bases have their top covered: a drawn, whole-hex
// piece fills the hex directly above the piece's top. A covered top hides the
// Virtualscape receiver (the male connector above the shoulder), which would
// be inside the piece on top. Derived from boardHexes only, so it is always
// right after undo, redo, loading or dragging. Classic models don't use it.
import { type BoardHex, type BoardHexes, HexTerrain } from '../../types'
import { genBoardHexID } from '../../utils/map-utils'

const TOPPED_TERRAINS = new Set<string>([
  HexTerrain.castleWall,
  HexTerrain.castleBase,
])

// Hexes that are on the level above but don't fill it: ladders hang on an
// edge (battlements and other edge pieces have no hexes at all).
const NOT_COVERING_TERRAINS = new Set<string>([
  HexTerrain.empty,
  HexTerrain.ladder,
])

/** Drawn at this viewing level: the same rule the 3D map uses. */
const isDrawn = (hex: BoardHex, viewingLevel: number) =>
  hex.altitude <= viewingLevel

/** The UIDs of castle walls and bases whose top is covered. */
export function computeCoveredFortressTops(
  boardHexes: BoardHexes,
  viewingLevel: number,
): Set<string> {
  // The top hex of each wall or base column: its highest hex.
  const tops = new Map<string, BoardHex>()
  for (const hex of Object.values(boardHexes)) {
    if (!hex.boardPieceUID || !TOPPED_TERRAINS.has(hex.terrain)) continue
    const key = `${hex.boardPieceUID}|${hex.q}|${hex.r}`
    const top = tops.get(key)
    if (!top || hex.altitude > top.altitude) tops.set(key, hex)
  }
  const covered = new Set<string>()
  for (const top of tops.values()) {
    const above =
      boardHexes[genBoardHexID({ ...top, altitude: top.altitude + 1 })]
    if (
      above &&
      above.boardPieceUID !== top.boardPieceUID &&
      !NOT_COVERING_TERRAINS.has(above.terrain) &&
      isDrawn(above, viewingLevel)
    ) {
      covered.add(top.boardPieceUID ?? '')
    }
  }
  return covered
}

// One lookup per board and viewing level, shared by every wall and base:
// boardHexes is immutable, so the same object means the same board.
let lastBoardHexes: BoardHexes | null = null
let lastViewingLevel = Number.NaN
let lastCovered = new Set<string>()

export function getCoveredFortressTops(
  boardHexes: BoardHexes,
  viewingLevel: number,
): Set<string> {
  if (boardHexes !== lastBoardHexes || viewingLevel !== lastViewingLevel) {
    lastCovered = computeCoveredFortressTops(boardHexes, viewingLevel)
    lastBoardHexes = boardHexes
    lastViewingLevel = viewingLevel
  }
  return lastCovered
}

export function isFortressTopCovered(
  boardHexes: BoardHexes,
  viewingLevel: number,
  pieceUID: string,
) {
  return getCoveredFortressTops(boardHexes, viewingLevel).has(pieceUID)
}

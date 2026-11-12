/**
 * Unified cells: the coordinate-only conflict rule.
 *
 * Every piece fills a set of cells, each over a range of levels:
 * - a hex cell, the hex interior (`hex:q,r,s`);
 * - an edge cell, a HexEdgeId;
 * - a node cell, a HexNodeId.
 *
 * Two pieces conflict when they fill the same cell at an overlapping level.
 * Which cells a piece fills comes from pieceCellDeclarations (pieceFeatures.ts):
 * undeclared pieces fill the hex cell, 6 edges and 6 nodes of every hex they
 * write, so between two of them this rule is the old "one owner per hex"
 * rule, which addPiece still applies through boardHexes. This module only
 * adds the pairs a hex-only check cannot see: those involving an
 * edges-and-nodes piece (Fortified Wall, Ruins 2/3).
 *
 * Levels are half-open intervals [bottom, top) in level units, where 0 is the
 * table surface. A boardHex at altitude `a` fills [a - 1, a): a land tile
 * placed on the table is the hex at altitude 1 and fills [0, 1). A wall
 * placed at altitude A stands on level A + 1, so a footprint entry `n`
 * (levels 1..n) fills [A, A + n).
 *
 * Weight, balance and counterweight are out of scope: this is coordinates
 * only.
 */
import type {
  BoardHex,
  BoardHexes,
  BoardPieces,
  CubeCoordinate,
} from '../../types'
import { genBoardHexID } from '../../utils/map-utils'
import { hexUtilsRotateAroundOrigin_000 } from '../../utils/hex-utils'
import {
  getObstructedLevelOffsets,
  type ObstructionEntry,
} from '../vertical-obstruction-templates'
import {
  type HexEdgeId,
  type HexNodeId,
  edgesForHex,
  hexesForEdge,
  hexesForNode,
  nodesForHex,
} from './edgesAndNodes'
import { type HexCellId, pieceCellDeclarations } from './pieceFeatures'

export type PieceCellId = HexCellId | HexEdgeId | HexNodeId

export type FilledCell = {
  cell: HexEdgeId | HexNodeId
  /** First level filled (inclusive), in level units above the table. */
  bottom: number
  /** Level the cell is filled up to (exclusive). */
  top: number
}

type CellPiece = {
  inventoryID: string
  pieceCoords: CubeCoordinate
  rotation: number
  altitude: number
}

export function getPieceCellDeclaration(inventoryID: string) {
  return pieceCellDeclarations[inventoryID]
}

/** Pieces that stand between hexes (on edges and nodes), not in them. */
export function isEdgeNodePieceID(inventoryID: string | undefined) {
  return (
    inventoryID !== undefined &&
    pieceCellDeclarations[inventoryID]?.fills === 'edges-and-nodes'
  )
}

/** Pieces whose base fills only the hex center. */
export function isHexCenterPieceID(inventoryID: string | undefined) {
  return (
    inventoryID !== undefined &&
    pieceCellDeclarations[inventoryID]?.fills === 'hex-center'
  )
}

type RelativeCell = {
  kind: 'edge' | 'node'
  coords: CubeCoordinate
  entry: ObstructionEntry
}

const parsedFootprints = new Map<string, RelativeCell[][]>()

function parseFootprintCell(id: string, entry: ObstructionEntry) {
  const match = /^(edge|node):(-?\d+),(-?\d+),(-?\d+)$/.exec(id)
  if (!match) throw new RangeError(`Invalid footprint cell ${id}`)
  return {
    kind: match[1] as 'edge' | 'node',
    coords: { q: Number(match[2]), r: Number(match[3]), s: Number(match[4]) },
    entry,
  }
}

const normalizeZero = (value: number) => (Object.is(value, -0) ? 0 : value)

/** The footprint at each of the 6 rotations, relative to the origin. */
function getRotatedFootprints(inventoryID: string) {
  const cached = parsedFootprints.get(inventoryID)
  if (cached) return cached
  const declaration = pieceCellDeclarations[inventoryID]
  if (declaration?.fills !== 'edges-and-nodes') return undefined
  const base = Object.entries(declaration.footprint).map(([id, entry]) =>
    parseFootprintCell(id, entry),
  )
  // Edge and node ids are cube coordinates scaled by 2 and 3, so they rotate
  // around the origin exactly like the tile templates do.
  const rotated = Array.from({ length: 6 }, (_, rotation) =>
    base.map((cell) => ({
      ...cell,
      coords: hexUtilsRotateAroundOrigin_000(cell.coords, rotation),
    })),
  )
  parsedFootprints.set(inventoryID, rotated)
  return rotated
}

// Board pieces are reused across replays and previews; the signature guards
// against a piece object edited in place.
const cellsByPiece = new WeakMap<
  object,
  { signature: string; cells: FilledCell[] }
>()
const pieceSignature = (piece: CellPiece) =>
  `${piece.inventoryID}|${piece.pieceCoords.q},${piece.pieceCoords.r},${piece.pieceCoords.s}|${piece.rotation}|${piece.altitude}`

/**
 * The edge and node cells an edges-and-nodes piece fills, absolute, with
 * their level ranges. Empty for any other piece, or a rotation that is not a
 * whole step.
 */
export function getEdgeNodePieceCells(piece: CellPiece): FilledCell[] {
  const signature = pieceSignature(piece)
  const cached = cellsByPiece.get(piece)
  if (cached?.signature === signature) return cached.cells
  const footprints = getRotatedFootprints(piece.inventoryID)
  const rotation = ((piece.rotation % 6) + 6) % 6
  if (!footprints || !Number.isInteger(rotation)) return []
  const { q, r, s } = piece.pieceCoords
  const cells = footprints[rotation].map(({ kind, coords, entry }) => {
    const scale = kind === 'edge' ? 2 : 3
    const offsets = getObstructedLevelOffsets(entry)
    return {
      cell: `${kind}:${normalizeZero(scale * q + coords.q)},${normalizeZero(
        scale * r + coords.r,
      )},${normalizeZero(scale * s + coords.s)}` as HexEdgeId | HexNodeId,
      bottom: piece.altitude + Math.min(...offsets),
      top: piece.altitude + Math.max(...offsets) + 1,
    }
  })
  cellsByPiece.set(piece, { signature, cells })
  return cells
}

/** The hexes whose edges or corners a cell is. */
export function hexesTouchingCell(cell: HexEdgeId | HexNodeId) {
  return cell.startsWith('edge:')
    ? hexesForEdge(cell as HexEdgeId)
    : hexesForNode(cell as HexNodeId)
}

/** Every hex an edges-and-nodes piece touches: the columns it can conflict in. */
export function getEdgeNodePieceColumns(piece: CellPiece): CubeCoordinate[] {
  const columns = new Map<string, CubeCoordinate>()
  for (const { cell } of getEdgeNodePieceCells(piece)) {
    for (const hex of hexesTouchingCell(cell)) {
      columns.set(`${hex.q},${hex.r},${hex.s}`, hex)
    }
  }
  return [...columns.values()]
}

/**
 * The edge and node cells a boardHex fills (its hex cell aside, which no
 * edges-and-nodes piece shares). Default pieces fill all 12; hex-center
 * pieces and the edges-and-nodes pieces' own hexes fill none.
 */
function getBoardHexEdgeNodeCells(hex: BoardHex): (HexEdgeId | HexNodeId)[] {
  if (
    !hex.boardPieceUID ||
    isEdgeNodePieceID(hex.inventoryID) ||
    isHexCenterPieceID(hex.inventoryID)
  ) {
    return []
  }
  const coords = { q: hex.q, r: hex.r, s: hex.s }
  return [...edgesForHex(coords), ...nodesForHex(coords)]
}

const overlaps = (bottom: number, top: number, other: FilledCell) =>
  bottom < other.top && other.bottom < top

type IndexedCell = FilledCell & { uid: string }

function indexEdgeNodePieces(boardPieces: BoardPieces, excludeUID: string) {
  const index = new Map<string, IndexedCell[]>()
  for (const piece of boardPieces) {
    if (piece.uid === excludeUID || !isEdgeNodePieceID(piece.inventoryID)) {
      continue
    }
    for (const cell of getEdgeNodePieceCells(piece)) {
      const entries = index.get(cell.cell)
      const entry = { ...cell, uid: piece.uid }
      if (entries) entries.push(entry)
      else index.set(cell.cell, [entry])
    }
  }
  return index
}

/**
 * The pieces that share a cell, at an overlapping level, with a piece that
 * has just been written into `boardHexes`. Only pairs that involve an
 * edges-and-nodes piece are reported; addPiece reports the others through
 * boardHexes ownership.
 *
 * - For an edges-and-nodes piece: the other edges-and-nodes pieces in
 *   `boardPieces`, and the boardHexes (of default pieces) that touch its
 *   cells. `boardHexes` must include the columns of
 *   getEdgeNodePieceColumns.
 * - For any other piece: the edges-and-nodes pieces in `boardPieces` whose
 *   cells are edges or nodes of the hexes it wrote (`writtenHexes`).
 */
export function findCellConflicts({
  piece,
  uid,
  writtenHexes,
  boardHexes,
  boardPieces,
}: {
  piece: CellPiece
  uid: string
  writtenHexes: BoardHex[]
  boardHexes: BoardHexes
  boardPieces: BoardPieces
}): string[] {
  const conflicts = new Set<string>()
  if (isEdgeNodePieceID(piece.inventoryID)) {
    const cells = getEdgeNodePieceCells(piece)
    const others = indexEdgeNodePieces(boardPieces, uid)
    for (const cell of cells) {
      for (const other of others.get(cell.cell) ?? []) {
        if (overlaps(cell.bottom, cell.top, other)) conflicts.add(other.uid)
      }
      // A hex at altitude a fills [a - 1, a), so the hexes that can overlap
      // [bottom, top) sit at altitudes in (bottom, top + 1).
      for (const coords of hexesTouchingCell(cell.cell)) {
        for (
          let altitude = cell.bottom + 0.5;
          altitude < cell.top + 1;
          altitude += 0.5
        ) {
          const hex = boardHexes[genBoardHexID({ ...coords, altitude })]
          if (
            hex?.boardPieceUID &&
            hex.boardPieceUID !== uid &&
            getBoardHexEdgeNodeCells(hex).length > 0
          ) {
            conflicts.add(hex.boardPieceUID)
          }
        }
      }
    }
    return [...conflicts]
  }

  if (isHexCenterPieceID(piece.inventoryID) || writtenHexes.length === 0) {
    return []
  }
  const walls = indexEdgeNodePieces(boardPieces, uid)
  if (walls.size === 0) return []
  for (const hex of writtenHexes) {
    for (const cell of getBoardHexEdgeNodeCells(hex)) {
      for (const wall of walls.get(cell) ?? []) {
        if (overlaps(hex.altitude - 1, hex.altitude, wall)) {
          conflicts.add(wall.uid)
        }
      }
    }
  }
  return [...conflicts]
}

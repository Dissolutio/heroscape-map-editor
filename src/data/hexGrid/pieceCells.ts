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
 * edges-and-nodes piece (Fortified Wall, Ruins 2/3). Against such a piece, a
 * `footprint` piece (Ship Wall, Ship Bow) presents its derived cells instead
 * of its whole hexes; against everything else it still owns its hexes.
 *
 * Levels are half-open intervals [bottom, top) in level units, where 0 is the
 * table surface. A boardHex at altitude `a` fills [a - 1, a): a land tile
 * placed on the table is the hex at altitude 1 and fills [0, 1). A piece
 * placed at altitude A stands on level A + 1 (a ship on the full level,
 * getShipPlacementAltitude), so a footprint entry `n` (levels 1..n) fills
 * [A, A + n).
 *
 * Weight, balance and counterweight are out of scope: this is coordinates
 * only.
 */
import type {
  BoardHex,
  BoardHexes,
  BoardPiece,
  BoardPieces,
  CubeCoordinate,
} from '../../types'
import {
  getShipPlacementAltitude,
  isShipPieceID,
} from '../../utils/board-utils'
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
  cell: PieceCellId
  /** First level filled (inclusive), in level units above the table. */
  bottom: number
  /** Level the cell is filled up to (exclusive). */
  top: number
  /** The hex of a hex cell, or the 2 (edge) or 3 (node) hexes it borders. */
  hexes: readonly CubeCoordinate[]
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

/**
 * Pieces that own their hexes like any other but present derived cells
 * (hex cells, and only the edges and nodes they reach) to the walls.
 */
export function isFootprintPieceID(inventoryID: string | undefined) {
  return (
    inventoryID !== undefined &&
    pieceCellDeclarations[inventoryID]?.fills === 'footprint'
  )
}

/** Pieces with a derived cell footprint: walls and ships. */
export function hasCellFootprint(inventoryID: string | undefined) {
  return isEdgeNodePieceID(inventoryID) || isFootprintPieceID(inventoryID)
}

/** Pieces whose base fills only the hex center. */
export function isHexCenterPieceID(inventoryID: string | undefined) {
  return (
    inventoryID !== undefined &&
    pieceCellDeclarations[inventoryID]?.fills === 'hex-center'
  )
}

type CellKind = 'hex' | 'edge' | 'node'
const SCALE: Record<CellKind, number> = { hex: 1, edge: 2, node: 3 }

type RelativeCell = {
  kind: CellKind
  coords: CubeCoordinate
  entry: ObstructionEntry
}

const parsedFootprints = new Map<string, RelativeCell[][]>()

function parseFootprintCell(id: string, entry: ObstructionEntry) {
  const match = /^(hex|edge|node):(-?\d+),(-?\d+),(-?\d+)$/.exec(id)
  if (!match) throw new RangeError(`Invalid footprint cell ${id}`)
  return {
    kind: match[1] as CellKind,
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
  if (
    declaration?.fills !== 'edges-and-nodes' &&
    declaration?.fills !== 'footprint'
  ) {
    return undefined
  }
  const base = Object.entries(declaration.footprint).map(([id, entry]) =>
    parseFootprintCell(id, entry),
  )
  // Hex, edge and node ids are cube coordinates scaled by 1, 2 and 3, so
  // they rotate around the origin exactly like the tile templates do.
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
 * The cells a piece with a cell footprint (wall or ship) fills, absolute,
 * with their level ranges. Empty for any other piece, or a rotation that is
 * not a whole step.
 */
export function getPieceFootprintCells(piece: CellPiece): FilledCell[] {
  const signature = pieceSignature(piece)
  const cached = cellsByPiece.get(piece)
  if (cached?.signature === signature) return cached.cells
  const footprints = getRotatedFootprints(piece.inventoryID)
  const rotation = ((piece.rotation % 6) + 6) % 6
  if (!footprints || !Number.isInteger(rotation)) return []
  const { q, r, s } = piece.pieceCoords
  // Ships sit on the full level even over a half-level fluid cap.
  const base = isShipPieceID(piece.inventoryID)
    ? getShipPlacementAltitude(piece.altitude)
    : piece.altitude
  const cells = footprints[rotation].map(({ kind, coords, entry }) => {
    const scale = SCALE[kind]
    const offsets = getObstructedLevelOffsets(entry)
    const cell =
      `${kind}:${normalizeZero(scale * q + coords.q)},${normalizeZero(
        scale * r + coords.r,
      )},${normalizeZero(scale * s + coords.s)}` as PieceCellId
    return {
      cell,
      bottom: base + Math.min(...offsets),
      top: base + Math.max(...offsets) + 1,
      hexes: hexesTouchingCell(cell),
    }
  })
  cellsByPiece.set(piece, { signature, cells })
  return cells
}

/** The hex of a hex cell, or the hexes whose edge or corner a cell is. */
export function hexesTouchingCell(cell: PieceCellId): CubeCoordinate[] {
  if (cell.startsWith('hex:')) {
    const [q, r, s] = cell.slice(4).split(',').map(Number)
    return [{ q, r, s }]
  }
  return cell.startsWith('edge:')
    ? hexesForEdge(cell as HexEdgeId)
    : hexesForNode(cell as HexNodeId)
}

/** Every hex an edges-and-nodes piece touches: the columns it can conflict in. */
export function getEdgeNodePieceColumns(piece: CellPiece): CubeCoordinate[] {
  if (!isEdgeNodePieceID(piece.inventoryID)) return []
  const columns = new Map<string, CubeCoordinate>()
  for (const { hexes } of getPieceFootprintCells(piece)) {
    for (const hex of hexes) {
      columns.set(`${hex.q},${hex.r},${hex.s}`, hex)
    }
  }
  return [...columns.values()]
}

/**
 * The edge and node cells a boardHex fills (its hex cell aside, which no
 * edges-and-nodes piece shares). Default pieces fill all 12. Hex-center
 * pieces fill none, and pieces with a cell footprint present that instead.
 */
function getBoardHexEdgeNodeCells(hex: BoardHex): (HexEdgeId | HexNodeId)[] {
  if (
    !hex.boardPieceUID ||
    hasCellFootprint(hex.inventoryID) ||
    isHexCenterPieceID(hex.inventoryID)
  ) {
    return []
  }
  const coords = { q: hex.q, r: hex.r, s: hex.s }
  return [...edgesForHex(coords), ...nodesForHex(coords)]
}

const overlaps = (bottom: number, top: number, other: FilledCell) =>
  bottom < other.top && other.bottom < top

type IndexedCell = FilledCell & {
  uid: string
  /** An edges-and-nodes piece (a wall), not a footprint piece. */
  isWall: boolean
}

const columnKey = ({ q, r }: CubeCoordinate) => `${q},${r}`

// genBoardHexID, with the (often half-level) altitude formatted once.
const altitudeStrings = new Map<number, string>()
function hexKey({ q, r }: CubeCoordinate, altitude: number) {
  let text = altitudeStrings.get(altitude)
  if (text === undefined) {
    text = String(altitude)
    altitudeStrings.set(altitude, text)
  }
  return `${text}~${q}~${r}`
}

// A piece's cells tagged with its uid, and the columns they touch.
const indexedCellsByPiece = new WeakMap<
  BoardPiece,
  {
    cells: FilledCell[]
    uid: string
    indexed: IndexedCell[]
    columns: string[]
  }
>()
function getIndexedCells(piece: BoardPiece) {
  const cells = getPieceFootprintCells(piece)
  const cached = indexedCellsByPiece.get(piece)
  if (cached?.cells === cells && cached.uid === piece.uid) {
    return { cells: cached.indexed, columns: cached.columns }
  }
  const isWall = isEdgeNodePieceID(piece.inventoryID)
  const indexed = cells.map((cell) => ({ ...cell, uid: piece.uid, isWall }))
  const columns = [
    ...new Set(cells.flatMap((cell) => cell.hexes.map(columnKey))),
  ]
  indexedCellsByPiece.set(piece, { cells, uid: piece.uid, indexed, columns })
  return { cells: indexed, columns }
}

type EdgeNodeIndex = {
  /** The cells of the walls and footprint pieces, by cell id. */
  byCell: Map<string, IndexedCell[]>
  /** Every column a wall touches. */
  columns: Set<string>
}

// The index of a board piece list, built once per list. An index is never
// changed after it is built; the length guards against a list pushed to
// after it was indexed.
const indexByPieces = new WeakMap<
  BoardPieces,
  { length: number; index: EdgeNodeIndex }
>()

function getEdgeNodeIndex(boardPieces: BoardPieces): EdgeNodeIndex {
  const cached = indexByPieces.get(boardPieces)
  if (cached?.length === boardPieces.length) return cached.index
  const index: EdgeNodeIndex = { byCell: new Map(), columns: new Set() }
  for (const piece of boardPieces) {
    if (!hasCellFootprint(piece.inventoryID)) continue
    const indexed = getIndexedCells(piece)
    for (const entry of indexed.cells) {
      const entries = index.byCell.get(entry.cell)
      if (entries) entries.push(entry)
      else index.byCell.set(entry.cell, [entry])
    }
    if (isEdgeNodePieceID(piece.inventoryID)) {
      for (const column of indexed.columns) index.columns.add(column)
    }
  }
  indexByPieces.set(boardPieces, { length: boardPieces.length, index })
  return index
}

/**
 * Let `next` (a copy of `previous` plus one piece without a cell footprint)
 * reuse `previous`'s index, so a replay rebuilds it only when a wall or ship
 * is added.
 */
export function shareEdgeNodeIndex(
  previous: BoardPieces,
  next: BoardPieces,
  addedInventoryID: string,
) {
  if (hasCellFootprint(addedInventoryID)) return
  const cached = indexByPieces.get(previous)
  if (cached?.length === previous.length) {
    indexByPieces.set(next, { length: next.length, index: cached.index })
  }
}

/**
 * The pieces that share a cell, at an overlapping level, with a piece that
 * has just been written into `boardHexes`. Only pairs that involve an
 * edges-and-nodes piece are reported; addPiece reports the others through
 * boardHexes ownership.
 *
 * - For an edges-and-nodes piece: the other walls and footprint pieces in
 *   `boardPieces` that share a cell, and the boardHexes (of default pieces)
 *   that touch its cells. `boardHexes` must include the columns of
 *   getEdgeNodePieceColumns.
 * - For a footprint piece: the walls in `boardPieces` that share a cell.
 * - For any other piece: the walls in `boardPieces` whose cells are edges or
 *   nodes of the hexes it wrote (`writtenHexes`).
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
  if (isFootprintPieceID(piece.inventoryID)) {
    const walls = getEdgeNodeIndex(boardPieces).byCell
    for (const cell of getPieceFootprintCells(piece)) {
      for (const wall of walls.get(cell.cell) ?? []) {
        if (
          wall.isWall &&
          wall.uid !== uid &&
          overlaps(cell.bottom, cell.top, wall)
        ) {
          conflicts.add(wall.uid)
        }
      }
    }
    return [...conflicts]
  }
  if (isEdgeNodePieceID(piece.inventoryID)) {
    const cells = getPieceFootprintCells(piece)
    const others = getEdgeNodeIndex(boardPieces).byCell
    // Each column this piece touches, with the level span of its cells there.
    const columns = new Map<
      string,
      { coords: CubeCoordinate; bottom: number; top: number }
    >()
    for (const cell of cells) {
      for (const other of others.get(cell.cell) ?? []) {
        if (other.uid !== uid && overlaps(cell.bottom, cell.top, other)) {
          conflicts.add(other.uid)
        }
      }
      for (const coords of cell.hexes) {
        const key = columnKey(coords)
        const column = columns.get(key)
        if (column) {
          column.bottom = Math.min(column.bottom, cell.bottom)
          column.top = Math.max(column.top, cell.top)
        } else {
          columns.set(key, { coords, bottom: cell.bottom, top: cell.top })
        }
      }
    }
    const cellsByID = new Map(cells.map((cell) => [cell.cell as string, cell]))
    for (const { coords, bottom, top } of columns.values()) {
      // A hex at altitude a fills [a - 1, a), so the hexes that can overlap
      // [bottom, top) sit at altitudes in (bottom, top + 1).
      for (let altitude = bottom + 0.5; altitude < top + 1; altitude += 0.5) {
        const hex = boardHexes[hexKey(coords, altitude)]
        if (!hex?.boardPieceUID || hex.boardPieceUID === uid) continue
        for (const hexCell of getBoardHexEdgeNodeCells(hex)) {
          const cell = cellsByID.get(hexCell)
          if (cell && overlaps(altitude - 1, altitude, cell)) {
            conflicts.add(hex.boardPieceUID)
            break
          }
        }
      }
    }
    return [...conflicts]
  }

  if (isHexCenterPieceID(piece.inventoryID) || writtenHexes.length === 0) {
    return []
  }
  const walls = getEdgeNodeIndex(boardPieces)
  if (walls.byCell.size === 0) return []
  for (const hex of writtenHexes) {
    if (!walls.columns.has(columnKey(hex))) continue
    for (const cell of getBoardHexEdgeNodeCells(hex)) {
      for (const wall of walls.byCell.get(cell) ?? []) {
        if (
          wall.isWall &&
          wall.uid !== uid &&
          overlaps(hex.altitude - 1, hex.altitude, wall)
        ) {
          conflicts.add(wall.uid)
        }
      }
    }
  }
  return [...conflicts]
}

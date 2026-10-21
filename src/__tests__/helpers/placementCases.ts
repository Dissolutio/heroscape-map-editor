import type { PlacementBlockedReason } from '../../data/placement'
import type { BoardHex, CubeCoordinate } from '../../types'
import { HexTerrain } from '../../types'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './board'

/**
 * Click placements, one or more per piece family: what today's click handler
 * (onPointerUpPaintPiece) does when the pen is `pieceID` and the pointer is
 * on `hex`. click-placement.test.ts runs these through the real handler and
 * through resolvePlacement, so both must agree.
 *
 * `hex` is the object the clicked mesh hands the handler: a board hex for
 * caps, castle walls and arches, and a made-up "partial hex" for Laur pillars
 * and ladders (see LaurPillar.tsx and Ladder.tsx).
 */
export type PlacementCase = {
  name: string
  pieceID: string
  rotation: number
  setup: () => { board: Board; hex: BoardHex }
  expected:
    | {
        placed: {
          coords: CubeCoordinate
          /** Left out where it would pin fluid-on-fluid stacking. */
          altitude?: number
          rotation: number
        }
      }
    | { refused: PlacementBlockedReason }
}

const table = withGrassFloor(makeTable(9))
// The middle of the 9x9 table; neighbours below are by rotation (0 is east).
const c = table.center // { q: 2, r: 4, s: -6 }
const east = { q: 3, r: 4, s: -7 } // rotation 0
const northEast = { q: 3, r: 3, s: -6 } // rotation 1
const northWest = { q: 2, r: 3, s: -5 } // rotation 2

function add(
  board: Board,
  pieceID: string,
  at: CubeCoordinate,
  altitude: number,
  rotation = 0,
  uid?: string,
) {
  const result = place({
    // placing edits the hex objects it is given, and `table` is shared
    board: cloneBoard(board),
    pieceID,
    at,
    altitude,
    rotation,
    uid,
    permissive: true,
  })
  if (result.error) throw new Error(`${pieceID}: ${result.error.message}`)
  return result.board
}

function mustHex(board: Board, at: CubeCoordinate, altitude: number) {
  const hex = hexAt(board, at, altitude)
  if (!hex) throw new Error(`no hex at ${JSON.stringify(at)} ${altitude}`)
  return hex
}

/** The grass floor's top hex at the middle of the table (altitude 1). */
const onGrass = () => ({ board: table, hex: mustHex(table, c, 1) })

/**
 * A straight castle wall (uid CW) on the grass; its origin hex is clicked.
 * Only another castle wall or a wall walk can go on a wall's top; the rest
 * are KNOWN GAP tests in click-placement.test.ts.
 */
export const onCastleWall = () => {
  const board = add(table, 'cws', c, 1, 0, 'CW')
  return { board, hex: mustHex(board, c, 2) }
}

/** A castle arch (uid CA) on the grass; its origin hex is clicked. */
export const onCastleArch = () => {
  const board = add(table, 'ca', c, 1, 0, 'CA')
  return { board, hex: mustHex(board, c, 2) }
}

/** The hex LaurPillar.tsx passes: the pillar's coords at its own altitude. */
export function pillarPartialHex(board: Board, uid: string): BoardHex {
  const bp = board.boardPieces.find((p) => p.uid === uid)
  if (!bp) throw new Error(`no pillar ${uid}`)
  return {
    ...bp.pieceCoords,
    boardPieceUID: bp.uid,
    altitude: bp.altitude,
    inventoryID: bp.inventoryID,
    pieceID: '',
    pieceRotation: bp.rotation,
    terrain: HexTerrain.laurWall,
  } as BoardHex
}

/** A square pillar (uid P1, rotation 2) on the grass. */
export const onPillar = () => {
  const board = add(table, 'lwp', c, 1, 2, 'P1')
  return { board, hex: pillarPartialHex(board, 'P1') }
}

const onStackablePillar = () => {
  const board = add(table, 'lwp2', c, 1, 2, 'P1')
  return { board, hex: pillarPartialHex(board, 'P1') }
}

/** A triangle pillar (uid T2) on the grass. */
export const onTrianglePillar = () => {
  const board = add(table, 'lwt', c, 1, 0, 'T2')
  return { board, hex: pillarPartialHex(board, 'T2') }
}

/** Two square pillars stacked (P1 at 1, P2 at 9); the top one is clicked. */
const onStackedPillar = () => {
  const board = add(add(table, 'lwp', c, 1, 0, 'P1'), 'lwp', c, 9, 0, 'P2')
  return { board, hex: pillarPartialHex(board, 'P2') }
}

/** The smart-placement example: grass at 0, rock two levels high at 2. */
function stackExample() {
  let board: Board = makeTable(3)
  board = add(board, 'g1', { q: 0, r: 0, s: 0 }, 0)
  board = add(board, 'r1', { q: 2, r: 0, s: -2 }, 0)
  board = add(board, 'r1', { q: 2, r: 0, s: -2 }, 1)
  return { board, hex: mustHex(board, { q: 1, r: 0, s: -1 }, 0) }
}

export const placementCases: PlacementCase[] = [
  // LAND
  {
    name: 'land: g1 on grass goes on the clicked cap',
    pieceID: 'g1',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'land: g7 keeps the pen rotation',
    pieceID: 'g7',
    rotation: 2,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 2 } },
  },
  {
    name: 'land refusal: g24 at the table corner would hang off the map',
    pieceID: 'g24',
    rotation: 0,
    setup: () => ({
      board: table,
      hex: mustHex(table, { q: 0, r: 0, s: 0 }, 1),
    }),
    expected: { refused: 'offMap' },
  },
  {
    name: 'land: g1 in the table corner is fully on the map',
    pieceID: 'g1',
    rotation: 0,
    setup: () => ({
      board: table,
      hex: mustHex(table, { q: 0, r: 0, s: 0 }, 1),
    }),
    expected: {
      placed: { coords: { q: 0, r: 0, s: 0 }, altitude: 1, rotation: 0 },
    },
  },
  {
    name: 'land: g2 smart altitude climbs onto the rock (rotation 0)',
    pieceID: 'g2',
    rotation: 0,
    setup: stackExample,
    expected: {
      placed: { coords: { q: 1, r: 0, s: -1 }, altitude: 2, rotation: 0 },
    },
  },
  {
    name: 'land: g2 smart altitude settles on the grass (rotation 3)',
    pieceID: 'g2',
    rotation: 3,
    setup: stackExample,
    expected: {
      placed: { coords: { q: 1, r: 0, s: -1 }, altitude: 1, rotation: 3 },
    },
  },
  {
    name: 'land: w1 on water is placed (altitude not pinned: fluid stacking)',
    pieceID: 'w1',
    rotation: 0,
    setup: () => {
      const board = add(table, 'w1', c, 1)
      return { board, hex: mustHex(board, c, 2) }
    },
    expected: { placed: { coords: c, rotation: 0 } },
  },
  {
    name: 'land refusal: solid g1 on a whole-level water cap',
    pieceID: 'g1',
    rotation: 0,
    setup: () => {
      const board = add(table, 'w1', c, 1)
      return { board, hex: mustHex(board, c, 2) }
    },
    expected: { refused: 'landTileNotOnHex' },
  },
  {
    name: 'land refusal: g1 on a Laur pillar',
    pieceID: 'g1',
    rotation: 0,
    setup: onPillar,
    expected: { refused: 'landTileNotOnHex' },
  },
  {
    name: 'land: g1 onto a tree still goes through (permissive)',
    pieceID: 'g1',
    rotation: 0,
    setup: () => {
      const board = add(table, 'tr10', c, 1, 0, 'T1')
      return { board, hex: mustHex(board, c, 1) }
    },
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  // OBSTACLES
  {
    name: 'obstacle: tree on grass',
    pieceID: 'tr10',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'obstacle: ruins keep the pen rotation',
    pieceID: 'rs2',
    rotation: 1,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 1 } },
  },
  {
    name: 'obstacle: tree onto a tree still goes through (permissive)',
    pieceID: 'tr10',
    rotation: 0,
    setup: () => {
      const board = add(table, 'tr10', c, 1, 0, 'T1')
      return { board, hex: mustHex(board, c, 1) }
    },
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  // GLYPHS AND START ZONES
  {
    name: 'glyph: on grass',
    pieceID: 'y0',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'start zone: on grass',
    pieceID: 'z1',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  // CASTLE
  {
    name: 'castle wall: on grass',
    pieceID: 'cws',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'castle wall: on a castle base (base hex clicked)',
    pieceID: 'cws',
    rotation: 0,
    setup: () => {
      const board = add(table, 'cbs', c, 1, 0, 'CB')
      return { board, hex: mustHex(board, c, 2) }
    },
    expected: { placed: { coords: c, altitude: 2, rotation: 0 } },
  },
  {
    name: 'castle wall: on a castle wall stacks on the cap',
    pieceID: 'cws',
    rotation: 0,
    setup: onCastleWall,
    expected: { placed: { coords: c, altitude: 11, rotation: 0 } },
  },
  {
    name: 'castle wall: a wall walk goes on the wall cap',
    pieceID: 'cg1',
    rotation: 0,
    setup: onCastleWall,
    expected: { placed: { coords: c, altitude: 11, rotation: 0 } },
  },
  {
    name: 'castle wall: a wall walk goes on an arch top',
    pieceID: 'cg1',
    rotation: 0,
    setup: onCastleArch,
    expected: { placed: { coords: c, altitude: 11, rotation: 0 } },
  },
  {
    name: 'castle wall: a castle wall goes on an arch top',
    pieceID: 'cws',
    rotation: 0,
    setup: onCastleArch,
    expected: { placed: { coords: c, altitude: 11, rotation: 0 } },
  },
  {
    name: 'castle refusal: an arch (bases attached) on a castle wall top',
    pieceID: 'ca',
    rotation: 0,
    setup: onCastleWall,
    expected: { refused: 'castleArchNeedsLand' },
  },
  {
    name: 'castle refusal: an arch without a door on an arch top',
    pieceID: 'cab',
    rotation: 0,
    setup: onCastleArch,
    expected: { refused: 'castleArchNeedsLand' },
  },
  {
    name: 'castle refusal: a castle wall base on a castle wall top',
    pieceID: 'cbs',
    rotation: 0,
    setup: onCastleWall,
    expected: { refused: 'notOnCastleWallTop' },
  },
  {
    name: 'castle refusal: a battlement on an arch top',
    pieceID: 'bt',
    rotation: 0,
    setup: onCastleArch,
    expected: { refused: 'notOnCastleWallTop' },
  },
  {
    name: 'castle arch: on grass',
    pieceID: 'ca',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'castle arch: clicking a side hex uses that hex column cap',
    pieceID: 'cws',
    rotation: 0,
    setup: () => {
      const { board } = onCastleArch()
      return { board, hex: mustHex(board, { q: 4, r: 4, s: -8 }, 2) }
    },
    expected: {
      placed: { coords: { q: 4, r: 4, s: -8 }, altitude: 11, rotation: 0 },
    },
  },
  // BATTLEMENT
  {
    name: 'battlement: on grass, rotation 0, goes on the east neighbour',
    pieceID: 'bt',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: east, altitude: 0, rotation: 3 } },
  },
  {
    name: 'battlement: on grass, rotation 4, mirrors the rotation',
    pieceID: 'bt',
    rotation: 4,
    setup: onGrass,
    expected: { placed: { coords: northWest, altitude: 0, rotation: 1 } },
  },
  // ROAD WALL
  {
    name: 'road wall: on grass, rotation 0',
    pieceID: 'rw',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: northWest, altitude: 0, rotation: 0 } },
  },
  {
    name: 'road wall: on grass, rotation 1',
    pieceID: 'rw',
    rotation: 1,
    setup: onGrass,
    expected: { placed: { coords: northEast, altitude: 0, rotation: 1 } },
  },
  // LADDER
  {
    name: 'ladder: on grass',
    pieceID: 'ld',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'ladder: on a ladder stacks one up and keeps its rotation',
    pieceID: 'ld',
    rotation: 4,
    setup: () => {
      const board = add(table, 'ld', c, 1, 1, 'L1')
      // Ladder.tsx passes the ladder's coords one level above its altitude
      const hex = {
        ...c,
        boardPieceUID: 'L1',
        altitude: 2,
        inventoryID: 'ld',
        pieceID: '',
        pieceRotation: 1,
      } as BoardHex
      return { board, hex }
    },
    expected: { placed: { coords: c, altitude: 3, rotation: 1 } },
  },
  // LAUR PILLARS
  {
    name: 'pillar: square pillar on grass',
    pieceID: 'lwp',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'pillar: stackable square pillar on grass',
    pieceID: 'lwp2',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
  {
    name: 'pillar: on a matching pillar stacks 8 up, keeps its rotation',
    pieceID: 'lwp',
    rotation: 0,
    setup: onPillar,
    expected: { placed: { coords: c, altitude: 9, rotation: 2 } },
  },
  {
    name: 'pillar: on a stacked pillar stacks again',
    pieceID: 'lwp',
    rotation: 0,
    setup: onStackedPillar,
    expected: { placed: { coords: c, altitude: 17, rotation: 0 } },
  },
  {
    name: 'pillar: triangle on triangle stacks',
    pieceID: 'lwt',
    rotation: 0,
    setup: onTrianglePillar,
    expected: { placed: { coords: c, altitude: 9, rotation: 0 } },
  },
  {
    name: 'pillar: stackable square pillar stacks on a stackable pillar',
    pieceID: 'lwp2',
    rotation: 0,
    setup: onStackablePillar,
    expected: { placed: { coords: c, altitude: 9, rotation: 2 } },
  },
  // ROPE LADDER
  {
    name: 'rope ladder: on grass hangs one level down',
    pieceID: 'rl',
    rotation: 1,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 0, rotation: 1 } },
  },
  // LAUR ADD-ONS
  {
    name: 'Laur add-on: short wall on a pillar, at the pillar altitude',
    pieceID: 'lws',
    rotation: 2,
    setup: onPillar,
    expected: { placed: { coords: c, altitude: 1, rotation: 2 } },
  },
  {
    name: 'Laur add-on: arch on a pillar snaps to a half-step port',
    pieceID: 'lwa',
    rotation: 5.5,
    setup: onPillar,
    expected: { placed: { coords: c, altitude: 1, rotation: 0.5 } },
  },
  {
    name: 'Laur add-on: on the upper pillar of a stack snaps to a port',
    pieceID: 'lws',
    rotation: 1,
    setup: onStackedPillar,
    expected: { placed: { coords: c, altitude: 9, rotation: 0 } },
  },
  {
    name: 'Laur add-on: on land without a pillar',
    pieceID: 'lws',
    rotation: 0,
    setup: onGrass,
    expected: { placed: { coords: c, altitude: 1, rotation: 0 } },
  },
]

/**
 * BURIED STATUS (utils/buriedStatus.ts)
 *
 * What the selected-piece readout and the pieces list report for a land piece:
 *  - buried: every hex of its surface has land resting directly on its cap
 *    (a fluid cap only counts land that rests on fluid; see below)
 *  - partially buried: at least one does
 *  - subterrain buried: every side of it is covered by neighbouring land over
 *    its full physical height (a fluid tile is half a level thick, with its
 *    real top half a level below its in-app surface) (a fluid piece's sides by any land, a solid piece's sides
 *    only by solid land)
 *
 * Heights include fluid-on-fluid half levels: water on water tops out at X.5,
 * and solid land on that rises the other half, back to a whole level.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import type { CubeCoordinate } from '../types'
import { makeBuriedStatusChecker } from '../utils/buriedStatus'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { type Board, hexAt, makeTable, place } from './helpers/board'

type Placement = {
  pieceID: string
  at: CubeCoordinate
  altitude: number
  rotation?: number
  uid?: string
}

const build = (board: Board, placements: Placement[]) =>
  placements.reduce(
    (b, p) => place({ board: b, ...p, permissive: true }).board,
    board,
  )

const statusOf = (board: Board, uid: string) => {
  const check = makeBuriedStatusChecker(board.boardHexes, board.boardPieces)
  const bp = board.boardPieces.find((p) => p.uid === uid)
  if (!bp) throw new Error(`no piece ${uid}`)
  return check(bp)
}

const ring = (center: CubeCoordinate) =>
  Object.values(HEX_DIRECTIONS).map((d) => hexUtilsAdd(center, d))

describe('buried / partially buried', () => {
  const table = makeTable()
  const c = table.center

  it('a lone grass tile is not buried at all', () => {
    const board = build(table, [
      { pieceID: 'g1', at: c, altitude: 0, uid: 'a' },
    ])
    expect(statusOf(board, 'a')).toEqual({
      isBuried: false,
      isPartiallyBuried: false,
      isSubterrainBuried: false,
    })
  })

  it('grass under grass is buried; the top one is not', () => {
    const board = build(table, [
      { pieceID: 'g1', at: c, altitude: 0, uid: 'bottom' },
      { pieceID: 'g1', at: c, altitude: 1, uid: 'top' },
    ])
    expect(statusOf(board, 'bottom')).toMatchObject({
      isBuried: true,
      isPartiallyBuried: true,
    })
    expect(statusOf(board, 'top')).toMatchObject({
      isBuried: false,
      isPartiallyBuried: false,
    })
  })

  it('water under stacked water is buried (the cover sits half a level up)', () => {
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0, uid: 'bottom' },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'top' },
    ])
    expect(statusOf(board, 'bottom')).toMatchObject({ isBuried: true })
    expect(statusOf(board, 'top')).toMatchObject({ isBuried: false })
  })

  it('a half-level water stack under grass is buried', () => {
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0, uid: 'water-1' },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'water-2' },
      { pieceID: 'g1', at: c, altitude: 1.5, uid: 'grass' },
    ])
    expect(statusOf(board, 'water-2')).toMatchObject({ isBuried: true })
    expect(statusOf(board, 'grass')).toMatchObject({ isBuried: false })
  })

  it('a 3-hex tile with one hex covered is partially buried, not buried', () => {
    const board = build(table, [
      { pieceID: 'g3', at: c, altitude: 0, uid: 'base' },
      { pieceID: 'g1', at: c, altitude: 1, uid: 'cover' },
    ])
    expect(statusOf(board, 'base')).toMatchObject({
      isBuried: false,
      isPartiallyBuried: true,
    })
  })
})

describe('fluid caps: only buried when something rests on the fluid', () => {
  // A fluid tile is physically half a level thick, so its real top is half a
  // level below its in-app surface. Land resting on fluid (water stacked on
  // water, or solid on a fluid stack) touches that cap. Land held up by a
  // taller solid tile next to it leaves a visible gap, so the fluid is not
  // buried. The owner's example map (lastMap, "Prison of Baldur"):
  //  (0,0): water 0->1, water 1->1.5, grass 1.5->2
  //  (1,0): water 0->1, with a 2-hex grass bridging over it at 1->2
  //  (2,0): grass 0->1, the 2-hex grass resting on it
  const piece = (
    uid: string,
    inventoryID: string,
    q: number,
    altitude: number,
    rotation = 0,
  ) => ({
    uid,
    inventoryID,
    altitude,
    rotation,
    pieceCoords: { q, r: 0, s: -q },
  })
  const map = buildupJsonFileMap(
    [
      piece('water-a', 'w1', 0, 0),
      piece('water-b', 'w1', 1, 0),
      piece('grass-c', 'g1', 2, 0),
      piece('bridge', 'g2', 2, 1, 3),
      piece('stacked', 'w1', 0, 1, 3),
      piece('grass-top', 'g1', 0, 1.5, 3),
    ],
    {
      id: 'example',
      name: 'Prison of Baldur',
      author: '',
      version: 1,
      shape: 'rectangle',
      width: 3,
      length: 1,
    },
  )

  it('the 2-hex grass really does sit over the single water at 1->2', () => {
    expect(hexAt(map, { q: 1, r: 0, s: -1 }, 2)).toMatchObject({
      boardPieceUID: 'bridge',
    })
  })

  it('water with grass bridging over it from a taller support is NOT buried', () => {
    expect(statusOf(map, 'water-b')).toMatchObject({
      isBuried: false,
      isPartiallyBuried: false,
    })
  })

  it('water under stacked water, and stacked water under grass, are buried', () => {
    expect(statusOf(map, 'water-a')).toMatchObject({ isBuried: true })
    expect(statusOf(map, 'stacked')).toMatchObject({ isBuried: true })
  })

  it('a solid tile under the 2-hex grass is buried (solids have no gap)', () => {
    expect(statusOf(map, 'grass-c')).toMatchObject({ isBuried: true })
  })

  it('grass resting entirely on whole-level water (older maps) does bury it', () => {
    const table = makeTable()
    const board = build(table, [
      { pieceID: 'w1', at: table.center, altitude: 0, uid: 'water' },
      { pieceID: 'g1', at: table.center, altitude: 1 },
    ])
    expect(statusOf(board, 'water')).toMatchObject({ isBuried: true })
  })
})

describe('subterrain buried', () => {
  const table = makeTable()
  const c = table.center

  it('grass ringed by grass on every side is subterrain buried', () => {
    const board = build(table, [
      { pieceID: 'g1', at: c, altitude: 0, uid: 'middle' },
      ...ring(c).map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'middle')).toMatchObject({
      isSubterrainBuried: true,
    })
  })

  it('one open side means not subterrain buried', () => {
    const board = build(table, [
      { pieceID: 'g1', at: c, altitude: 0, uid: 'middle' },
      ...ring(c)
        .slice(1)
        .map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'middle')).toMatchObject({
      isSubterrainBuried: false,
    })
  })

  it('a solid tile is not covered by fluid neighbours; a fluid tile is covered by solid ones', () => {
    const grassInWater = build(table, [
      { pieceID: 'g1', at: c, altitude: 0, uid: 'middle' },
      ...ring(c).map((at) => ({ pieceID: 'w1', at, altitude: 0 })),
    ])
    expect(statusOf(grassInWater, 'middle')).toMatchObject({
      isSubterrainBuried: false,
    })
    const waterInGrass = build(table, [
      { pieceID: 'w1', at: c, altitude: 0, uid: 'middle' },
      ...ring(c).map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(waterInGrass, 'middle')).toMatchObject({
      isSubterrainBuried: true,
    })
  })

  it('stacked water (sides 1 to 1.5) is covered by taller neighbours that reach past it', () => {
    // neighbours: grass 0->1 and grass 1->2, so each column spans 0..2
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'stacked' },
      ...ring(c).flatMap((at) => [
        { pieceID: 'g1', at, altitude: 0 },
        { pieceID: 'g1', at, altitude: 1 },
      ]),
    ])
    expect(statusOf(board, 'stacked')).toMatchObject({
      isSubterrainBuried: true,
    })
  })

  it('stacked water is covered by grass neighbours level with its real top', () => {
    // Physically the stacked water spans 0.5 to 1 (each water tile is half a
    // level thick), so grass 0->1 next to it hides its sides completely.
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'stacked' },
      ...ring(c).map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'stacked')).toMatchObject({
      isSubterrainBuried: true,
    })
  })

  it('a side with land only bridging over it, nothing underneath, is open', () => {
    // East of the stacked water: no tile, just a 2-hex grass reaching over
    // from further east at 1->2. The water's side (0.5 to 1) is visible.
    const east = hexUtilsAdd(c, HEX_DIRECTIONS[0])
    const farEast = hexUtilsAdd(east, HEX_DIRECTIONS[0])
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'stacked' },
      ...ring(c)
        .slice(1)
        .flatMap((at) => [
          { pieceID: 'g1', at, altitude: 0 },
          { pieceID: 'g1', at, altitude: 1 },
        ]),
      { pieceID: 'g1', at: farEast, altitude: 0 },
      { pieceID: 'g2', at: farEast, altitude: 1, rotation: 3 },
    ])
    expect(hexAt(board, east, 2)).toBeDefined()
    expect(statusOf(board, 'stacked')).toMatchObject({
      isSubterrainBuried: false,
    })
  })

  it('grass on a fluid stack really spans 1 to 2, so grass neighbours that stop at 1 leave it open', () => {
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1 },
      { pieceID: 'g1', at: c, altitude: 1.5, uid: 'grass' },
      ...ring(c).map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'grass')).toMatchObject({
      isSubterrainBuried: false,
    })
  })

  it('water on the table ringed by water is covered', () => {
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0, uid: 'middle' },
      ...ring(c).map((at) => ({ pieceID: 'w1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'middle')).toMatchObject({
      isSubterrainBuried: true,
    })
  })

  it('grass on a half-level stack (sides 1.5 to 2) is covered by neighbours spanning 0..2', () => {
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1 },
      { pieceID: 'g1', at: c, altitude: 1.5, uid: 'grass' },
      ...ring(c).flatMap((at) => [
        { pieceID: 'g1', at, altitude: 0 },
        { pieceID: 'g1', at, altitude: 1 },
      ]),
    ])
    expect(statusOf(board, 'grass')).toMatchObject({ isSubterrainBuried: true })
  })
})

describe('non-land pieces', () => {
  it('get no buried status (null)', () => {
    const table = makeTable()
    const board = build(table, [
      { pieceID: 'g1', at: table.center, altitude: 0 },
      { pieceID: 'tr10', at: table.center, altitude: 1, uid: 'tree' },
    ])
    expect(statusOf(board, 'tree')).toBeNull()
  })
})

/**
 * BURIED STATUS (utils/buriedStatus.ts)
 *
 * What the selected-piece readout and the pieces list report for a land piece:
 *  - buried: every hex of its surface has land directly on top
 *  - partially buried: at least one does
 *  - subterrain buried: every side of it is covered by neighbouring land over
 *    its full height (a fluid piece's sides by any land, a solid piece's sides
 *    only by solid land)
 *
 * Heights include fluid-on-fluid half levels: water on water tops out at X.5,
 * and solid land on that rises the other half, back to a whole level.
 */
import { describe, expect, it } from 'vitest'
import type { CubeCoordinate } from '../types'
import { makeBuriedStatusChecker } from '../utils/buriedStatus'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { type Board, makeTable, place } from './helpers/board'

type Placement = {
  pieceID: string
  at: CubeCoordinate
  altitude: number
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

  it('stacked water is NOT covered by neighbours that stop below its top', () => {
    // neighbours only reach 1; the stacked water's side runs 1 to 1.5
    const board = build(table, [
      { pieceID: 'w1', at: c, altitude: 0 },
      { pieceID: 'w1', at: c, altitude: 1, uid: 'stacked' },
      ...ring(c).map((at) => ({ pieceID: 'g1', at, altitude: 0 })),
    ])
    expect(statusOf(board, 'stacked')).toMatchObject({
      isSubterrainBuried: false,
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

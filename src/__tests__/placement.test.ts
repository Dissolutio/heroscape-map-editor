/**
 * PLACEMENT (data/placement.ts)
 *
 * resolvePlacement is where a click (and later a hover or a drop) puts a
 * piece; evaluatePlacement says whether it goes in cleanly ('ok'), goes in
 * displacing or breaking a rule ('conflict'), or does nothing ('blocked').
 * The resolver must match the click handler exactly: it runs the same cases
 * as click-placement.test.ts (helpers/placementCases.ts).
 */
import { describe, expect, it } from 'vitest'
import { addPiece } from '../data/addPiece'
import { piecesSoFar } from '../data/pieces'
import {
  type PlacementResolution,
  evaluatePlacement,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from '../data/placement'
import { getSmartPlacementAltitude } from '../data/smartPlacement'
import type { BoardHex, CubeCoordinate } from '../types'
import { HexTerrain } from '../types'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './helpers/board'
import { placementCases } from './helpers/placementCases'

const table = withGrassFloor(makeTable(9))
const c = table.center
const east = { q: 3, r: 4, s: -7 }

function add(
  board: Board,
  pieceID: string,
  at: CubeCoordinate,
  altitude: number,
  rotation = 0,
  uid?: string,
) {
  const result = place({
    board: cloneBoard(board),
    pieceID,
    at,
    altitude,
    rotation,
    uid,
    permissive: true,
  })
  expect(result.error).toBeUndefined()
  return result.board
}

const topHex = (board: Board, at = c, altitude = 1) =>
  hexAt(board, at, altitude) as BoardHex

function resolve(
  board: Board,
  pieceID: string,
  hex: BoardHex,
  rotation = 0,
  ignoreUID?: string,
) {
  return resolvePlacement(piecesSoFar[pieceID], hex, rotation, board, {
    ignoreUID,
  })
}

function resolved(resolution: PlacementResolution) {
  if (isPlacementBlocked(resolution)) {
    throw new Error(`unexpectedly blocked: ${resolution.blocked}`)
  }
  return resolution
}

describe('resolvePlacement', () => {
  it.each(placementCases)(
    'matches the click handler: $name',
    ({ pieceID, rotation, setup, expected }) => {
      const { board, hex } = setup()
      const before = cloneBoard(board)
      const resolution = resolve(board, pieceID, hex, rotation)
      expect(board).toEqual(before)
      if ('refused' in expected) {
        expect(resolution).toEqual({ blocked: expected.refused })
        return
      }
      const {
        coords,
        altitude,
        rotation: placedRotation,
      } = resolved(resolution)
      expect(coords).toEqual(expected.placed.coords)
      expect(placedRotation).toBe(expected.placed.rotation)
      if (expected.placed.altitude !== undefined) {
        expect(altitude).toBe(expected.placed.altitude)
      }
    },
  )

  it('names the rule it took, castle walls first', () => {
    const wall = add(table, 'cws', c, 1, 0, 'CW')
    const wallHex = topHex(wall, c, 2)
    expect(resolved(resolve(wall, 'cws', wallHex)).rule).toBe('castleCap')
    expect(resolved(resolve(table, 'bt', topHex(table))).rule).toBe(
      'battlement',
    )
    expect(resolved(resolve(table, 'rw', topHex(table))).rule).toBe('roadWall')
    expect(resolved(resolve(table, 'rl', topHex(table))).rule).toBe(
      'ropeLadder',
    )
    expect(resolved(resolve(table, 'g1', topHex(table))).rule).toBe('land')
    expect(resolved(resolve(table, 'tr10', topHex(table))).rule).toBe('default')
  })

  describe('blocked', () => {
    it('a Laur add-on anywhere but a pillar needs a pillar', () => {
      const ladder = add(table, 'ld', c, 1, 0, 'L1')
      for (const hex of [topHex(table), topHex(ladder, c, 2)]) {
        expect(resolve(ladder, 'lwl', hex)).toEqual({
          blocked: 'needsLaurPillar',
        })
      }
    })

    it.each(['g1', 'r7', 'sw24'])(
      'solid %s cannot sit on a whole-level fluid cap',
      (pieceID) => {
        const water = add(table, 'w1', c, 1)
        expect(resolve(water, pieceID, topHex(water, c, 2))).toEqual({
          blocked: 'landTileNotOnHex',
        })
      },
    )

    it('solid land may sit on a half-level fluid cap (altitude not pinned)', () => {
      const halfLevelWater = {
        ...topHex(table),
        terrain: HexTerrain.water,
        altitude: 1.5,
      }
      expect(isPlacementBlocked(resolve(table, 'g1', halfLevelWater))).toBe(
        false,
      )
    })

    it('fluid may go on any fluid cap', () => {
      const water = add(table, 'w1', c, 1)
      expect(
        isPlacementBlocked(resolve(water, 'w1', topHex(water, c, 2))),
      ).toBe(false)
    })
  })
})

describe('placementBlockedMessages', () => {
  it('gives every physical refusal a message; land on whole-level fluid stays silent', () => {
    expect(placementBlockedMessages).toEqual({
      needsLaurPillar: 'Must add to Square/Triangle Pillar.',
      notOnCastleWallTop:
        'Only a castle wall or wall walk fits on a castle wall.',
      castleArchNeedsLand: 'A castle arch has its own bases; place it on land.',
      pillarShapesDiffer: 'Triangle and square pillars do not stack.',
    })
    expect(placementBlockedMessages.landTileNotOnHex).toBeUndefined()
  })
})

describe('evaluatePlacement', () => {
  it('an empty target is ok, and reports the footprint', () => {
    const evaluation = evaluatePlacement(
      table,
      resolve(table, 'g7', topHex(table)),
    )
    expect(evaluation.status).toBe('ok')
    expect(evaluation.displacedUIDs).toEqual([])
    expect(evaluation.footprintHexes).toHaveLength(7)
    expect(evaluation.footprintHexes[0]).toEqual({ ...c, altitude: 1 })
    expect(evaluation.reason).toBeUndefined()
  })

  it('an overlap is a conflict that names the displaced piece', () => {
    const board = add(table, 'tr10', c, 1, 0, 'T1')
    const evaluation = evaluatePlacement(
      board,
      resolve(board, 'tr10', topHex(board)),
    )
    expect(evaluation.status).toBe('conflict')
    expect(evaluation.displacedUIDs).toEqual(['T1'])
    expect(evaluation.reason).toBeTruthy()
  })

  it('a one-hex shift overlaps the piece itself unless it is ignored', () => {
    const board = add(table, 'g7', c, 1, 0, 'G7')
    const shifted = resolve(board, 'g7', topHex(board, east, 1), 0, 'G7')
    expect(resolved(shifted).altitude).toBe(1)
    expect(resolved(shifted).coords).toEqual(east)

    const asIs = evaluatePlacement(board, shifted)
    expect(asIs.status).toBe('conflict')
    expect(asIs.displacedUIDs).toEqual(['G7'])

    const moving = evaluatePlacement(board, shifted, { ignoreUID: 'G7' })
    expect(moving.status).toBe('ok')
    expect(moving.displacedUIDs).toEqual([])
  })

  it('a drop onto a stack uses the smart altitude and is ok', () => {
    let board: Board = makeTable(3)
    board = add(board, 'g1', { q: 0, r: 0, s: 0 }, 0)
    board = add(board, 'r1', { q: 2, r: 0, s: -2 }, 0)
    board = add(board, 'r1', { q: 2, r: 0, s: -2 }, 1, 0, 'R2')
    const pointer = topHex(board, { q: 1, r: 0, s: -1 }, 0)
    const onRock = resolve(board, 'g2', pointer)
    expect(resolved(onRock).altitude).toBe(2)
    expect(evaluatePlacement(board, onRock).status).toBe('ok')

    // smart altitude ignores a piece being moved: without the top rock the
    // g2 settles on the grass level instead
    expect(resolved(resolve(board, 'g2', pointer, 0, 'R2')).altitude).toBe(1)
    expect(
      getSmartPlacementAltitude({
        boardHexes: board.boardHexes,
        piece: piecesSoFar.g2,
        pieceCoords: { q: 1, r: 0, s: -1 },
        altitude: 0,
        rotation: 0,
        ignoreUID: 'R2',
      }),
    ).toBe(1)
  })

  it('reports footprint hexes that are off the board', () => {
    const corner = { q: 0, r: 0, s: 0 }
    const evaluation = evaluatePlacement(
      table,
      resolve(table, 'g24', topHex(table, corner, 1)),
    )
    expect(evaluation.status).not.toBe('blocked') // a click still places it
    expect(evaluation.displacedUIDs).toEqual([])
    const offBoard = evaluation.footprintHexes.filter(
      (hex) => !hexAt(table, hex, 0),
    )
    expect(offBoard.length).toBeGreaterThan(0)
  })

  /**
   * KNOWN GAP: a g24 dropped on the table corner hangs mostly off the board,
   * but evaluatePlacement says 'ok' (green). Strict addPiece counts a land
   * tile as supported when any one hex under it is solid, and hexes off the
   * board as free space. A drag preview would show it green. Suggested fix:
   * evaluatePlacement treats footprint hexes with no table hex under them
   * as not ok (the future 'unsupported' status, or 'conflict'). Assumes the
   * table's altitude-0 hexes are the board.
   */
  it.fails('KNOWN GAP: a tile hanging off the board is not ok', () => {
    const corner = { q: 0, r: 0, s: 0 }
    const evaluation = evaluatePlacement(
      table,
      resolve(table, 'g24', topHex(table, corner, 1)),
    )
    expect(evaluation.status).not.toBe('ok')
  })

  it('a refusal stays blocked, with its reason', () => {
    expect(
      evaluatePlacement(table, resolve(table, 'lws', topHex(table))),
    ).toEqual({
      status: 'blocked',
      displacedUIDs: [],
      footprintHexes: [],
      reason: 'needsLaurPillar',
    })
  })

  it.each(placementCases.filter((c) => 'refused' in c.expected))(
    'a refusal is blocked with its reason: $name',
    ({ pieceID, rotation, setup, expected }) => {
      const { board, hex } = setup()
      const evaluation = evaluatePlacement(
        board,
        resolve(board, pieceID, hex, rotation),
      )
      expect(evaluation).toMatchObject({
        status: 'blocked',
        reason: 'refused' in expected ? expected.refused : undefined,
        displacedUIDs: [],
      })
    },
  )

  it('a second start zone on the same hex is blocked: it would do nothing', () => {
    const board = add(table, 'z1', c, 1)
    const evaluation = evaluatePlacement(
      board,
      resolve(board, 'z1', topHex(board)),
    )
    expect(evaluation.status).toBe('blocked')
  })

  it.each(placementCases)(
    'never changes its input, and refusals are blocked: $name',
    ({ pieceID, rotation, setup, expected }) => {
      const { board, hex } = setup()
      const before = cloneBoard(board)
      const resolution = resolve(board, pieceID, hex, rotation)
      const evaluation = evaluatePlacement(board, resolution)
      evaluatePlacement(board, resolution, { ignoreUID: 'CW' })
      expect(board).toEqual(before)
      expect(evaluation.status === 'blocked').toBe('refused' in expected)
    },
  )

  it.each(placementCases.filter((c) => 'placed' in c.expected))(
    'displaces what painting the whole board would: $name',
    ({ pieceID, rotation, setup }) => {
      const { board, hex } = setup()
      const resolution = resolved(resolve(board, pieceID, hex, rotation))
      const painted = addPiece({
        piece: resolution.piece,
        boardHexes: cloneBoard(board).boardHexes,
        boardPieces: board.boardPieces,
        pieceCoords: resolution.coords,
        placementAltitude: resolution.altitude,
        rotation: resolution.rotation,
        isVsTile: false,
        permissive: true,
      })
      expect(evaluatePlacement(board, resolution).displacedUIDs.sort()).toEqual(
        (painted.displacedUIDs ?? []).sort(),
      )
    },
  )
})

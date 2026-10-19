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
  hangsOffMap,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from '../data/placement'
import getPieceTemplateCoords from '../data/rotationTransforms'
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
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'

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
      offMap: 'That piece would hang off the edge of the map.',
      outOfHeight:
        'Some pieces would end up below the ground or above the highest level.',
    })
    expect(placementBlockedMessages.landTileNotOnHex).toBeUndefined()
    expect(placementBlockedMessages.notAHex).toBeUndefined()
  })
})

describe('evaluatePlacement', () => {
  it('checks height bounds only when the caller opts in', () => {
    const resolution = {
      piece: piecesSoFar.og4,
      coords: c,
      altitude: 90,
      rotation: 0,
      rule: 'default',
    } satisfies Extract<PlacementResolution, { piece: unknown }>

    expect(evaluatePlacement(table, resolution).reason).not.toBe('outOfHeight')
    expect(
      evaluatePlacement(table, resolution, { checkHeightBounds: true }),
    ).toMatchObject({ status: 'blocked', reason: 'outOfHeight' })
  })

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

  it('ignoreUID also accepts a set of moving pieces', () => {
    const board = add(table, 'g7', c, 1, 0, 'G7')
    const shifted = resolve(board, 'g7', topHex(board, east, 1), 0, 'G7')

    expect(
      evaluatePlacement(board, shifted, { ignoreUID: new Set(['G7']) }).status,
    ).toBe('ok')
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

  /**
   * Physical pieces cannot hang off the map: if any hex of the footprint is
   * outside it, the placement is blocked. (Was a KNOWN GAP: strict addPiece
   * counts hexes off the board as free space, so this came back 'ok'.)
   */
  it('a tile hanging off the board is not ok', () => {
    const corner = { q: 0, r: 0, s: 0 }
    const before = cloneBoard(table)
    const resolution = resolve(table, 'g24', topHex(table, corner, 1))
    expect(resolution).toEqual({ blocked: 'offMap' })
    expect(evaluatePlacement(table, resolution)).toMatchObject({
      status: 'blocked',
      reason: 'offMap',
    })
    expect(table).toEqual(before)
  })

  it('a resolved placement built by hand that hangs off is blocked too', () => {
    const corner = { q: 0, r: 0, s: 0 }
    const before = cloneBoard(table)
    const evaluation = evaluatePlacement(table, {
      piece: piecesSoFar.g24,
      coords: corner,
      altitude: 1,
      rotation: 0,
      rule: 'land',
    })
    expect(evaluation.status).toBe('blocked')
    expect(evaluation.reason).toBe('offMap')
    // the footprint is still reported, e.g. for a red preview
    expect(evaluation.footprintHexes).toHaveLength(24)
    expect(evaluation.footprintHexes.some((hex) => !hexAt(table, hex, 0))).toBe(
      true,
    )
    expect(table).toEqual(before)
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

/**
 * The map edge, checked against each map shape's own definition (from
 * utils/hex-utils.ts), not against the table hexes the code looks up.
 */
describe('map edge', () => {
  const rectangle = (rows: number, cols: number) => ({
    board: makeRectangleScenario({ length: rows, width: cols }),
    isOnMap: ({ q, r }: CubeCoordinate) =>
      r >= 0 &&
      r < rows &&
      q >= -Math.floor(r / 2) &&
      q < cols - Math.floor(r / 2),
  })
  const hexagon = (size: number) => {
    const radius = size - 1
    const offsetQ = radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5)
    return {
      board: makeHexagonScenario({ size }),
      isOnMap: ({ q, r }: CubeCoordinate) => {
        const dq = q - offsetQ
        const dr = r - radius
        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) <= radius
      },
    }
  }
  const maps = {
    'rectangle 9x9': rectangle(9, 9),
    'rectangle 5x8': rectangle(5, 8),
    'rectangle 8x5': rectangle(8, 5),
    'hexagon size 4': hexagon(4),
    'hexagon size 5': hexagon(5),
  }

  it.each(Object.entries(maps))(
    'the oracle matches the generated %s',
    (_, { board, isOnMap }) => {
      const tableHexes = Object.values(board.boardHexes)
      expect(tableHexes.every(isOnMap)).toBe(true)
      // and nothing just outside it counts as on the map
      const ring = tableHexes.flatMap(({ q, r, s }) =>
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, -1],
          [-1, 1],
        ].map(([dq, dr]) => ({ q: q + dq, r: r + dr, s: s - dq - dr })),
      )
      for (const hex of ring) {
        expect(isOnMap(hex)).toBe(hexAt(board, hex, 0) !== undefined)
      }
    },
  )

  const sweep = (
    { board, isOnMap }: (typeof maps)[keyof typeof maps],
    pieceID: string,
    isBlocked: (origin: BoardHex, rotation: number) => boolean,
  ) => {
    const piece = piecesSoFar[pieceID]
    let blocked = 0
    let placed = 0
    for (const origin of Object.values(board.boardHexes)) {
      for (let rotation = 0; rotation < 6; rotation++) {
        const footprint = getPieceTemplateCoords({
          clickedHex: origin,
          rotation,
          template: piece.template,
          isVsTile: false,
        })
        const hangsOff = !footprint.every(isOnMap)
        expect(isBlocked(origin, rotation)).toBe(hangsOff)
        if (hangsOff) blocked++
        else placed++
      }
    }
    expect(blocked).toBeGreaterThan(0)
    return { placed }
  }

  describe.each(Object.entries(maps))('%s', (name, map) => {
    it.each(['g2', 'g3', 'g7', 'g24', 'ca', 'rs2'])(
      '%s at every hex and rotation hangs off exactly when its footprint does',
      (pieceID) => {
        const before = cloneBoard(map.board)
        const { placed } = sweep(map, pieceID, (origin, rotation) =>
          hangsOffMap(map.board.boardHexes, {
            piece: piecesSoFar[pieceID],
            coords: origin,
            altitude: 0,
            rotation,
            rule: 'land',
          }),
        )
        // some placement fits, so the check is not vacuous; a g24 does not
        // fit at all on the smallest maps
        const fits = pieceID !== 'g24' || name === 'rectangle 9x9'
        if (fits) expect(placed).toBeGreaterThan(0)
        expect(map.board).toEqual(before)
      },
    )
  })

  it.each(['rectangle 5x8', 'hexagon size 4'] as const)(
    'resolvePlacement blocks a g2 at every hex and rotation of the %s exactly when it hangs off',
    (name) => {
      const map = maps[name]
      const { placed } = sweep(map, 'g2', (origin, rotation) => {
        const resolution = resolvePlacement(
          piecesSoFar.g2,
          origin,
          rotation,
          map.board,
        )
        return isPlacementBlocked(resolution) && resolution.blocked === 'offMap'
      })
      expect(placed).toBeGreaterThan(0)
    },
  )

  it('a piece fully on the map right next to the edge is ok', () => {
    const { board, isOnMap } = maps['rectangle 9x9']
    const footprintOf = (hex: CubeCoordinate) =>
      getPieceTemplateCoords({
        clickedHex: hex,
        rotation: 0,
        template: piecesSoFar.g7.template,
        isVsTile: false,
      })
    const neighbours = ({ q, r, s }: CubeCoordinate) =>
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, -1],
        [-1, 1],
      ].map(([dq, dr]) => ({ q: q + dq, r: r + dr, s: s - dq - dr }))
    // a g7 on the map whose footprint has neighbours off the map
    const touchingEdge = Object.values(board.boardHexes).filter((hex) => {
      const footprint = footprintOf(hex)
      return (
        footprint.every(isOnMap) &&
        footprint.some((f) => neighbours(f).some((n) => !isOnMap(n)))
      )
    })
    expect(touchingEdge.length).toBeGreaterThan(0)
    for (const origin of touchingEdge) {
      expect(
        evaluatePlacement(board, resolve(board, 'g7', origin)).status,
      ).toBe('ok')
    }
  })
})

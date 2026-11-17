/**
 * SHIP NOTCH HEXES, SHIP WALL HEIGHT, SHIP BOW REST (John, 2026-11-12)
 *
 * Levels count from the ship's own level as level 1. Both ships interlock with
 * two "notch" hexes: CUBE_NE of the origin and CUBE_EAST of that one (at
 * rotation 0; they rotate with the piece). Land sits in them at level 1,
 * beside the ship. Above that the hull overhangs them: the Ship Bow blocks
 * levels 2-6 (level 7 is the upper deck), the Ship Wall level 2 only.
 *
 * The Ship Wall is 9 tall: land at level 10 passes over its guardrail.
 *
 * The Ship Bow keeps its full level on fluid; only its 3D model drops half a
 * level when it rests on a single fluid tile (getShipBowRestOffset).
 */
import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { evaluatePlacement, resolvePlacement } from '../data/placement'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import getPieceTemplateCoords from '../data/rotationTransforms'
import {
  getShipDeckHexes,
  getShipDeckPointerHex,
  SHIP_DECK_LEVEL,
} from '../data/shipDeck'
import {
  SHIP_BOW_FLUID_REST_DROP,
  getShipBowRestOffset,
} from '../data/shipBowRest'
import {
  evaluateShipWallSupport,
  getUnsupportedShipWallUIDs,
  SHIP_WALL_INTERFACE_OFFSETS,
} from '../data/shipWallSupport'
import { isHexBaseLevelOpen } from '../data/vertical-obstruction-templates'
import type { BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { CUBE_EAST, CUBE_NE, HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { hexUtilsAdd, hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import { type Board, hexAt, makeTable, place } from './helpers/board'

const table = makeTable()
const center = table.center
const SHIP_ALTITUDE = 1 // placed on the grass floor; level 1 is hex altitude 2

const offsetAt = (offset: CubeCoordinate, rotation: number) => {
  const { q, r, s } = hexUtilsAdd(
    center,
    hexUtilsRotateAroundOrigin_000(offset, rotation),
  )
  return { q: q + 0, r: r + 0, s: s + 0 }
}
const NOTCH_OFFSETS = [CUBE_NE, hexUtilsAdd(CUBE_NE, CUBE_EAST)]
const notchHexes = (rotation: number) =>
  NOTCH_OFFSETS.map((offset) => offsetAt(offset, rotation))

const bp = (
  uid: string,
  inventoryID: string,
  pieceCoords: CubeCoordinate,
  altitude: number,
  rotation = 0,
): BoardPiece => ({ uid, inventoryID, pieceCoords, altitude, rotation })

const floor: BoardPiece[] = Object.values(table.boardHexes).map((hex) =>
  bp(`floor-${hex.q}-${hex.r}`, 'g1', hex, 0),
)

/** Land in `hex` at ship level `level` (its hex is level `level` of the ship). */
const landAtLevel = (uid: string, hex: CubeCoordinate, level: number) =>
  bp(uid, 'g1', hex, SHIP_ALTITUDE + level - 1)

const conflictsOf = (pieces: BoardPiece[]) =>
  rebuildBoardStateFromPieces(pieces, table.boardHexes).conflictedPieceUIDs

const templateCoords = (pieceID: string, rotation: number) =>
  getPieceTemplateCoords({
    clickedHex: center,
    rotation,
    template: piecesSoFar[pieceID].template,
    isVsTile: false,
  })

const ships = [
  { id: Pieces.shipBow, title: 'Ship Bow', blocked: [2, 6], fits: 7 },
  { id: Pieces.shipWall, title: 'Ship Wall', blocked: [2, 2], fits: 3 },
] as const

describe.each(ships)('$title notch hexes', ({ id, blocked, fits }) => {
  it('are the last two template hexes, NE of the origin and E of that, with an open base level', () => {
    const coords = templateCoords(id, 0)
    expect(coords.slice(-2)).toEqual(notchHexes(0))
    expect(isHexBaseLevelOpen(id, coords.length - 2)).toBe(true)
    expect(isHexBaseLevelOpen(id, coords.length - 1)).toBe(true)
  })

  describe.each([0, 2])('at rotation %i', (rotation) => {
    const ship = bp('ship', id, center, SHIP_ALTITUDE, rotation)
    const levels = Array.from({ length: fits + 1 }, (_, i) => i + 1)

    it.each(notchHexes(rotation).map((hex, i) => ({ hex, i })))(
      'notch hex $i: land at level 1 fits, the blocked levels conflict, and land fits above them',
      ({ hex }) => {
        for (const level of levels) {
          const conflicts = conflictsOf([
            ...floor,
            ship,
            landAtLevel('land', hex, level),
          ])
          const isBlocked = level >= blocked[0] && level <= blocked[1]
          expect(
            conflicts.sort(),
            `level ${level} ${isBlocked ? 'conflicts' : 'fits'}`,
          ).toEqual(isBlocked ? ['land', 'ship'] : [])
        }
      },
    )

    it('the ship places strictly next to land already at level 1 in both notch hexes', () => {
      let board: Board = rebuildBoardStateFromPieces(
        [
          ...floor,
          ...notchHexes(rotation).map((hex, i) =>
            landAtLevel(`land-${i}`, hex, 1),
          ),
        ],
        table.boardHexes,
      )
      const placed = place({
        board,
        pieceID: id,
        at: center,
        altitude: SHIP_ALTITUDE,
        rotation,
        uid: 'ship',
      })
      expect(placed.error).toBeUndefined()
      expect(placed.displacedUIDs).toEqual([])
      board = placed.board
      // the land keeps its level 1 hex, the ship owns the level above
      for (const hex of notchHexes(rotation)) {
        expect(hexAt(board, hex, SHIP_ALTITUDE + 1)?.boardPieceUID).toMatch(
          /^land-/,
        )
        expect(hexAt(board, hex, SHIP_ALTITUDE + 2)?.boardPieceUID).toBe('ship')
      }
    })
  })
})

describe('Ship Wall height', () => {
  it.each([0, 3])(
    'at rotation %i, land at level 10 over a main hex fits; at level 9 it conflicts',
    (rotation) => {
      const wall = bp('wall', Pieces.shipWall, center, SHIP_ALTITUDE, rotation)
      const mains = templateCoords(Pieces.shipWall, rotation).slice(0, 3)
      for (const hex of mains) {
        expect(
          conflictsOf([...floor, wall, landAtLevel('land', hex, 10)]),
        ).toEqual([])
        expect(
          conflictsOf([...floor, wall, landAtLevel('land', hex, 9)]).sort(),
        ).toEqual(['land', 'wall'])
      }
    },
  )
})

describe('Ship Wall support with the notch hexes', () => {
  const interfaceHexes = (rotation: number) =>
    SHIP_WALL_INTERFACE_OFFSETS.map((offset) => offsetAt(offset, rotation))

  it('the two notch hexes are 2 of the 4 interlock hexes', () => {
    expect(
      notchHexes(0).every((notch) =>
        interfaceHexes(0).some((hex) => hex.q === notch.q && hex.r === notch.r),
      ),
    ).toBe(true)
  })

  it.each([0, 4])(
    'at rotation %i, solid land at level 1 in all 4 interlock hexes still supports the wall, in either order',
    (rotation) => {
      const wall = bp('wall', Pieces.shipWall, center, SHIP_ALTITUDE, rotation)
      const land = interfaceHexes(rotation).map((hex, i) =>
        landAtLevel(`land-${i}`, hex, 1),
      )
      for (const pieces of [
        [...floor, ...land, wall],
        [...floor, wall, ...land],
      ]) {
        const board = rebuildBoardStateFromPieces(pieces, table.boardHexes)
        expect(board.conflictedPieceUIDs).toEqual([])
        expect(evaluateShipWallSupport(wall, board.boardHexes)).toEqual({
          supported: true,
          missingInterfaceHexes: [],
        })
        expect(
          getUnsupportedShipWallUIDs({ ...board, boardPieces: pieces }),
        ).toEqual([])
      }
    },
  )

  it('fluid in a notch hex still does not count', () => {
    const wall = bp('wall', Pieces.shipWall, center, SHIP_ALTITUDE)
    const [fluidNotch] = notchHexes(0)
    const land = interfaceHexes(0).map((hex, i) =>
      bp(
        `land-${i}`,
        hex.q === fluidNotch.q && hex.r === fluidNotch.r ? 'w1' : 'g1',
        hex,
        SHIP_ALTITUDE,
      ),
    )
    const board = rebuildBoardStateFromPieces(
      [...floor, ...land, wall],
      table.boardHexes,
    )
    expect(evaluateShipWallSupport(wall, board.boardHexes).supported).toBe(
      false,
    )
  })
})

describe('getShipBowRestOffset', () => {
  const bowCoords = templateCoords(Pieces.shipBow, 0)
  const restingHexes = bowCoords.filter(
    (_, i) => !isHexBaseLevelOpen(Pieces.shipBow, i),
  )
  const restOf = (pieces: BoardPiece[], bowAltitude: number) => {
    const bow = bp('bow', Pieces.shipBow, center, bowAltitude)
    const board = rebuildBoardStateFromPieces(
      [...pieces, bow],
      table.boardHexes,
    )
    return { offset: getShipBowRestOffset(bow, board.boardHexes), board }
  }
  const under = (terrain: string, hexes = restingHexes, altitude = 0) =>
    hexes.map((hex, i) =>
      bp(`${terrain}-${altitude}-${i}`, terrain, hex, altitude),
    )

  it('rests on 6 hexes (5 main and the knub): not the figurehead and not the notch hexes', () => {
    expect(restingHexes).toHaveLength(6)
  })

  it('drops half a level on one fluid tile', () => {
    expect(SHIP_BOW_FLUID_REST_DROP).toBeCloseTo(HEXGRID_HEX_HEIGHT / 2)
    expect(restOf(under('w1'), 1).offset).toBeCloseTo(-SHIP_BOW_FLUID_REST_DROP)
    // any rotation: the resting hexes rotate with the bow
    const bow = bp('bow', Pieces.shipBow, center, 1, 3)
    const rotatedResting = templateCoords(Pieces.shipBow, 3).filter(
      (_, i) => !isHexBaseLevelOpen(Pieces.shipBow, i),
    )
    const board = rebuildBoardStateFromPieces(
      [...under('w1', rotatedResting), bow],
      table.boardHexes,
    )
    expect(getShipBowRestOffset(bow, board.boardHexes)).toBeCloseTo(
      -SHIP_BOW_FLUID_REST_DROP,
    )
  })

  it('drops even when only the figurehead or notch hexes have solid under them', () => {
    const others = bowCoords.filter((_, i) =>
      isHexBaseLevelOpen(Pieces.shipBow, i),
    )
    expect(
      restOf([...under('w1'), ...under('g1', others)], 1).offset,
    ).toBeCloseTo(-SHIP_BOW_FLUID_REST_DROP)
  })

  it('does not drop on two stacked fluid tiles', () => {
    expect(
      restOf([...under('w1'), ...under('w1', restingHexes, 1)], 1.5).offset,
    ).toBe(0)
  })

  it('does not drop on solid, on the table, or on mixed solid and fluid', () => {
    expect(restOf(floor, 1).offset).toBe(0)
    expect(restOf([], 0).offset).toBe(0)
    const [first, ...rest] = restingHexes
    expect(
      restOf([...under('g1', [first]), ...under('w1', rest)], 1).offset,
    ).toBe(0)
  })

  it('does not drop with nothing under it, and never moves a Ship Wall', () => {
    expect(restOf([], 3).offset).toBe(0)
    const wall = bp('wall', Pieces.shipWall, center, 1)
    const board = rebuildBoardStateFromPieces(
      [...under('w1'), wall],
      table.boardHexes,
    )
    expect(getShipBowRestOffset(wall, board.boardHexes)).toBe(0)
  })

  it('on one water tile the bow keeps its saved altitude and its level 2 hexes', () => {
    const { board, offset } = restOf(under('w1'), 1)
    expect(offset).not.toBe(0)
    const saved = board.boardPieces.find((piece) => piece.uid === 'bow')
    expect(saved?.altitude).toBe(1)
    // the level shown for a selected piece is its altitude + 1
    const origin = Object.values(board.boardHexes).find(
      (hex) => hex.boardPieceUID === 'bow' && hex.isObstacleOrigin,
    )
    expect(origin?.altitude).toBe(2)
    expect(board.conflictedPieceUIDs).toEqual([])
  })
})

describe.each(ships)(
  'building on the $title deck (the notch hexes at level 7)',
  ({ id }) => {
    const sections = ['forward', 'aft'] as const
    const deckBoard = (rotation: number) => {
      const ship = bp('ship', id, center, SHIP_ALTITUDE, rotation)
      return {
        ship,
        board: rebuildBoardStateFromPieces([...floor, ship], table.boardHexes),
      }
    }
    // the placement altitude of land on the deck: its hex is at level 7
    const DECK_ALTITUDE = SHIP_ALTITUDE + SHIP_DECK_LEVEL - 1

    it.each([0, 1, 2, 3, 4, 5])(
      'at rotation %i, the deck hexes are the notch hexes at the deck altitude',
      (rotation) => {
        const { ship } = deckBoard(rotation)
        const deck = getShipDeckHexes(ship)
        expect([deck.forward, deck.aft]).toEqual(
          notchHexes(rotation).map((hex) => ({
            ...hex,
            altitude: DECK_ALTITUDE,
          })),
        )
      },
    )

    it.each([0, 3])(
      'at rotation %i, a click on either deck section previews ok and places land at level 7',
      (rotation) => {
        const { ship, board } = deckBoard(rotation)
        sections.forEach((section, i) => {
          const pointer = getShipDeckPointerHex(ship, section, board.boardHexes)
          expect({ q: pointer.q, r: pointer.r }).toEqual({
            q: notchHexes(rotation)[i].q,
            r: notchHexes(rotation)[i].r,
          })
          // the ship's own notch clearance (the bow's reaches level 6) is
          // passed over
          expect(pointer.boardPieceUID).toBe('')
          const resolution = resolvePlacement(piecesSoFar.g1, pointer, 0, board)
          expect(resolution).toMatchObject({
            rule: 'land',
            altitude: DECK_ALTITUDE,
          })
          expect(evaluatePlacement(board, resolution).status).toBe('ok')
          const placed = place({
            board,
            pieceID: 'g1',
            at: pointer,
            altitude: DECK_ALTITUDE,
            uid: 'deck',
          })
          expect(placed.error).toBeUndefined()
          expect(placed.displacedUIDs).toEqual([])
          expect(hexAt(placed.board, pointer, DECK_ALTITUDE + 1)).toMatchObject(
            { boardPieceUID: 'deck' },
          )
          expect(
            rebuildBoardStateFromPieces(
              placed.board.boardPieces,
              table.boardHexes,
            ).conflictedPieceUIDs,
          ).toEqual([])
        })
      },
    )

    it('a 3-hex tile with one hex on the deck and two over nothing is supported', () => {
      const { ship, board } = deckBoard(0)
      const shipHexes = templateCoords(id, 0).map(({ q, r }) => `${q},${r}`)
      const aft = getShipDeckHexes(ship).aft
      // a rotation that keeps the tile's other two hexes off the ship
      const rotation = [0, 1, 2, 3, 4, 5].find((rot) =>
        getPieceTemplateCoords({
          clickedHex: aft,
          rotation: rot,
          template: piecesSoFar.g3.template,
          isVsTile: false,
        })
          .slice(1)
          .every(({ q, r }) => !shipHexes.includes(`${q},${r}`)),
      )
      expect(rotation).toBeDefined()
      const placed = place({
        board,
        pieceID: 'g3',
        at: aft,
        altitude: DECK_ALTITUDE,
        rotation,
        uid: 'deck3',
      })
      expect(placed.error).toBeUndefined()
      expect(
        rebuildBoardStateFromPieces(placed.board.boardPieces, table.boardHexes)
          .conflictedPieceUIDs,
      ).toEqual([])
    })

    it('land at level 8 over a notch hex, with nothing under it, is not supported', () => {
      const { ship, board } = deckBoard(0)
      const forward = getShipDeckHexes(ship).forward
      const placed = place({
        board,
        pieceID: 'g1',
        at: forward,
        altitude: DECK_ALTITUDE + 1,
        uid: 'high',
      })
      expect(placed.error?.message).toBe('Land tile is not supported there')
    })

    it('land at the deck altitude outside the notch hexes is not ship-supported', () => {
      const { board } = deckBoard(0)
      const beside = offsetAt({ q: 1, r: -3, s: 2 }, 0)
      expect(hexAt(board, beside, DECK_ALTITUDE)).toBeUndefined()
      const placed = place({
        board,
        pieceID: 'g1',
        at: beside,
        altitude: DECK_ALTITUDE,
        uid: 'beside',
      })
      expect(placed.error?.message).toBe('Land tile is not supported there')
    })

    it("hands over another piece's hex at the deck key as it is", () => {
      const { ship, board } = deckBoard(0)
      const conflicting = rebuildBoardStateFromPieces(
        [...board.boardPieces, landAtLevel('land', notchHexes(0)[0], 6)],
        table.boardHexes,
      )
      const pointer = getShipDeckPointerHex(
        ship,
        'forward',
        conflicting.boardHexes,
      )
      expect(pointer.boardPieceUID).toBe('land')
    })
  },
)

it('the deck stays at the full level when the bow rests on a single fluid tile', () => {
  const water = makeTable()
  const pieces = [
    ...Object.values(water.boardHexes).map((hex) =>
      bp(`water-${hex.q}-${hex.r}`, 'w1', hex, 0),
    ),
    bp('bow', Pieces.shipBow, center, 1),
  ]
  const board = rebuildBoardStateFromPieces(pieces, water.boardHexes)
  const bow = board.boardPieces.find((p) => p.uid === 'bow') as BoardPiece
  expect(getShipBowRestOffset(bow, board.boardHexes)).toBeLessThan(0)
  // level 1 at altitude 2, so the deck (level 7) is land placed at 7
  expect(getShipDeckHexes(bow).forward.altitude).toBe(7)
  const pointer = getShipDeckPointerHex(bow, 'forward', board.boardHexes)
  const placed = place({ board, pieceID: 'g1', at: pointer, altitude: 7 })
  expect(placed.error).toBeUndefined()
})

/**
 * THE PLACEMENT ENGINE: addPiece / removePiece
 *
 * Part 1 is a sweep: EVERY registered piece must be placeable on solid ground
 * at every rotation and removable again leaving the board exactly as it was.
 * It runs per piece, so a new terrain piece with a missing template, a bad
 * footprint, or a cap-restoration bug shows up under its own name.
 *
 * Part 2 pins the rules that are enforced (strict mode), as small stories.
 *
 * Part 3 documents known weaknesses as `it.fails` tests: they describe the
 * behavior we want, they PASS while the defect exists, and they turn red the
 * day it is fixed, which is your cue to change `it.fails` to `it`.
 *
 * Remember the app itself always places with `permissive: true` (see
 * store/map-slice.ts), so strict-mode errors are what the placement preview
 * and these tests see; the store only ever learns about overlaps.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { produce } from 'immer'
import { getPossibleRotationsForPenMode } from '../controls/getPossibleRotationsForPenMode'
import { piecesSoFar } from '../data/pieces'
import {
  type Table,
  cloneBoard,
  hexAt,
  makeTable,
  place,
  remove,
  withGrassFloor,
} from './helpers/board'

// Glyph variants y2..y65 all share one code path with y0/y1; three is plenty.
const isGlyphVariant = (id: string) =>
  /^y\d+$/.test(id) && !['y0', 'y1', 'y2'].includes(id)

const SWEEP_PIECE_IDS = Object.keys(piecesSoFar).filter(
  (id) => !isGlyphVariant(id),
)

describe('every registered piece can be placed on solid ground and removed again', () => {
  let floor: Table
  beforeAll(() => {
    floor = withGrassFloor(makeTable())
  })

  // Each piece at every rotation the UI offers for it (Laur long walls only
  // at half-steps, Laur ruins and triangle pillars at all twelve).
  it.each(SWEEP_PIECE_IDS)('%s', (pieceID) => {
    for (const rotation of getPossibleRotationsForPenMode(pieceID)) {
      const start = cloneBoard(floor)
      const placed = place({
        board: start,
        pieceID,
        at: floor.center,
        altitude: 1,
        rotation,
        uid: 'subject',
      })
      expect(placed.error, `placing at rotation ${rotation}`).toBeUndefined()
      expect(placed.board.boardPieces).toHaveLength(
        floor.boardPieces.length + 1,
      )

      const removed = remove(placed.board, 'subject')
      expect(
        removed.board.boardPieces,
        `removing at rotation ${rotation}`,
      ).toEqual(floor.boardPieces)
      expect(
        removed.board.boardHexes,
        `removing at rotation ${rotation}`,
      ).toEqual(floor.boardHexes)
    }
  })
})

describe('placement rules (strict mode)', () => {
  it('land needs support: grass cannot float above the bare table', () => {
    const table = makeTable()
    const result = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 1,
    })
    expect(result.error?.message).toBe('Land tile is not supported there')
    expect(result.board.boardPieces).toHaveLength(0)
  })

  it('placing land on land moves the visible cap up', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
    })
    expect(hexAt(first.board, table.center, 1)?.isCap).toBe(true)

    const second = place({
      board: first.board,
      pieceID: 'g1',
      at: table.center,
      altitude: 1,
    })
    expect(second.error).toBeUndefined()
    expect(hexAt(second.board, table.center, 1)?.isCap).toBe(false)
    expect(hexAt(second.board, table.center, 2)?.isCap).toBe(true)
  })

  it('placing land over a cap does not mutate the board it was given', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
    })
    const before = structuredClone(first.board.boardHexes)

    const second = place({
      board: first.board,
      pieceID: 'g1',
      at: table.center,
      altitude: 1,
    })

    expect(hexAt(first.board, table.center, 1)?.isCap).toBe(true)
    expect(hexAt(second.board, table.center, 1)?.isCap).toBe(false)
    expect(first.board.boardHexes).toEqual(before)
  })

  it('addPiece works with Immer drafts', () => {
    const table = makeTable()
    const placed = produce(table, (draft) => {
      const result = place({
        board: draft,
        pieceID: 'g1',
        at: table.center,
        altitude: 0,
      })
      draft.boardHexes = result.board.boardHexes
      draft.boardPieces = result.board.boardPieces
    })

    expect(placed.boardPieces).toHaveLength(1)
    expect(table.boardPieces).toHaveLength(0)
    expect(hexAt(placed, table.center, 1)?.isCap).toBe(true)
    expect(hexAt(table, table.center, 1)).toBeUndefined()
  })

  it('two pieces cannot occupy the same hex', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
    })
    const second = place({
      board: first.board,
      pieceID: 'r1',
      at: table.center,
      altitude: 0,
    })
    expect(second.error?.message).toBe('No space free for land tile')
    expect(second.board.boardPieces).toHaveLength(1)
  })

  it('obstacles need SOLID ground: a tree stands on grass but not on water', () => {
    const table = makeTable()
    const onGrass = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
    })
    expect(
      place({
        board: onGrass.board,
        pieceID: 'tr10',
        at: table.center,
        altitude: 1,
      }).error,
    ).toBeUndefined()

    const onWater = place({
      board: makeTable(),
      pieceID: 'w1',
      at: table.center,
      altitude: 0,
    })
    expect(onWater.error).toBeUndefined()
    expect(
      place({
        board: onWater.board,
        pieceID: 'tr10',
        at: table.center,
        altitude: 1,
      }).error?.message,
    ).toBe('Obstacle is not supported there')
  })

  it('ruins need solid ground under their central hexes, so not the bare table', () => {
    const table = makeTable()
    const result = place({
      board: table,
      pieceID: 'rs2',
      at: table.center,
      altitude: 0,
    })
    expect(result.error?.message).toBe(
      'Ruins need solid ground under their three central hexes',
    )
  })

  it('glyphs cannot sit directly on the table, but can sit on land', () => {
    const table = makeTable()
    expect(
      place({ board: table, pieceID: 'y0', at: table.center, altitude: 0 })
        .error?.message,
    ).toBe('Obstacle is not supported there')

    const land = place({
      board: makeTable(),
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
    })
    expect(
      place({ board: land.board, pieceID: 'y0', at: table.center, altitude: 1 })
        .error,
    ).toBeUndefined()
  })

  it('start zones are overlays: they are recorded as pieces but write no hexes, and duplicates are ignored', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'z1',
      at: table.center,
      altitude: 0,
      uid: 'zone',
    })
    expect(first.error).toBeUndefined()
    expect(first.board.boardPieces).toHaveLength(1)
    expect(first.board.boardHexes).toEqual(table.boardHexes)

    // same spot again: silently a no-op (not an error, not a second piece)
    const again = place({
      board: first.board,
      pieceID: 'z2',
      at: table.center,
      altitude: 0,
      uid: 'zone-2',
    })
    expect(again.error).toBeUndefined()
    expect(again.board.boardPieces).toHaveLength(1)
  })

  it('rotation turns a multi-hex footprint around its origin', () => {
    const table = makeTable()
    const footprint = (rotation: number) => {
      const placed = place({
        board: table,
        pieceID: 'g3',
        at: table.center,
        altitude: 0,
        rotation,
      })
      return Object.values(placed.board.boardHexes)
        .filter((h) => h.altitude === 1)
        .map((h) => `${h.q},${h.r}`)
        .sort()
    }
    const sizes = [0, 1, 2, 3, 4, 5].map(
      (rotation) => footprint(rotation).length,
    )
    expect(sizes).toEqual([3, 3, 3, 3, 3, 3])
    // six distinct orientations of the 3-hex triangle
    expect(
      new Set([0, 1, 2, 3, 4, 5].map((r) => footprint(r).join('|'))).size,
    ).toBe(6)
  })
})

describe('fluid-on-fluid stacking (half levels)', () => {
  // A fluid tile on another fluid rises half a level (to an X.5 surface), and
  // solid land placed on that half-level fluid rises the other half, back to a
  // whole level. Solid on a whole-level fluid keeps the full-level rise, so
  // maps saved before half levels existed load unchanged.
  it('water on water tops out half a level higher, at 1.5', () => {
    const table = makeTable()
    const lower = place({
      board: table,
      pieceID: 'w1',
      at: table.center,
      altitude: 0,
      uid: 'lower',
    })
    const upper = place({
      board: lower.board,
      pieceID: 'w1',
      at: table.center,
      altitude: 1,
      uid: 'upper',
    })
    expect(upper.error).toBeUndefined()
    expect(hexAt(upper.board, table.center, 1.5)).toMatchObject({
      boardPieceUID: 'upper',
      isCap: true,
    })
  })

  it('grass on a half-level water stack rises half a level, to the whole level 2', () => {
    const table = makeTable()
    const lower = place({
      board: table,
      pieceID: 'w1',
      at: table.center,
      altitude: 0,
    })
    const upper = place({
      board: lower.board,
      pieceID: 'w1',
      at: table.center,
      altitude: 1,
    })
    const grass = place({
      board: upper.board,
      pieceID: 'g1',
      at: table.center,
      altitude: 1.5,
      uid: 'grass',
    })
    expect(grass.error).toBeUndefined()
    expect(hexAt(grass.board, table.center, 2)).toMatchObject({
      boardPieceUID: 'grass',
      terrain: 'grass',
      isCap: true,
    })
    expect(hexAt(grass.board, table.center, 2.5)).toBeUndefined()
    expect(hexAt(grass.board, table.center, 1.5)?.isCap).toBe(false)
  })

  it('grass on a whole-level water tile (permissive, as old maps load) still rises a full level', () => {
    const table = makeTable()
    const water = place({
      board: table,
      pieceID: 'w1',
      at: table.center,
      altitude: 0,
    })
    const grass = place({
      board: water.board,
      pieceID: 'g1',
      at: table.center,
      altitude: 1,
      uid: 'grass',
      permissive: true,
    })
    expect(hexAt(grass.board, table.center, 2)).toMatchObject({
      boardPieceUID: 'grass',
    })
  })
})

describe('overlaps (how the real app places: permissive)', () => {
  it('a hex has exactly one owner: the later piece takes it and the earlier one is reported as displaced', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
      uid: 'first',
    })
    const second = place({
      board: first.board,
      pieceID: 'r1',
      at: table.center,
      altitude: 0,
      uid: 'second',
      permissive: true,
    })
    expect(second.error).toBeUndefined()
    expect(second.displacedUIDs).toEqual(['first'])
    expect(hexAt(second.board, table.center, 1)?.boardPieceUID).toBe('second')
    // both pieces are still recorded; only the hex ownership was overwritten
    expect(second.board.boardPieces.map((p) => p.uid)).toEqual([
      'first',
      'second',
    ])
  })

  it('no overlap, nothing displaced', () => {
    const table = makeTable()
    const first = place({
      board: table,
      pieceID: 'g1',
      at: table.center,
      altitude: 0,
      uid: 'a',
    })
    const next = {
      ...table.center,
      q: table.center.q + 1,
      s: table.center.s - 1,
    }
    const second = place({
      board: first.board,
      pieceID: 'g1',
      at: next,
      altitude: 0,
      uid: 'b',
      permissive: true,
    })
    expect(second.displacedUIDs).toEqual([])
  })
})

describe('Laur wall add-ons have no grid expansion', () => {
  // They render straight from boardPieces (addPiece's laurWallAddon branch
  // only records the BoardPiece), so placing one must not write boardHexes.
  // lwl2/lwr2/lwr3 used to throw here: they had no tile template.
  it.each([
    ['lwl2', 2.5],
    ['lwr2', 1],
    ['lwr2', 4.5],
    ['lwr3', 3],
    ['lwr3', 0.5],
  ])('%s at rotation %s', (pieceID, rotation) => {
    const floor = withGrassFloor(makeTable())
    const placed = place({
      board: floor,
      pieceID: pieceID as string,
      at: floor.center,
      altitude: 9,
      rotation: rotation as number,
      uid: 'addon',
    })
    expect(placed.error).toBeUndefined()
    expect(
      placed.board.boardPieces[placed.board.boardPieces.length - 1],
    ).toEqual({
      uid: 'addon',
      inventoryID: pieceID,
      altitude: 9,
      rotation,
      pieceCoords: floor.center,
    })
    expect(placed.board.boardHexes).toEqual(floor.boardHexes)
  })
})

describe('removePiece never throws', () => {
  it('a piece whose inventoryID this app version does not know: returns an error', () => {
    // Unknown pieces are dropped on load, so the store should never hold one;
    // this is the backstop. It used to do `piecesSoFar[inventoryID].id` with
    // no guard and throw a TypeError.
    const table = makeTable()
    const board = {
      boardHexes: table.boardHexes,
      boardPieces: [
        {
          uid: 'mystery',
          inventoryID: 'zz-from-the-future',
          altitude: 0,
          rotation: 0,
          pieceCoords: table.center,
        },
      ],
    }
    const result = remove(board, 'mystery')
    expect(result.error?.message).toMatch(/zz-from-the-future/)
    expect(result.board).toEqual(board)
  })

  it('a uid that is not on the board: returns an error', () => {
    const table = makeTable()
    const result = remove(table, 'no-such-uid')
    expect(result.error?.message).toMatch(/no-such-uid/)
    expect(result.board.boardPieces).toBe(table.boardPieces)
    expect(result.board.boardHexes).toBe(table.boardHexes)
  })
})

describe('KNOWN GAPS in the engine', () => {
  it.fails(
    'KNOWN GAP: strict addPiece rejects lwl2 at an integer rotation',
    () => {
      // The long Laur wall spans pillar to pillar over a hex VERTEX, so only
      // half-step rotations (0.5 ... 5.5) are physical. The UI only offers
      // those (getPossibleRotationsForPenMode), but the engine does not
      // enforce it: the laurWallAddon branch records any rotation. A file,
      // link or future caller can create an impossible wall.
      // Fix with the edges-and-nodes work (see data/laurAddonFootprints.ts,
      // which already returns null for this case).
      const floor = withGrassFloor(makeTable())
      const pillar = place({
        board: floor,
        pieceID: 'lwp',
        at: floor.center,
        altitude: 1,
        uid: 'pillar',
      })
      expect(pillar.error).toBeUndefined()
      const wall = place({
        board: pillar.board,
        pieceID: 'lwl2',
        at: floor.center,
        altitude: 10,
        rotation: 1,
      })
      expect(wall.error).toBeDefined()
    },
  )

  it.fails(
    'KNOWN GAP: strict addPiece rejects a Laur wall add-on with no pillar under it',
    () => {
      // Add-ons hang off a Laur square or triangle pillar at their anchor hex,
      // but strict placement never checks for one: lwl2 placed on bare grass
      // is accepted. The pillar-support rule belongs to the edges-and-nodes
      // work, so this is documented, not fixed.
      const floor = withGrassFloor(makeTable())
      const wall = place({
        board: floor,
        pieceID: 'lwl2',
        at: floor.center,
        altitude: 1,
        rotation: 0.5,
      })
      expect(wall.error).toBeDefined()
    },
  )

  it('addPiece does not mutate the board it was given', () => {
    // Compare the complete map, including fields such as `isCap` on existing
    // hexes.
    const table = makeTable()
    const before = structuredClone(table.boardHexes)
    place({ board: table, pieceID: 'g1', at: table.center, altitude: 0 })
    expect(table.boardHexes).toEqual(before)
  })

  for (const pieceID of ['bt', 'rw', 'lws']) {
    it.fails(
      `a second identical ${pieceID} on the same hex and rotation is rejected`,
      () => {
        // Edge add-ons that render from boardPieces (battlements, road walls,
        // Laur wall addons, rope ladders) write no hexes, so nothing can collide
        // with them, and their support check is a hard-coded `true`
        // ("isBattlementPieceSupported_true ... TODO: validate pieces"). Start
        // zones got explicit duplicate protection; these did not. Ladders are
        // fine because they do write hexes.
        //
        // ASSUMPTION to confirm: an exact duplicate (same hex, altitude, rotation)
        // is never intended. This is also the thin end of the edge/node problem:
        // the same physical edge can be named from either neighboring hex (see
        // edges-and-nodes.test.ts), which this check would not catch either.
        const floor = withGrassFloor(makeTable())
        const first = place({
          board: floor,
          pieceID,
          at: floor.center,
          altitude: 1,
          uid: 'one',
        })
        expect(first.error).toBeUndefined()
        const second = place({
          board: first.board,
          pieceID,
          at: floor.center,
          altitude: 1,
          uid: 'two',
        })
        expect(second.error).toBeDefined()
      },
    )
  }
})

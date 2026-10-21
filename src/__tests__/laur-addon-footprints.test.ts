/**
 * LAUR WALL ADD-ON FOOTPRINTS (data/laurAddonFootprints.ts)
 *
 * Which land hexes lwl2 / lwr2 / lwr3 block, as a pure function. Not used by
 * the app yet: it is input for the edges-and-nodes conflict work.
 *
 * Geometry (pointy-top grid, rotation r points at HEX_DIRECTIONS[r], and a
 * half-step d+0.5 points at the vertex between neighbours d and d+1):
 *  - integer rotation d: the wall crosses the side into neighbour d
 *  - half-step d+0.5: the wall runs along the side shared by neighbours d and
 *    d+1, so it blocks both (never the anchor hex, which holds the pillar)
 */
import { describe, expect, it } from 'vitest'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { piecesSoFar } from '../data/pieces'
import { Pieces } from '../types'

const anchor = { q: 5, r: 5, s: -10 }
const E = { q: 6, r: 5, s: -11 }
const SE = { q: 5, r: 6, s: -11 }
const SW = { q: 4, r: 6, s: -10 }
const W = { q: 4, r: 5, s: -9 }
const NW = { q: 5, r: 4, s: -9 }
const NE = { q: 6, r: 4, s: -10 }

const footprint = (inventoryID: string, rotation: number) =>
  getLaurAddonFootprint({ inventoryID, anchor, altitude: 9, rotation })

const INTEGER_ROTATIONS = [0, 1, 2, 3, 4, 5]
const HALF_STEP_ROTATIONS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
const RUINS = [Pieces.laurWallRuin2, Pieces.laurWallRuin3]
const ALL = [Pieces.laurWallLongStackable, ...RUINS]

describe('getLaurAddonFootprint', () => {
  it.each([
    [Pieces.laurWallLongStackable, 0.5, [E, SE]],
    [Pieces.laurWallLongStackable, 3.5, [W, NW]],
    [Pieces.laurWallLongStackable, 5.5, [NE, E]],
    [Pieces.laurWallRuin2, 0, [E]],
    [Pieces.laurWallRuin2, 2, [SW]],
    [Pieces.laurWallRuin2, 1.5, [SE, SW]],
    [Pieces.laurWallRuin3, 3, [W]],
    [Pieces.laurWallRuin3, 4, [NW]],
    [Pieces.laurWallRuin3, 4.5, [NW, NE]],
  ])(
    '%s at rotation %s blocks exactly the expected hexes',
    (id, rotation, expected) => {
      expect(footprint(id, rotation)?.blockedHexes).toEqual(expected)
    },
  )

  it.each(RUINS)('%s blocks exactly 1 hex at every integer rotation', (id) => {
    for (const rotation of INTEGER_ROTATIONS) {
      expect(footprint(id, rotation)?.blockedHexes).toHaveLength(1)
    }
  })

  it.each(ALL)(
    '%s blocks exactly 2 hexes at every half-step rotation',
    (id) => {
      for (const rotation of HALF_STEP_ROTATIONS) {
        expect(footprint(id, rotation)?.blockedHexes).toHaveLength(2)
      }
    },
  )

  it('a ruin at a half-step blocks the same pair the long wall crosses', () => {
    for (const rotation of HALF_STEP_ROTATIONS) {
      const longWall = footprint(Pieces.laurWallLongStackable, rotation)
      for (const id of RUINS) {
        expect(footprint(id, rotation)?.blockedHexes).toEqual(
          longWall?.blockedHexes,
        )
      }
    }
  })

  it('lwl2 is invalid (null) at integer rotations, and does not throw', () => {
    for (const rotation of INTEGER_ROTATIONS) {
      expect(footprint(Pieces.laurWallLongStackable, rotation)).toBeNull()
    }
  })

  it('the six half-step rotations of lwl2 give six different pairs', () => {
    const pairs = HALF_STEP_ROTATIONS.map((rotation) =>
      JSON.stringify(
        footprint(Pieces.laurWallLongStackable, rotation)?.blockedHexes,
      ),
    )
    expect(new Set(pairs).size).toBe(6)
  })

  it('never blocks the anchor hex (that is where the pillar stands)', () => {
    for (const id of ALL) {
      for (const rotation of [...INTEGER_ROTATIONS, ...HALF_STEP_ROTATIONS]) {
        const hexes = footprint(id, rotation)?.blockedHexes ?? []
        expect(hexes).not.toContainEqual(anchor)
      }
    }
  })

  it('keeps the footprint height at 10 despite 12-level registered metadata', () => {
    for (const id of ALL) {
      expect(footprint(id, 0.5)).toMatchObject({
        heightInLevels: 10,
        altitude: 9,
      })
      expect(piecesSoFar[id]?.height).toBe(12)
    }
  })

  it('returns null, without throwing, for other pieces and invalid rotations', () => {
    expect(footprint(Pieces.laurWallLong, 0.5)).toBeNull()
    expect(footprint('g1', 0)).toBeNull()
    expect(footprint(Pieces.laurWallRuin2, 0.25)).toBeNull()
    expect(footprint(Pieces.laurWallRuin2, Number.NaN)).toBeNull()
  })

  it('rotations wrap around: 6.5 is the same as 0.5', () => {
    expect(footprint(Pieces.laurWallRuin2, 6.5)).toEqual(
      footprint(Pieces.laurWallRuin2, 0.5),
    )
  })
})

describe('pending physical Laur add-on rules', () => {
  it.todo(
    'the support table lists verified add-on rotations for every square and triangle pillar rotation',
  )
  it.todo(
    'the half-step blocked pair for lwl2 matches the measured 3D model footprint at every rotation',
  )
  it.todo(
    'every Laur add-on type and allowed rotation has a verified horizontal and vertical footprint',
  )
  it.todo(
    'unsupported pen placement and dragging use the owner-approved altitude when the pointer is not on a pillar',
  )
})

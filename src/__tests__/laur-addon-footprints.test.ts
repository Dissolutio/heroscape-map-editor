import { describe, expect, it } from 'vitest'
import { getLaurAddonFootprint } from '../data/laurAddonFootprints'
import { piecesSoFar } from '../data/pieces'
import { Pieces } from '../types'
import type { CubeCoordinate } from '../types'

const anchor = { q: 5, r: 5, s: -10 }
const east = { q: 6, r: 5, s: -11 }
const southeast = { q: 5, r: 6, s: -11 }
const northwest = { q: 5, r: 4, s: -9 }
const northeast = { q: 6, r: 4, s: -10 }
const farEastSoutheast = { q: 6, r: 6, s: -12 }
const farNorthwestNortheast = { q: 6, r: 3, s: -9 }
const farNortheastEast = { q: 7, r: 4, s: -11 }

const footprint = (inventoryID: string, rotation: number) =>
  getLaurAddonFootprint({ inventoryID, anchor, altitude: 9, rotation })

const shortWalls = [Pieces.laurWallShort, Pieces.laurWallShortStackable]
const longWalls = [
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
]
const ruins = [Pieces.laurWallRuin1, Pieces.laurWallRuin2, Pieces.laurWallRuin3]
const allAddons = [...shortWalls, ...longWalls, ...ruins]
const integerRotations = [0, 1, 2, 3, 4, 5]
const halfStepRotations = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]

describe('getLaurAddonFootprint', () => {
  it.each([
    [Pieces.laurWallShort, 0, [anchor, east], []],
    [Pieces.laurWallShortStackable, 5, [anchor, northeast], []],
    [Pieces.laurWallLong, 0.5, [anchor, farEastSoutheast], [east, southeast]],
    [
      Pieces.laurWallLongStackable,
      4.5,
      [anchor, farNorthwestNortheast],
      [northwest, northeast],
    ],
    [Pieces.laurWallArch, 5.5, [anchor, farNortheastEast], [northeast, east]],
    [Pieces.laurWallRuin1, 5, [anchor], [northeast]],
    [Pieces.laurWallRuin2, 5.5, [anchor], [northeast, east]],
    [Pieces.laurWallRuin3, 0, [anchor], [east]],
  ])(
    '%s at rotation %s returns its attached and blocked hexes',
    (inventoryID, rotation, endHexes, blockedHexes) => {
      const result = footprint(inventoryID, rotation)
      expect(result).toMatchObject({
        endHexes,
        blockedHexes,
        altitude: 9,
        heightInLevels: piecesSoFar[inventoryID]?.height,
      })
    },
  )

  it('uses the owner-specified 4.5 long-wall geometry', () => {
    expect(footprint(Pieces.laurWallLong, 4.5)).toEqual({
      endHexes: [anchor, farNorthwestNortheast],
      blockedHexes: [northwest, northeast],
      altitude: 9,
      heightInLevels: piecesSoFar[Pieces.laurWallLong]?.height,
    })
  })

  it('uses registered heights for every add-on', () => {
    for (const inventoryID of allAddons) {
      const rotation = longWalls.includes(inventoryID) ? 0.5 : 0
      expect(footprint(inventoryID, rotation)?.heightInLevels).toBe(
        piecesSoFar[inventoryID]?.height,
      )
    }
  })

  it.each(shortWalls)('%s accepts integers only', (inventoryID) => {
    for (const rotation of integerRotations) {
      expect(footprint(inventoryID, rotation)).not.toBeNull()
    }
    for (const rotation of halfStepRotations) {
      expect(footprint(inventoryID, rotation)).toBeNull()
    }
  })

  it.each(longWalls)('%s accepts half-steps only', (inventoryID) => {
    for (const rotation of integerRotations) {
      expect(footprint(inventoryID, rotation)).toBeNull()
    }
    for (const rotation of halfStepRotations) {
      expect(footprint(inventoryID, rotation)).not.toBeNull()
    }
  })

  it.each(ruins)(
    '%s accepts integer and half-step rotations',
    (inventoryID) => {
      for (const rotation of [...integerRotations, ...halfStepRotations]) {
        expect(footprint(inventoryID, rotation)).not.toBeNull()
      }
    },
  )

  it('wraps direction 5 to direction 0 for adjacent and far hexes', () => {
    expect(footprint(Pieces.laurWallShort, 5)?.endHexes).toEqual([
      anchor,
      northeast,
    ])
    expect(footprint(Pieces.laurWallLong, 5.5)).toMatchObject({
      endHexes: [anchor, farNortheastEast],
      blockedHexes: [northeast, east],
    })
    expect(footprint(Pieces.laurWallRuin1, 5)?.blockedHexes).toEqual([
      northeast,
    ])
  })

  it('returns null without throwing for non-finite and wrong-kind rotations', () => {
    for (const rotation of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      for (const inventoryID of allAddons) {
        expect(() => footprint(inventoryID, rotation)).not.toThrow()
        expect(footprint(inventoryID, rotation)).toBeNull()
      }
    }
    expect(footprint(Pieces.laurWallShort, 0.5)).toBeNull()
    expect(footprint(Pieces.laurWallLong, 0)).toBeNull()
    expect(footprint(Pieces.laurWallRuin2, 0.25)).toBeNull()
    expect(footprint('g1', 0)).toBeNull()
  })

  it('normalizes rotation wraps and never mutates the anchor', () => {
    const before: CubeCoordinate = { ...anchor }
    expect(footprint(Pieces.laurWallShort, 6)).toEqual(
      footprint(Pieces.laurWallShort, 0),
    )
    expect(footprint(Pieces.laurWallLong, 6.5)).toEqual(
      footprint(Pieces.laurWallLong, 0.5),
    )
    expect(anchor).toEqual(before)
  })
})

describe('pending Laur add-on verification', () => {
  it.todo(
    'the support table lists verified add-on rotations for every square and triangle pillar rotation',
  )
  it.todo(
    'visually verify model clearances against the owner-specified footprints',
  )
  it.todo(
    'unsupported pen placement and dragging use the owner-approved altitude when the pointer is not on a pillar',
  )
})

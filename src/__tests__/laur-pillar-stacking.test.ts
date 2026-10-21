import { describe, expect, it } from 'vitest'
import {
  getLaurPillarStackAltitude,
  hasSupportingLaurPillar,
  isLaurPillarID,
} from '../data/laurPillarStacking'
import { countPiecesUsedWithLaurStacking } from '../inventory/laurInventoryReconcile'
import type { BoardPiece } from '../types'
import { Pieces } from '../types'

const coords = { q: 0, r: 0, s: 0 }

const pillar = (
  uid: string,
  inventoryID: string,
  altitude: number,
): BoardPiece => ({
  uid,
  inventoryID,
  pieceCoords: coords,
  rotation: 0,
  altitude,
})

describe('Laur pillar stacking', () => {
  it('uses the owner-confirmed eight-level increment', () => {
    expect(getLaurPillarStackAltitude(1)).toBe(9)
  })

  it('recognizes both square pillar IDs in the placement family', () => {
    expect(isLaurPillarID(Pieces.laurWallSquarePillar)).toBe(true)
    expect(isLaurPillarID(Pieces.laurWallPillarStackable)).toBe(true)
    expect(isLaurPillarID(Pieces.laurWallTrianglePillar)).toBe(true)
    expect(isLaurPillarID(Pieces.laurWallShortStackable)).toBe(false)
  })

  it('detects a stackable square pillar eight levels above its support', () => {
    const lower = pillar('lower', Pieces.laurWallPillarStackable, 1)
    const upper = pillar('upper', Pieces.laurWallPillarStackable, 9)
    expect(hasSupportingLaurPillar([lower, upper], upper)).toBe(true)
  })

  it('does not treat a non-matching pillar shape as a stack support', () => {
    const lower = pillar('lower', Pieces.laurWallTrianglePillar, 1)
    const upper = pillar('upper', Pieces.laurWallPillarStackable, 10)
    expect(hasSupportingLaurPillar([lower], upper)).toBe(false)
  })

  it('reconciles inventory counts using the eight-level stack step', () => {
    const stackedPillars = [
      pillar('lower', Pieces.laurWallSquarePillar, 1),
      pillar('upper', Pieces.laurWallSquarePillar, 9),
    ]
    expect(countPiecesUsedWithLaurStacking(stackedPillars)).toEqual({
      [Pieces.laurWallSquarePillar]: 1,
      [Pieces.laurWallPillarStackable]: 1,
    })

    const stackedWalls = [
      pillar('lower', Pieces.laurWallShort, 1),
      pillar('upper', Pieces.laurWallShort, 9),
    ]
    expect(countPiecesUsedWithLaurStacking(stackedWalls)).toEqual({
      [Pieces.laurWallShortStackable]: 2,
    })
  })
})

import { describe, expect, it } from 'vitest'
import {
  formatMapPhysicalSize,
  getMapPhysicalSize,
  type MapPhysicalSizeInput,
} from '../utils/mapPhysicalSize'

const makeMap = (
  shape: MapPhysicalSizeInput['shape'],
  width: number,
  length: number,
  originR = 0,
): MapPhysicalSizeInput => ({
  shape,
  width,
  length,
  originQ: 0,
  originR,
})

describe('getMapPhysicalSize', () => {
  it('uses the flat-to-flat and corner-to-corner extents for one hex', () => {
    const size = getMapPhysicalSize(makeMap('rectangle', 1, 1))

    expect(size.hexCount).toBe(1)
    expect(size.widthIn).toBeCloseTo(1.75)
    expect(size.lengthIn).toBeCloseTo(2 * (1.75 / Math.sqrt(3)))
    expect(size.widthCm).toBeCloseTo(size.widthIn * 2.54)
    expect(size.lengthCm).toBeCloseTo(size.lengthIn * 2.54)
  })

  it('measures a two-hex row along the flat-to-flat axis', () => {
    const size = getMapPhysicalSize(makeMap('rectangle', 2, 1))

    expect(size.widthIn).toBeCloseTo(3.5)
  })

  it('includes the rectangle row stagger in the outer bounding box', () => {
    const size = getMapPhysicalSize(makeMap('rectangle', 24, 18, 1))
    const sideLength = 1.75 / Math.sqrt(3)
    const expectedWidth = 24.5 * 1.75
    const expectedLength = (2 + 17 * 1.5) * sideLength

    expect(size.hexCount).toBe(24 * 18)
    expect(size.widthIn).toBeCloseTo(expectedWidth)
    expect(size.lengthIn).toBeCloseTo(expectedLength)
    expect(size.widthCm).toBeCloseTo(expectedWidth * 2.54)
    expect(size.lengthCm).toBeCloseTo(expectedLength * 2.54)
    expect(size.diagonalIn).toBeCloseTo(
      Math.hypot(expectedWidth, expectedLength),
    )
    expect(size.diagonalCm).toBeCloseTo(size.diagonalIn * 2.54)
    expect(size.label).toBe('Length 18 · Width 24 hexes')
    expect(formatMapPhysicalSize(size)).toBe(
      'Length 18 · Width 24 hexes · 27¾ × 43 in (71 × 109 cm)',
    )
  })

  it('measures a radius-12 hexagon by its true outer extents', () => {
    const size = getMapPhysicalSize(makeMap('hexagon', 13, 13))
    const sideLength = 1.75 / Math.sqrt(3)
    const expectedWidth = 25 * 1.75
    const expectedLength = 38 * sideLength

    expect(size.hexCount).toBe(469)
    expect(size.widthIn).toBeCloseTo(expectedWidth)
    expect(size.lengthIn).toBeCloseTo(expectedLength)
    expect(size.diagonalIn).toBeCloseTo(
      Math.hypot(expectedWidth, expectedLength),
    )
    expect(size.diagonalCm).toBeCloseTo(size.diagonalIn * 2.54)
    expect(size.label).toBe('Hexagon, radius 12')
    expect(formatMapPhysicalSize(size)).toBe(
      'Hexagon, radius 12 · 38½ × 43¾ in (98 × 111 cm)',
    )
  })
})

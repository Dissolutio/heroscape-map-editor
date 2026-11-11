import { describe, expect, it } from 'vitest'
import { pathDataToRings } from '../svg-map/exportSvg'
import { svgHiveBlobD } from '../svg-map/svg-hive'

describe('SVG export path parsing', () => {
  it('parses relative and absolute line commands equivalently', () => {
    expect(pathDataToRings('m 0,0 l 10,0 l 0,10 z')).toEqual(
      pathDataToRings('M 0,0 L 10,0 L 10,10 Z'),
    )
  })

  it('parses relative cubic curves equivalently to absolute curves', () => {
    expect(pathDataToRings('m 1,2 c 3,4 5,6 7,8 z')).toEqual(
      pathDataToRings('M 1,2 C 4,6 6,8 8,10 Z'),
    )
  })

  it('reflects prior cubic and quadratic control points for S/s and T/t', () => {
    expect(pathDataToRings('M 0 0 C 10 0 10 10 20 10 S 30 20 40 10')).toEqual(
      pathDataToRings('M 0 0 C 10 0 10 10 20 10 C 30 10 30 20 40 10'),
    )
    expect(pathDataToRings('m 0 0 c 10 0 10 10 20 10 s 10 10 20 0')).toEqual(
      pathDataToRings('M 0 0 C 10 0 10 10 20 10 C 30 10 30 20 40 10'),
    )
    expect(pathDataToRings('M 0 0 Q 10 10 20 0 T 40 0')).toEqual(
      pathDataToRings('M 0 0 Q 10 10 20 0 Q 30 -10 40 0'),
    )
    expect(pathDataToRings('m 0 0 q 10 10 20 0 t 20 0')).toEqual(
      pathDataToRings('M 0 0 Q 10 10 20 0 Q 30 -10 40 0'),
    )
  })

  it('supports implicit line repeats and horizontal and vertical commands', () => {
    expect(pathDataToRings('M 0 0 10 0 10 10')).toEqual(
      pathDataToRings('M 0 0 L 10 0 L 10 10'),
    )
    expect(pathDataToRings('M 1 2 h 9 v 8 H 1 V 2 z')).toEqual(
      pathDataToRings('M 1 2 L 10 2 L 10 10 L 1 10 L 1 2 Z'),
    )
  })

  it('continues from the subpath start after closing with Z', () => {
    expect(pathDataToRings('M 1 1 L 5 1 Z l 2 0')).toEqual([
      [
        [1, 1],
        [5, 1],
      ],
      [
        [1, 1],
        [3, 1],
      ],
    ])
  })

  it('keeps every relative Marro Hive ring point inside its absolute bounds', () => {
    const [ring] = pathDataToRings(svgHiveBlobD)
    const absoluteHiveControlBounds = {
      minX: 48.785426,
      maxX: 541.26874,
      minY: 54.38165,
      maxY: 297.99014,
    }

    expect(ring).toBeDefined()
    for (const [x, y] of ring ?? []) {
      expect(x).toBeGreaterThanOrEqual(absoluteHiveControlBounds.minX - 1e-6)
      expect(x).toBeLessThanOrEqual(absoluteHiveControlBounds.maxX + 1e-6)
      expect(y).toBeGreaterThanOrEqual(absoluteHiveControlBounds.minY - 1e-6)
      expect(y).toBeLessThanOrEqual(absoluteHiveControlBounds.maxY + 1e-6)
    }
  })
})

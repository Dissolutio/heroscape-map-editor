import { describe, expect, it } from 'vitest'
import {
  buildPalmFrondGeometry,
  buildPalmFrondInstances,
  getPalmFrondRings,
} from './palmFronds'

describe('palm frond generation', () => {
  it('is deterministic for a piece seed and changes with a different seed', () => {
    const first = buildPalmFrondInstances('piece-1', 'laur', 'high')
    expect(buildPalmFrondInstances('piece-1', 'laur', 'high')).toEqual(first)
    expect(buildPalmFrondInstances('piece-2', 'laur', 'high')).not.toEqual(
      first,
    )
  })

  it('uses the expected tier-specific frond counts for both palms', () => {
    for (const style of ['laur', 'ticalla'] as const) {
      expect(getPalmFrondRings(style, 'low')).toEqual([])
      expect(
        getPalmFrondRings(style, 'medium').reduce(
          (total, ring) => total + ring.count,
          0,
        ),
      ).toBe(19)
      expect(
        getPalmFrondRings(style, 'high').reduce(
          (total, ring) => total + ring.count,
          0,
        ),
      ).toBe(22)
    }
  })

  it('builds a segmented frond with the configured triangle count', () => {
    const geometry = buildPalmFrondGeometry({
      segments: 5,
      width: 0.2,
      droop: 0.8,
    })

    expect(geometry.getAttribute('position').count).toBe(12)
    expect(geometry.index?.count).toBe(30)
    expect(geometry.getAttribute('uv').count).toBe(12)
    geometry.dispose()
  })
})

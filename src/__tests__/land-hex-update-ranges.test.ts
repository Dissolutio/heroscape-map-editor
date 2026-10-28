import { describe, expect, it } from 'vitest'
import { InstancedBufferAttribute } from 'three'
import { mergeLandHexHighlightUpdateRanges } from '../world/models/LandHexInstanced'

describe('per-hex highlight update ranges', () => {
  it('coalesces pending writes into one range until a render uploads them', () => {
    const attribute = new InstancedBufferAttribute(new Float32Array(24), 1)

    mergeLandHexHighlightUpdateRanges(attribute, [1, 2])
    mergeLandHexHighlightUpdateRanges(attribute, [10])
    mergeLandHexHighlightUpdateRanges(attribute, [21])

    expect(attribute.updateRanges).toEqual([{ start: 1, count: 21 }])
  })
})

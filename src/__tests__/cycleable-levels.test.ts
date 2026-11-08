import { describe, expect, it } from 'vitest'
import { getCycleableLevels } from '../utils/map-utils'

describe('cycleable viewing levels', () => {
  it('adds the Legend step only when requested', () => {
    expect(getCycleableLevels([], {})).toEqual([0, 1])
    expect(getCycleableLevels([], {}, true)).toEqual([0, 1, 2])
  })
})

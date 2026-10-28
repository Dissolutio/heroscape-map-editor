import { describe, expect, it } from 'vitest'
import { PICK_PEN_MODE, SELECT_PEN_MODE } from '../types'
import { shouldTrackHoveredWorldPoint } from './hoverWorldPoint'

describe('hovered world-point tracking', () => {
  it('only tracks the point when a placement preview can consume it', () => {
    expect(shouldTrackHoveredWorldPoint(SELECT_PEN_MODE)).toBe(false)
    expect(shouldTrackHoveredWorldPoint(PICK_PEN_MODE)).toBe(false)
    expect(shouldTrackHoveredWorldPoint('g')).toBe(true)
  })
})

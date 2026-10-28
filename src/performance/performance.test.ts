import { describe, expect, it } from 'vitest'
import { getMonotonicLeakMetrics, type LeakSample } from './performance'

const sample = (value: number): LeakSample => ({
  sceneObjects: value,
  geometries: value,
  textures: value,
  programs: value,
  jsHeapBytes: value,
  storeSubscribers: value,
  pendingTimers: value,
  pendingAnimationFrames: value,
})

describe('performance leak metrics', () => {
  it('flags metrics that grow monotonically across repeated samples', () => {
    expect(getMonotonicLeakMetrics([sample(1), sample(2), sample(3)])).toEqual([
      'sceneObjects',
      'geometries',
      'textures',
      'programs',
      'jsHeapBytes',
      'storeSubscribers',
      'pendingTimers',
      'pendingAnimationFrames',
    ])
  })

  it('does not flag stable, decreasing, or unavailable metrics', () => {
    const first = sample(3)
    const second = { ...sample(3), sceneObjects: 4, jsHeapBytes: null }
    const third = { ...sample(2), jsHeapBytes: null }

    expect(getMonotonicLeakMetrics([first, second, third])).toEqual([])
    expect(getMonotonicLeakMetrics([first, second])).toEqual([])
  })
})

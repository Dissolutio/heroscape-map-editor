/**
 * AUTO ZOOM TIMING (world/camera/mapSettleTracker.ts)
 *
 * The 3D view zooms to the map once the map has finished building, not on a
 * timer: the scene and the piece models can take seconds to appear on a slow
 * machine or in the desktop app.
 */
import { describe, expect, it } from 'vitest'
import { createMapSettleTracker } from '../world/camera/mapSettleTracker'

const size = (x: number, y = 1, z = x) => ({ x, y, z })

describe('createMapSettleTracker', () => {
  it('waits while there is nothing to frame yet', () => {
    const tracker = createMapSettleTracker(0)
    expect(tracker.update(null, 0)).toBe('wait')
    expect(tracker.update(size(0, 0, 0), 100)).toBe('wait')
  })

  it('is ready once the map size has held still for enough frames', () => {
    const tracker = createMapSettleTracker(0, { stableFramesNeeded: 3 })
    expect(tracker.update(size(10), 0)).toBe('wait')
    expect(tracker.update(size(10), 16)).toBe('wait')
    expect(tracker.update(size(10), 32)).toBe('wait')
    expect(tracker.update(size(10), 48)).toBe('ready')
  })

  it('starts counting again whenever the map grows (models still loading)', () => {
    const tracker = createMapSettleTracker(0, { stableFramesNeeded: 2 })
    tracker.update(size(10), 0)
    tracker.update(size(10), 16)
    expect(tracker.update(size(12), 32)).toBe('wait')
    expect(tracker.update(size(12), 48)).toBe('wait')
    expect(tracker.update(size(12), 64)).toBe('ready')
  })

  it('gives up waiting for stability after maxWaitMs, if there is a map', () => {
    const tracker = createMapSettleTracker(0, { maxWaitMs: 1000 })
    expect(tracker.update(size(10), 500)).toBe('wait')
    expect(tracker.update(size(11), 1000)).toBe('ready')
  })

  it('never reports ready for an empty scene, even after maxWaitMs', () => {
    const tracker = createMapSettleTracker(0, { maxWaitMs: 1000 })
    expect(tracker.update(null, 5000)).toBe('wait')
  })
})

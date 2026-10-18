/**
 * Decides when the 3D map has finished building so the camera can frame it.
 * Feed it the map's bounding-box size once per frame: it reports "ready" once
 * the box is non-empty and has not changed for a few frames (piece models
 * load a beat after the hexes), or once maxWaitMs has passed with a
 * non-empty box, so a slow model can never block the zoom forever.
 */
export const MAP_SETTLE_STABLE_FRAMES = 10
export const MAP_SETTLE_MAX_WAIT_MS = 4000

type Size = { x: number; y: number; z: number }

const EPSILON = 1e-3

const isEmptySize = (size: Size | null) =>
  !size || !(size.x > 0 || size.y > 0 || size.z > 0)

const sameSize = (a: Size, b: Size) =>
  Math.abs(a.x - b.x) < EPSILON &&
  Math.abs(a.y - b.y) < EPSILON &&
  Math.abs(a.z - b.z) < EPSILON

export function createMapSettleTracker(
  startedAt: number,
  {
    stableFramesNeeded = MAP_SETTLE_STABLE_FRAMES,
    maxWaitMs = MAP_SETTLE_MAX_WAIT_MS,
  } = {},
) {
  let lastSize: Size | null = null
  let stableFrames = 0
  return {
    /** Call once per frame with the map's current bounding-box size. */
    update(size: Size | null, now: number): 'wait' | 'ready' {
      if (isEmptySize(size) || !size) {
        lastSize = null
        stableFrames = 0
        return 'wait'
      }
      stableFrames = lastSize && sameSize(lastSize, size) ? stableFrames + 1 : 0
      lastSize = { ...size }
      if (stableFrames >= stableFramesNeeded) return 'ready'
      if (now - startedAt >= maxWaitMs) return 'ready'
      return 'wait'
    },
  }
}

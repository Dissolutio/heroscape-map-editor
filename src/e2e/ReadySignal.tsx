import { useProgress } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { Group, Object3DEventMap } from 'three'
import useBoundStore from '../store/store'
import { getMapBoundsSize } from '../utils/camera-utils'
import { createMapSettleTracker } from '../world/camera/mapSettleTracker'
import { isE2E } from './isE2E'
import { setReady } from './readyStore'

/** No GLTF/texture request in flight for this long. */
const LOADER_IDLE_MS = 300
/** Camera matrix unchanged for this many consecutive frames. */
const CAMERA_STABLE_FRAMES = 10
/**
 * AutoZoomToMap starts its camera move on the frame the map settles. Wait a
 * few frames after that so the move is under way before judging "camera at
 * rest", or we would call a still-unmoved camera "stable".
 */
const FRAMES_AFTER_MAP_SETTLE = 3
const CAMERA_EPSILON = 1e-4

type Armed = {
  tracker: ReturnType<typeof createMapSettleTracker>
  mapSettled: boolean
  framesSinceSettle: number
  lastLoaderActiveAt: number
  cameraSignature: number[] | null
  cameraStableFrames: number
  done: boolean
}

const arm = (now: number): Armed => ({
  tracker: createMapSettleTracker(now),
  mapSettled: false,
  framesSinceSettle: 0,
  lastLoaderActiveAt: now,
  cameraSignature: null,
  cameraStableFrames: 0,
  done: false,
})

const sameSignature = (a: number[], b: number[]) =>
  a.length === b.length &&
  a.every((value, i) => Math.abs(value - b[i]) < CAMERA_EPSILON)

/**
 * Publishes "the current map is fully loaded and the camera is still" as
 * `window.__APP_READY__`, `canvas[data-ready="true"]` and the hidden status
 * element, so Playwright can wait on something real instead of guessing.
 *
 * Ready means all of: the map's bounding box has stopped changing (same
 * tracker AutoZoomToMap uses), no loader has been active for LOADER_IDLE_MS,
 * and the camera has stopped moving. Any change to the map, viewing level or
 * camera type clears it and starts over, and so does moving the camera.
 *
 * Assumes frames are being rendered. It calls invalidate() while waiting, so
 * it also works with frameloop="demand", but not with frameloop="never".
 */
export function ReadySignal({
  mapGroupRef,
}: {
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  if (!isE2E) return null
  return <ReadySignalInner mapGroupRef={mapGroupRef} />
}

function ReadySignalInner({
  mapGroupRef,
}: {
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const canvas = useThree((s) => s.gl.domElement)
  const mapID = useBoundStore((s) => s.hexMap.id)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const armedRef = useRef<Armed | null>(null)
  // drei's loading manager: true while any GLTF/texture request is in flight
  const { active: isLoading } = useProgress()
  const isLoadingRef = useRef(isLoading)
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  const publish = (ready: boolean) => {
    setReady(ready)
    window.__APP_READY__ = ready
    canvas.dataset.mapId = mapID
    if (ready) {
      canvas.dataset.ready = 'true'
    } else {
      delete canvas.dataset.ready
    }
  }

  // Re-arm whenever something that changes what is drawn changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-arm on these inputs
  useEffect(() => {
    armedRef.current = arm(performance.now())
    publish(false)
  }, [mapID, boardPieces, boardHexes, viewingLevel, isOrthoCam])

  useEffect(() => {
    return () => {
      armedRef.current = null
      setReady(false)
      window.__APP_READY__ = undefined
      delete canvas.dataset.ready
      delete canvas.dataset.mapId
    }
  }, [canvas])

  useFrame(({ camera, invalidate }) => {
    const armed = armedRef.current
    if (!armed) return
    const now = performance.now()

    const signature = [...camera.matrixWorld.elements, camera.zoom]
    const cameraMoved =
      !armed.cameraSignature || !sameSignature(armed.cameraSignature, signature)
    armed.cameraSignature = signature

    if (armed.done) {
      if (!cameraMoved) return
      // the user (or a test) moved the camera: it is no longer "still"
      armed.done = false
      armed.cameraStableFrames = 0
      publish(false)
    }

    if (isLoadingRef.current) armed.lastLoaderActiveAt = now

    if (!armed.mapSettled) {
      if (useBoundStore.getState().boardPieces.length === 0) {
        // An empty map has no bounds to wait for.
        armed.mapSettled = true
      } else if (mapGroupRef.current) {
        const size = getMapBoundsSize(mapGroupRef.current)
        if (armed.tracker.update(size, now) === 'ready') armed.mapSettled = true
      }
    }
    if (armed.mapSettled) armed.framesSinceSettle++

    armed.cameraStableFrames =
      armed.mapSettled &&
      armed.framesSinceSettle > FRAMES_AFTER_MAP_SETTLE &&
      !cameraMoved
        ? armed.cameraStableFrames + 1
        : 0

    if (
      armed.mapSettled &&
      now - armed.lastLoaderActiveAt >= LOADER_IDLE_MS &&
      armed.cameraStableFrames >= CAMERA_STABLE_FRAMES
    ) {
      armed.done = true
      publish(true)
      return
    }
    // keep frames coming while waiting, even in frameloop="demand"
    invalidate()
  })

  return null
}

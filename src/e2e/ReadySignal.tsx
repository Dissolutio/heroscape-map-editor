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

type ReadyInputs = {
  mapID: string
  boardPieces: unknown
  boardHexes: unknown
  viewingLevel: number
  isOrthoCam: boolean
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
 * The app-ready store, and in e2e mode `window.__APP_READY__`,
 * `canvas[data-ready="true"]` and the hidden status element.
 *
 * Ready means all of: the map's bounding box has stopped changing (same
 * tracker AutoZoomToMap uses), no loader has been active for LOADER_IDLE_MS,
 * and the camera has stopped moving. E2E mode re-arms on map, level, camera
 * type, or camera changes. Other builds stop tracking after the first ready.
 *
 * Assumes frames are being rendered. It calls invalidate() while waiting, so
 * it also works with frameloop="demand", but not with frameloop="never".
 */
export function ReadySignal({
  mapGroupRef,
}: {
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
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
  const hasPublishedReadyRef = useRef(false)
  const armInputsRef = useRef<ReadyInputs | null>(null)
  const armCountRef = useRef(0)
  // drei's loading manager: true while any GLTF/texture request is in flight
  const { active: isLoading } = useProgress()
  const isLoadingRef = useRef(isLoading)
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  const publish = (ready: boolean) => {
    if (!isE2E && !ready && hasPublishedReadyRef.current) return
    if (!isE2E && ready) hasPublishedReadyRef.current = true
    setReady(ready)
    if (isE2E) {
      window.__APP_READY__ = ready
      const debug = window.__READY_DEBUG__
      if (debug) {
        debug.ready = ready
        debug.mapID = mapID
        if (ready) debug.lastReadyAt = performance.now()
      }
      canvas.dataset.mapId = mapID
      if (ready) {
        canvas.dataset.ready = 'true'
      } else {
        delete canvas.dataset.ready
      }
    }
  }

  // Re-arm whenever something that changes what is drawn changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-arm on these inputs
  useEffect(() => {
    if (!isE2E && hasPublishedReadyRef.current) return
    const now = performance.now()
    armedRef.current = arm(now)
    if (isE2E) {
      const previous = armInputsRef.current
      const changes: string[] = []
      if (!previous || !window.__READY_DEBUG__) changes.push('initial')
      else {
        if (previous.mapID !== mapID) changes.push('mapID')
        if (previous.boardPieces !== boardPieces) changes.push('boardPieces')
        if (previous.boardHexes !== boardHexes) changes.push('boardHexes')
        if (previous.viewingLevel !== viewingLevel) changes.push('viewingLevel')
        if (previous.isOrthoCam !== isOrthoCam) changes.push('isOrthoCam')
      }
      armInputsRef.current = {
        mapID,
        boardPieces,
        boardHexes,
        viewingLevel,
        isOrthoCam,
      }
      armCountRef.current++
      window.__READY_DEBUG__ = {
        mapID,
        mapSettled: false,
        framesSinceSettle: 0,
        lastLoaderActiveAt: now,
        loaderActive: isLoadingRef.current,
        cameraStableFrames: 0,
        lastFrameAt: null,
        frameCount: 0,
        armedAt: now,
        armCount: armCountRef.current,
        lastArmChanges: changes,
        ready: false,
        lastReadyAt: window.__READY_DEBUG__?.lastReadyAt ?? null,
        boardPieceCount: boardPieces.length,
        boardHexCount: Object.keys(boardHexes).length,
        viewingLevel,
        isOrthoCam,
      }
    }
    publish(false)
  }, [mapID, boardPieces, boardHexes, viewingLevel, isOrthoCam])

  useEffect(() => {
    return () => {
      armedRef.current = null
      if (isE2E) {
        setReady(false)
        window.__APP_READY__ = undefined
        window.__READY_DEBUG__ = undefined
        delete canvas.dataset.ready
        delete canvas.dataset.mapId
      }
    }
  }, [canvas])

  useFrame((state) => {
    if (!isE2E && hasPublishedReadyRef.current) return
    const { camera, invalidate } = state
    const armed = armedRef.current
    if (!armed) return
    const now = performance.now()
    if (isE2E) {
      const debug = window.__READY_DEBUG__
      if (debug) {
        debug.lastFrameAt = now
        debug.frameCount++
        debug.mapID = mapID
        debug.loaderActive = isLoadingRef.current
        if (isLoadingRef.current) debug.lastLoaderActiveAt = now
      }
    }

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
    if (isE2E) {
      const debug = window.__READY_DEBUG__
      if (debug) {
        debug.mapSettled = armed.mapSettled
        debug.framesSinceSettle = armed.framesSinceSettle
        debug.lastLoaderActiveAt = isLoadingRef.current
          ? now
          : armed.lastLoaderActiveAt
        debug.cameraStableFrames = armed.cameraStableFrames
      }
    }

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

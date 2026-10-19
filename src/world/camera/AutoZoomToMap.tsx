import type { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { Group, Object3DEventMap } from 'three'
import useBoundStore from '../../store/store'
import { getMapBoundsSize, zoomToMap } from '../../utils/camera-utils'
import { getBoardHexesRectangularMapDimensions } from '../../utils/map-utils'
import { createMapSettleTracker } from './mapSettleTracker'

/**
 * Zooms the camera to the map whenever the 3D view mounts (first load, or
 * coming back from the 2D/PDF view) and whenever a different map is loaded.
 *
 * It runs inside the scene and waits for the map to finish building (see
 * mapSettleTracker) instead of guessing with timers, which used to miss on
 * first load because the 3D view loads lazily and can take seconds.
 */
export default function AutoZoomToMap({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const mapID = useBoundStore((s) => s.hexMap.id)
  const pendingRef = useRef<ReturnType<typeof createMapSettleTracker> | null>(
    null,
  )

  // Runs on mount, and again for each newly loaded map.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-arm per map
  useEffect(() => {
    pendingRef.current = createMapSettleTracker(performance.now())
  }, [mapID])

  useFrame(({ invalidate }) => {
    const tracker = pendingRef.current
    if (!tracker) return
    // keep frames coming while waiting, even in frameloop="demand"
    invalidate()
    const group = mapGroupRef.current
    if (!group || !cameraControlsRef.current) return
    if (
      tracker.update(getMapBoundsSize(group), performance.now()) !== 'ready'
    ) {
      return
    }
    pendingRef.current = null
    const { width, length } = getBoardHexesRectangularMapDimensions(
      useBoundStore.getState().boardHexes,
    )
    zoomToMap(mapGroupRef, cameraControlsRef, width, length)
  })

  return null
}

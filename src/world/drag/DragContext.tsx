import type { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type React from 'react'
import { useEffect } from 'react'
import { registerDragContext } from './dragController'
import { registerObjectiveMarkerDragContext } from './objectiveMarkerDragController'

/** Hands the drag controller the camera controls and R3F state. */
export function DragContext({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
}) {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const unregisterPieceDrag = registerDragContext(cameraControlsRef, get)
    const unregisterMarkerDrag = registerObjectiveMarkerDragContext(
      cameraControlsRef,
      get,
    )
    return () => {
      unregisterPieceDrag()
      unregisterMarkerDrag()
    }
  }, [cameraControlsRef, get])
  return null
}

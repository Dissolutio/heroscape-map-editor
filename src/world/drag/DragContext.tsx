import type { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type React from 'react'
import { useEffect } from 'react'
import { registerDragContext } from './dragController'

/** Hands the drag controller the camera controls and R3F state. */
export function DragContext({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
}) {
  const get = useThree((s) => s.get)
  useEffect(
    () => registerDragContext(cameraControlsRef, get),
    [cameraControlsRef, get],
  )
  return null
}

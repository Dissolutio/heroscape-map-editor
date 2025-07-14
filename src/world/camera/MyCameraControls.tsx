import { CameraControls } from '@react-three/drei'
import type React from 'react'
import useBoundStore from '../../store/store'
import { useHotkeys } from 'react-hotkeys-hook'
import { useThree } from '@react-three/fiber'

export default function MyCameraControls({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
}) {
  const isCameraDisabled = useBoundStore(
    (s) => s.isCameraDisabled || s.isTakingPicture,
  )
  useHotkeys('up', () => { cameraControlsRef?.current?.truck(0, -5, true) })
  useHotkeys('down', () => cameraControlsRef?.current?.truck(0, 5, true))
  useHotkeys('left', () => cameraControlsRef?.current?.truck(-5, 0, true))
  useHotkeys('right', () => cameraControlsRef?.current?.truck(5, 0, true))
  useHotkeys('shift+up', () => { cameraControlsRef.current?.rotate(0, -Math.PI / 27, true) })
  useHotkeys('shift+down', () => { cameraControlsRef.current?.rotate(0, Math.PI / 27, true) })
  useHotkeys('shift+left', () => { cameraControlsRef.current?.rotate(-Math.PI / 27, 0, true) })
  useHotkeys('shift+right', () => { cameraControlsRef.current?.rotate(Math.PI / 27, 0, true) })
  useHotkeys('mod+up', () => { cameraControlsRef?.current?.dolly(1, true) })
  useHotkeys('mod+down', () => { cameraControlsRef?.current?.dolly(-1, true) })
  useHotkeys('mod+left', () => { cameraControlsRef?.current?.zoom(-cameraControlsRef.current.camera.zoom / 2, true) })
  useHotkeys('mod+right', () => { cameraControlsRef?.current?.zoom(cameraControlsRef.current.camera.zoom / 2, true) })

  return (
    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      enabled={!isCameraDisabled}
      maxPolarAngle={Math.PI / 2} // this keeps the camera on a half-sphere around the map, rather than allowing camera to go under the map
      minDistance={1} // this keeps the camera above ground and out of the board hexes nether region
      maxDistance={100} // this prevents camera from dollying out too far
      smoothTime={0.3}
      dollySpeed={0.2}
    // mouseButtons={{
    //   left: isCameraDisabled ? 0 : 1, // No action
    //   middle: 0, // No action
    //   right: isCameraDisabled ? 0 : 2, // No action
    //   wheel: isCameraDisabled ? 0 : 8, // Zoom (hard to configure between ortho and perspective, no luck)
    // }}
    />
  )
}

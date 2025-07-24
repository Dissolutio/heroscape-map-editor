import { CameraControls } from '@react-three/drei'
import type React from 'react'
import useBoundStore from '../../store/store'
import { useHotkeys } from 'react-hotkeys-hook'

export default function MyCameraControls({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
}) {
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const isCameraDisabled = useBoundStore(
    (s) => s.isCameraDisabled || s.isTakingPicture,
  )
  useHotkeys('up', () => {
    cameraControlsRef?.current?.truck(0, -1, true)
  })
  useHotkeys('down', () => cameraControlsRef?.current?.truck(0, 1, true))
  useHotkeys('left', () => cameraControlsRef?.current?.truck(-1, 0, true))
  useHotkeys('right', () => cameraControlsRef?.current?.truck(1, 0, true))
  useHotkeys('shift+up', () => {
    cameraControlsRef.current?.rotate(0, -Math.PI / 180, true)
  })
  useHotkeys('shift+down', () => {
    cameraControlsRef.current?.rotate(0, Math.PI / 180, true)
  })
  useHotkeys('shift+left', () => {
    cameraControlsRef.current?.rotate(-Math.PI / 180, 0, true)
  })
  useHotkeys('shift+right', () => {
    cameraControlsRef.current?.rotate(Math.PI / 180, 0, true)
  })
  useHotkeys('mod+up', () => {
    isOrthoCam
      ? cameraControlsRef?.current?.zoom(1, true)
      : cameraControlsRef?.current?.dolly(1, true)
  })
  useHotkeys('mod+down', () => {
    isOrthoCam
      ? cameraControlsRef?.current?.zoom(-1, true)
      : cameraControlsRef?.current?.dolly(-1, true)
  })

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

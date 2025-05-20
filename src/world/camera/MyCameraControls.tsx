import { CameraControls } from '@react-three/drei'
import type React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import type { Group, Object3DEventMap } from 'three'
import useBoundStore from '../../store/store'

export default function MyCameraControls({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const isCameraDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  const isCameraActuallyDisabled = useBoundStore(
    (s) => s.isCameraDisabled || s.isTakingPicture,
  )
  const hotkeyOptions = {
    enabled: !isCameraActuallyDisabled,
  }
  const fitToMap = () => {
    if (mapGroupRef.current) {
      cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
    }
  }

  // THIS HOTKEY ENABLED ALL THE TIME
  useHotkeys('end', () => toggleIsCameraDisabled(!isCameraDisabled))

  useHotkeys(
    'home',
    () => {
      fitToMap()
    },
    hotkeyOptions,
  )
  // useHotkeys('up', () => { cameraControlsRef?.current?.truck(0, -5, true) }, hotkeyOptions)
  // useHotkeys('down', () => cameraControlsRef?.current?.truck(0, 5, true), hotkeyOptions)
  // useHotkeys('left', () => cameraControlsRef?.current?.truck(-5, 0, true), hotkeyOptions)
  // useHotkeys('right', () => cameraControlsRef?.current?.truck(5, 0, true), hotkeyOptions)
  // useHotkeys('shift+up', () => { cameraControlsRef.current?.rotate(0, -Math.PI / 27, true) }, hotkeyOptions)
  // useHotkeys('shift+down', () => { cameraControlsRef.current?.rotate(0, Math.PI / 27, true) }, hotkeyOptions)
  // useHotkeys('shift+left', () => { cameraControlsRef.current?.rotate(-Math.PI / 27, 0, true) }, hotkeyOptions)
  // useHotkeys('shift+right', () => { cameraControlsRef.current?.rotate(Math.PI / 27, 0, true) }, hotkeyOptions)
  // useHotkeys('mod+up', () => { cameraControlsRef?.current?.dolly(1, true) }, hotkeyOptions)
  // useHotkeys('mod+down', () => { cameraControlsRef?.current?.dolly(-1, true) }, hotkeyOptions)
  // useHotkeys('mod+left', () => { cameraControlsRef?.current?.zoom(-cameraControlsRef.current.camera.zoom / 2, true) }, hotkeyOptions)
  // useHotkeys('mod+right', () => { cameraControlsRef?.current?.zoom(cameraControlsRef.current.camera.zoom / 2, true) }, hotkeyOptions)

  return (
    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      enabled={!isCameraActuallyDisabled}
      maxPolarAngle={Math.PI / 2} // this keeps the camera on a half-sphere around the map, rather than allowing camera to go under the map
      minDistance={1} // this keeps the camera above ground and out of the board hexes nether region
      maxDistance={100} // this prevents camera from dollying out too far
      smoothTime={0.3}
    />
  )
}

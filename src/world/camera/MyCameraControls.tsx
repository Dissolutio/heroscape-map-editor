import { CameraControls } from '@react-three/drei'
import type React from 'react'
import useBoundStore from '../../store/store'
import { useHotkeys } from 'react-hotkeys-hook'

export default function MyCameraControls({
  cameraControlsRef,
  onCameraMove,
  isSelectionMenuOpen,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  onCameraMove: () => void
  isSelectionMenuOpen: boolean
}) {
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  // A piece drag also locks it (see world/drag/dragController.ts, which
  // locks it imperatively first: this prop alone comes too late)
  const isCameraDisabled = useBoundStore(
    (s) => s.isCameraDisabled || s.isTakingPicture || s.isDraggingPiece,
  )
  const cameraHotkeyOptions = { enabled: !isSelectionMenuOpen }
  useHotkeys(
    'up',
    () => {
      cameraControlsRef?.current?.truck(0, -1, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'down',
    () => cameraControlsRef?.current?.truck(0, 1, true),
    cameraHotkeyOptions,
  )
  useHotkeys(
    'left',
    () => cameraControlsRef?.current?.truck(-1, 0, true),
    cameraHotkeyOptions,
  )
  useHotkeys(
    'right',
    () => cameraControlsRef?.current?.truck(1, 0, true),
    cameraHotkeyOptions,
  )
  useHotkeys(
    'shift+up',
    () => {
      cameraControlsRef.current?.rotate(0, -Math.PI / 180, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'shift+down',
    () => {
      cameraControlsRef.current?.rotate(0, Math.PI / 180, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'shift+left',
    () => {
      cameraControlsRef.current?.rotate(-Math.PI / 180, 0, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'shift+right',
    () => {
      cameraControlsRef.current?.rotate(Math.PI / 180, 0, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'mod+left',
    () => {
      cameraControlsRef.current?.rotate((15 * -Math.PI) / 180, 0, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'mod+right',
    () => {
      cameraControlsRef.current?.rotate((15 * Math.PI) / 180, 0, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'mod+up',
    () => {
      isOrthoCam
        ? cameraControlsRef?.current?.zoom(1, true)
        : cameraControlsRef?.current?.dolly(1, true)
    },
    cameraHotkeyOptions,
  )
  useHotkeys(
    'mod+down',
    () => {
      isOrthoCam
        ? cameraControlsRef?.current?.zoom(-1, true)
        : cameraControlsRef?.current?.dolly(-1, true)
    },
    cameraHotkeyOptions,
  )

  return (
    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      enabled={!isCameraDisabled}
      onChange={onCameraMove}
      maxPolarAngle={Math.PI / 2} // this keeps the camera on a half-sphere around the map, rather than allowing camera to go under the map
      minDistance={1} // this keeps the camera above ground and out of the board hexes nether region
      maxDistance={100} // this prevents camera from dollying out too far
      smoothTime={0.3}
      dollySpeed={1}
      // mouseButtons={{
      //   left: isCameraDisabled ? 0 : 1, // No action
      //   middle: 0, // No action
      //   right: isCameraDisabled ? 0 : 2, // No action
      //   wheel: isCameraDisabled ? 0 : 8, // Zoom (hard to configure between ortho and perspective, no luck)
      // }}
    />
  )
}

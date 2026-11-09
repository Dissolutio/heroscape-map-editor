import { CameraControls } from '@react-three/drei'
import type React from 'react'
import useBoundStore from '../../store/store'
import { useHotkeys } from 'react-hotkeys-hook'
import { useHotkeyConfig } from '../../controls/useHotkeyConfig'
import type { HotkeyAction } from '../../data/hotkeys'

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
  const { hotkeyConfig } = useHotkeyConfig()
  const cameraHotkeyOptions = { enabled: !isSelectionMenuOpen }
  const cameraActions: Partial<Record<HotkeyAction, () => void>> = {
    cameraPanUp: () => cameraControlsRef?.current?.truck(0, -1, true),
    cameraPanDown: () => cameraControlsRef?.current?.truck(0, 1, true),
    cameraPanLeft: () => cameraControlsRef?.current?.truck(-1, 0, true),
    cameraPanRight: () => cameraControlsRef?.current?.truck(1, 0, true),
    cameraRotateUp: () =>
      cameraControlsRef.current?.rotate(0, -Math.PI / 180, true),
    cameraRotateDown: () =>
      cameraControlsRef.current?.rotate(0, Math.PI / 180, true),
    cameraRotateLeft: () =>
      cameraControlsRef.current?.rotate(-Math.PI / 180, 0, true),
    cameraRotateRight: () =>
      cameraControlsRef.current?.rotate(Math.PI / 180, 0, true),
    cameraRotateLeftFar: () =>
      cameraControlsRef.current?.rotate((15 * -Math.PI) / 180, 0, true),
    cameraRotateRightFar: () =>
      cameraControlsRef.current?.rotate((15 * Math.PI) / 180, 0, true),
    cameraZoomIn: () =>
      isOrthoCam
        ? cameraControlsRef?.current?.zoom(1, true)
        : cameraControlsRef?.current?.dolly(1, true),
    cameraZoomOut: () =>
      isOrthoCam
        ? cameraControlsRef?.current?.zoom(-1, true)
        : cameraControlsRef?.current?.dolly(-1, true),
  }
  const cameraHotkeys = Object.keys(hotkeyConfig).filter((key) => {
    const action = hotkeyConfig[key]
    return action !== undefined && cameraActions[action] !== undefined
  })
  useHotkeys(
    cameraHotkeys,
    (_, hotkeysEvent) => {
      const action = hotkeyConfig[hotkeysEvent.hotkey]
      if (action) cameraActions[action]?.()
    },
    cameraHotkeyOptions,
    [hotkeyConfig, isOrthoCam],
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

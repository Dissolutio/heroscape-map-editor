import type { CameraControls } from '@react-three/drei'
import React from 'react'
import useBoundStore from '../../store/store'
import { getMapCenterCameraLookAt } from '../../utils/camera-utils'

export const useZoomCameraToMapCenter = ({
  cameraControlsRef,
  disabled,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  disabled?: boolean
}) => {
  const mapID = useBoundStore((state) => state.hexMap.id)
  const mapShape = useBoundStore((state) => state.hexMap.shape)
  const boardHexes = useBoundStore((s) => s.boardHexes)

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on load new map
  React.useEffect(() => {
    if (disabled) {
      console.warn('Zoom to center of map has been disabled!')
      return
    }
    const cameraArgs = getMapCenterCameraLookAt(boardHexes, mapShape)
    cameraControlsRef?.current?.setLookAt?.(...cameraArgs)
  }, [mapID])
}

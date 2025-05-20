import type { CameraControls } from '@react-three/drei'
import React from 'react'
import useBoundStore from '../../store/store'
import type { BoardHexes, HexMap } from '../../types'
import { getMapCenterCameraLookAt } from '../../utils/camera-utils'
import { getBoardPiecesMaxLevel } from '../../utils/map-utils'

export const useZoomCameraToMapCenter = ({
  cameraControlsRef,
  boardHexes,
  disabled,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  boardHexes: BoardHexes
  disabled?: boolean
}) => {
  const mapID = useBoundStore((state) => state.hexMap.id)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const mapShape = useBoundStore((state) => state.hexMap.shape)
  const toggleViewingLevel = useBoundStore((state) => state.toggleViewingLevel)
  const maxLevel = getBoardPiecesMaxLevel(boardPieces)

  // USE EFFECT: Update viewing level when new map is loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: <only auto-update viewing level when map is loaded>
  React.useEffect(() => {
    toggleViewingLevel(maxLevel)
  }, [mapID])
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

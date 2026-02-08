import type { RefObject } from 'react'
import type { BoardHexes } from '../types'
import { CAMERA_FOV } from '../utils/constants'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'

type CameraLookAtArgs = [
  // positionX
  number,
  // positionY
  number,
  // positionZ
  number,
  // targetX
  number,
  // targetY
  number,
  // targetZ
  number,
  // enableTransition
  boolean,
]
export const zoomToMap = (
  mapGroupRef: RefObject<Group<Object3DEventMap>>,
  cameraControlsRef: RefObject<CameraControls>,
  width: number,
  length: number,
) => {
  if (mapGroupRef.current) {
    cameraControlsRef.current?.setPosition?.(
      width,
      width + length,
      length,
      false,
    )
    cameraControlsRef.current?.rotateTo?.(0, 0, false)
    cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
  }
}
export const getMapCenterCameraLookAt = (
  boardHexes: BoardHexes,
  mapShape: string,
): CameraLookAtArgs => {
  const { width, length, apex } =
    getBoardHexesRectangularMapDimensions(boardHexes)
  const y = width / 2 // far enough to see all of bottom of map even if it wall at the apex of the map
  if (mapShape === 'hexagon') {
    const centerOfMapCamera = {
      x: 0,
      z: length,
      y: y + apex * 1.4,
    }
    const centerOfMapLookAt = {
      x: 0,
      z: 0,
      y: 0,
    }
    return [
      // from
      centerOfMapCamera.x,
      centerOfMapCamera.y,
      centerOfMapCamera.z,
      // at
      centerOfMapLookAt.x,
      centerOfMapLookAt.y,
      centerOfMapLookAt.z,
      true, // enable/disable animation
    ]
  }
  const centerOfMapCamera = {
    x: width / 2,
    z: length / 1.5,
    y: y + apex * 1.4,
  }
  const centerOfMapLookAt = {
    x: width / 2,
    z: length / 2,
    y: 0,
  }
  return [
    // from
    centerOfMapCamera.x,
    centerOfMapCamera.y,
    centerOfMapCamera.z,
    // at
    centerOfMapLookAt.x,
    centerOfMapLookAt.y,
    centerOfMapLookAt.z,
    true, // enable/disable animation
  ]
}

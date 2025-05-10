import { BoardHexes } from '../types'
import { CAMERA_FOV } from '../utils/constants'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'

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

export const getMapCenterCameraLookAt = (
  boardHexes: BoardHexes,
  mapShape: string,
): CameraLookAtArgs => {
  const { width, length, apex } =
    getBoardHexesRectangularMapDimensions(boardHexes)
  /* 
  TODO: This will need to be updated: Find width and height,
  then ascend a bit from apex, not from base (what if apex is fat?) 
  */
  const alpha = CAMERA_FOV / 2
  const beta = 90 - alpha
  const y = (width / 2) * Math.tan(beta) // far enough to see all of bottom of map even if it wall at the apex of the map
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
    z: length * 2,
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

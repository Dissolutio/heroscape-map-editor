import type { RefObject } from 'react'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'
import type { BoardPiece } from '../types'
import { getBoardHex3DCoords } from './map-utils'

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
      true,
    )
    cameraControlsRef.current?.rotateTo?.(0, 0, true)
    cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
  }
}

interface ZoomToPieceArgs {
  cameraControlsRef: RefObject<CameraControls>
  boardPieces: BoardPiece[]
  targetUID: string
}

/**
 * Zoom the camera to focus on a specific piece on the map.
 * The camera will smoothly animate to the piece's position.
 */
export const zoomToPiece = ({
  cameraControlsRef,
  boardPieces,
  targetUID,
}: ZoomToPieceArgs) => {
  const targetPiece = boardPieces.find((bp) => bp.uid === targetUID)
  if (!targetPiece) return

  // Convert hex coordinates to 3D world coordinates
  const { x, y, z } = getBoardHex3DCoords({
    q: targetPiece.pieceCoords.q,
    r: targetPiece.pieceCoords.r,
    s: targetPiece.pieceCoords.s,
    altitude: targetPiece.altitude,
  })

  // Calculate a good camera distance (approximately 15 units away from the piece)
  const cameraDistance = 15
  const cameraHeight = 8

  // Animate camera to the piece, looking down from an angle
  cameraControlsRef.current?.setPosition?.(
    x + cameraDistance / Math.sqrt(2),
    y + cameraHeight,
    z + cameraDistance / Math.sqrt(2),
    true, // animate
  )

  // Point the camera at the piece
  cameraControlsRef.current?.setTarget?.(x, y, z, true)
}

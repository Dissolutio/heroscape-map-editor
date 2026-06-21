import type { RefObject } from 'react'
import { Box3, Vector3 } from 'three'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'
import type { BoardHexes } from '../types'
import { getBoardHex3DCoords } from './map-utils'
import { HEXGRID_HEX_RADIUS } from './constants'
import useBoundStore from '../store/store'

let clearFocusTimeoutId: ReturnType<typeof setTimeout> | undefined

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
  boardHexes: BoardHexes
  targetUID: string
  mapWidth: number
  mapLength: number
}

interface ZoomToPiecesArgs {
  cameraControlsRef: RefObject<CameraControls>
  boardHexes: BoardHexes
  targetUIDs: string[]
  mapWidth: number
  mapLength: number
}

/**
 * Zoom the camera to focus on a specific piece on the map.
 * The camera frames the piece's occupied hexes so clipping planes stay correct.
 * Pieces will fade to 0.22 opacity immediately, then fade back to 1.0 over 2 seconds (after 1.2s hold).
 */
export const zoomToPiece = ({
  cameraControlsRef,
  boardHexes,
  targetUID,
  mapWidth,
  mapLength,
}: ZoomToPieceArgs) => {
  // Set focus state and timestamp for opacity animation
  const now = performance.now()
  useBoundStore.getState().setFocusedPieceUID(targetUID)
  useBoundStore.getState().setFocusStartTime(now)

  if (clearFocusTimeoutId) {
    clearTimeout(clearFocusTimeoutId)
  }

  const pieceHexes = Object.values(boardHexes).filter(
    (hex) => hex.boardPieceUID === targetUID,
  )
  if (!pieceHexes.length) {
    useBoundStore.getState().setFocusedPieceUID(null)
    useBoundStore.getState().setFocusStartTime(null)
    return
  }

  const box = new Box3()
  for (const hex of pieceHexes) {
    const { x, y, z } = getBoardHex3DCoords(hex)
    box.expandByPoint(new Vector3(x, y, z))
  }

  // Give a little breathing room around the piece so the camera doesn't clip it.
  box.expandByScalar(HEXGRID_HEX_RADIUS * 5)

  cameraControlsRef.current?.setPosition?.(
    mapWidth,
    mapWidth + mapLength,
    mapLength,
    true,
  )
  cameraControlsRef.current?.rotateTo?.(0, 0, true)
  cameraControlsRef.current?.fitToBox?.(box, true)

  // Clear focus state after opacity animation completes (1200ms hold + 2000ms fade-in)
  clearFocusTimeoutId = setTimeout(() => {
    if (useBoundStore.getState().focusedPieceUID === targetUID) {
      useBoundStore.getState().setFocusedPieceUID(null)
      useBoundStore.getState().setFocusStartTime(null)
    }
  }, 3200)
}

/**
 * Zoom the camera to frame one or more pieces by their occupied hexes.
 */
export const zoomToPieces = ({
  cameraControlsRef,
  boardHexes,
  targetUIDs,
  mapWidth,
  mapLength,
}: ZoomToPiecesArgs) => {
  const targetUIDSet = new Set(targetUIDs)
  const pieceHexes = Object.values(boardHexes).filter((hex) =>
    targetUIDSet.has(hex.boardPieceUID),
  )

  if (!pieceHexes.length) {
    return
  }

  // Framing through a world-space bounds box keeps clipping planes stable.
  const box = new Box3()
  for (const hex of pieceHexes) {
    const { x, y, z } = getBoardHex3DCoords(hex)
    box.expandByPoint(new Vector3(x, y, z))
  }
  box.expandByScalar(HEXGRID_HEX_RADIUS * 5)

  cameraControlsRef.current?.setPosition?.(
    mapWidth,
    mapWidth + mapLength,
    mapLength,
    true,
  )
  cameraControlsRef.current?.rotateTo?.(0, 0, true)
  cameraControlsRef.current?.fitToBox?.(box, true)
}

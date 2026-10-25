import type { BoardHex, BoardPiece, CubeCoordinate, Piece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { HEXGRID_HEX_APOTHEM } from '../utils/constants'
import { cubeToPixel, hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { rotateCubeCoordinate, rotateGroupAroundPivot } from './rotateGroup'

export const WHEEL_DOWN_ROTATION_DIRECTION = 1
export const WHEEL_ROTATION_STEP_PIXELS = 100
export const WHEEL_ROTATION_COOLDOWN_MS = 120
export const WHEEL_ROTATION_IDLE_RESET_MS = 200
export const LADDER_SECTOR_DEAD_ZONE_FRACTION = 0.35
export const LADDER_SECTOR_HYSTERESIS_FRACTION = 0.08

export type WheelRotationAccumulator = {
  accumulatedPixels: number
  lastEventAt: number | null
  lastStepAt: number | null
}

export const initialWheelRotationAccumulator: WheelRotationAccumulator = {
  accumulatedPixels: 0,
  lastEventAt: null,
  lastStepAt: null,
}

export function accumulateWheelRotation(
  state: WheelRotationAccumulator,
  {
    deltaY,
    deltaMode,
    time,
    linePixels = 16,
    pagePixels = 800,
  }: {
    deltaY: number
    deltaMode: number
    time: number
    linePixels?: number
    pagePixels?: number
  },
): { state: WheelRotationAccumulator; step: -1 | 0 | 1 } {
  const isIdle =
    state.lastEventAt !== null &&
    time - state.lastEventAt >= WHEEL_ROTATION_IDLE_RESET_MS
  let accumulatedPixels = isIdle ? 0 : state.accumulatedPixels
  let lastStepAt = isIdle ? null : state.lastStepAt
  const multiplier =
    deltaMode === 1 ? linePixels : deltaMode === 2 ? pagePixels : 1
  accumulatedPixels += deltaY * multiplier
  let step: -1 | 0 | 1 = 0

  if (
    Math.abs(accumulatedPixels) >= WHEEL_ROTATION_STEP_PIXELS &&
    (lastStepAt === null || time - lastStepAt >= WHEEL_ROTATION_COOLDOWN_MS)
  ) {
    const direction = Math.sign(accumulatedPixels)
    step = (direction * WHEEL_DOWN_ROTATION_DIRECTION) as -1 | 1
    accumulatedPixels -= direction * WHEEL_ROTATION_STEP_PIXELS
    lastStepAt = time
  }

  return {
    state: { accumulatedPixels, lastEventAt: time, lastStepAt },
    step,
  }
}

export function normalizeRotationSteps(steps: number) {
  return ((Math.trunc(steps) % 6) + 6) % 6
}

export function shouldRotateDragWithWheel(piece: Piece, memberCount: number) {
  if (
    piece.id === Pieces.ladder ||
    piece.terrain === HexTerrain.laurWallAddon
  ) {
    return false
  }
  const isEdgePiece =
    piece.id === Pieces.battlement ||
    piece.id === Pieces.roadWall ||
    piece.id === Pieces.ropeLadder
  return !isEdgePiece || memberCount > 1
}

/** The shortest signed step count; an exact half-turn is clockwise. */
export function shortestRotationSteps(from: number, to: number) {
  const forward = normalizeRotationSteps(to - from)
  return forward > 3 ? forward - 6 : forward
}

export function getNearestHexEdgeIndex(
  pointerHex: CubeCoordinate,
  worldPoint: { x: number; z: number },
  currentEdge: number,
  hysteresis = 0,
) {
  const normalizedCurrent = normalizeRotationSteps(currentEdge)
  const center = cubeToPixel(pointerHex)
  const distances = Array.from({ length: 6 }, (_, edgeIndex) => {
    const neighbor = hexUtilsGetNeighborForRotation(edgeIndex)
    const neighborCenter = cubeToPixel({
      q: pointerHex.q + neighbor.q,
      r: pointerHex.r + neighbor.r,
      s: pointerHex.s + neighbor.s,
    })
    const edgeX = (center.x + neighborCenter.x) / 2
    const edgeZ = (center.y + neighborCenter.y) / 2
    return {
      edgeIndex,
      distance: Math.hypot(worldPoint.x - edgeX, worldPoint.z - edgeZ),
    }
  })
  const nearestDistance = Math.min(...distances.map(({ distance }) => distance))
  const currentDistance = distances[normalizedCurrent].distance
  if (currentDistance <= nearestDistance + hysteresis + 1e-5) {
    return normalizedCurrent
  }
  const nearest = distances.find(
    ({ distance }) => Math.abs(distance - nearestDistance) < 1e-5,
  )
  return nearest?.edgeIndex ?? normalizedCurrent
}

export function getLadderSectorRotation(
  pointerHex: BoardHex,
  worldPoint: { x: number; z: number } | undefined,
  currentRotation: number,
): number | null {
  if (!worldPoint) return null
  const center = cubeToPixel(pointerHex)
  const centerDistance = Math.hypot(
    worldPoint.x - center.x,
    worldPoint.z - center.y,
  )
  if (
    centerDistance <=
    HEXGRID_HEX_APOTHEM * LADDER_SECTOR_DEAD_ZONE_FRACTION
  ) {
    return null
  }
  return getNearestHexEdgeIndex(
    pointerHex,
    worldPoint,
    currentRotation,
    HEXGRID_HEX_APOTHEM * LADDER_SECTOR_HYSTERESIS_FRACTION,
  )
}

export function rotateDragMembers(
  members: readonly BoardPiece[],
  pivotUID: string,
  grabOffset: CubeCoordinate,
  steps: number,
): { bp: BoardPiece; members: BoardPiece[]; grabOffset: CubeCoordinate } {
  const normalizedSteps = normalizeRotationSteps(steps)
  const signedSteps =
    normalizedSteps > 3 ? normalizedSteps - 6 : normalizedSteps
  const direction = signedSteps < 0 ? -1 : 1
  let rotatedMembers = [...members]
  let rotatedGrabOffset = grabOffset

  for (let step = 0; step < Math.abs(signedSteps); step += 1) {
    const moves = rotateGroupAroundPivot(rotatedMembers, pivotUID, direction)
    const movesByUID = new Map(moves.map((move) => [move.uid, move]))
    rotatedMembers = rotatedMembers.map((member) => {
      const move = movesByUID.get(member.uid)
      if (!move) throw new Error(`Missing rotation move for ${member.uid}`)
      return {
        ...member,
        pieceCoords: move.newPieceCoords,
        rotation: move.newRotation ?? member.rotation,
      }
    })
    rotatedGrabOffset = rotateCubeCoordinate(rotatedGrabOffset, direction)
  }

  const bp = rotatedMembers.find((member) => member.uid === pivotUID)
  if (!bp)
    throw new Error(`Rotation pivot ${pivotUID} is not in the drag group`)
  return { bp, members: rotatedMembers, grabOffset: rotatedGrabOffset }
}

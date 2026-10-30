import { getPossibleRotationsForPenMode } from '../controls/getPossibleRotationsForPenMode'
import type { BoardHex, CubeCoordinate } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEX_DIRECTIONS, cubeToPixel, hexUtilsAdd } from '../utils/hex-utils'
import {
  type HexFeatureId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './hexGrid/edgesAndNodes'
import { getPillarPorts } from './laurPillarPorts'
import { isLaurPillarID } from './laurPillarStacking'

export type LaurAddonPoint = { x: number; z: number }

export type LaurAddonResolvedEdge = {
  rotation: number
  featureId: HexFeatureId
  kind: 'side' | 'vertex'
}

export function getLaurAddonPortRotations(
  pieceID: string,
  pillarInventoryID: string,
  pillarRotation: number,
) {
  if (!isLaurWallAddonPieceID(pieceID) || !isLaurPillarID(pillarInventoryID)) {
    return []
  }
  const ports = getPillarPorts(pillarInventoryID, pillarRotation)
  return getPossibleRotationsForPenMode(pieceID).filter((rotation) =>
    ports.includes(rotation),
  )
}

export function getLaurAddonAllowedRotations(
  pieceID: string,
  pointerHex?: Pick<BoardHex, 'inventoryID' | 'pieceRotation'>,
) {
  const possibleRotations = getPossibleRotationsForPenMode(pieceID)
  if (!pointerHex || !isLaurPillarID(pointerHex.inventoryID)) {
    return possibleRotations
  }
  const portRotations = getLaurAddonPortRotations(
    pieceID,
    pointerHex.inventoryID,
    pointerHex.pieceRotation,
  )
  return portRotations.length ? portRotations : possibleRotations
}

const normalizeRotation = (rotation: number) => {
  const halfSteps = rotation * 2
  if (!Number.isInteger(halfSteps)) return null
  return (((halfSteps % 12) + 12) % 12) / 2
}

export function getLaurAddonFeatureId(
  anchor: CubeCoordinate,
  rotation: number,
) {
  const normalized = normalizeRotation(rotation)
  if (normalized === null) return null

  if (Number.isInteger(normalized)) {
    return edgeIdFromHex(anchor, normalized)
  }

  return nodeIdFromHexRotation(anchor, normalized)
}

export function getLaurAddonFeaturePoint(
  anchor: CubeCoordinate,
  rotation: number,
) {
  const center = cubeToPixel(anchor)
  const normalized = normalizeRotation(rotation)
  if (normalized === null) return null

  if (Number.isInteger(normalized)) {
    const direction = cubeToPixel(HEX_DIRECTIONS[normalized])
    return {
      x: center.x + direction.x / 2,
      z: center.y + direction.y / 2,
    }
  }

  const direction = Math.floor(normalized)
  const nextDirection = (direction + 1) % 6
  const first = cubeToPixel(HEX_DIRECTIONS[direction])
  const second = cubeToPixel(HEX_DIRECTIONS[nextDirection])
  return {
    x: center.x + (first.x + second.x) / 3,
    z: center.y + (first.y + second.y) / 3,
  }
}

/**
 * Pick the closest allowed side or vertex to the pointer hit point. At the
 * exact center all sides are tied, so preserve the current pen rotation.
 */
export function resolveLaurAddonEdge(
  anchor: CubeCoordinate,
  hitPoint: LaurAddonPoint,
  penRotation: number,
  allowedRotations: readonly number[],
): LaurAddonResolvedEdge | null {
  const candidates = allowedRotations.flatMap((rotation) => {
    const normalized = normalizeRotation(rotation)
    const point = getLaurAddonFeaturePoint(anchor, rotation)
    const featureId = getLaurAddonFeatureId(anchor, rotation)
    if (normalized === null || !point || !featureId) return []
    return [
      {
        rotation: normalized,
        featureId,
        kind: Number.isInteger(normalized)
          ? ('side' as const)
          : ('vertex' as const),
        distanceSquared:
          (point.x - hitPoint.x) ** 2 + (point.z - hitPoint.z) ** 2,
      },
    ]
  })
  if (!candidates.length) return null

  const normalizedPenRotation = normalizeRotation(penRotation)
  const center = cubeToPixel(anchor)
  if (
    normalizedPenRotation !== null &&
    hitPoint.x === center.x &&
    hitPoint.z === center.y
  ) {
    const penCandidate = candidates.find(
      (candidate) => candidate.rotation === normalizedPenRotation,
    )
    if (penCandidate) return penCandidate
  }

  let best = candidates[0]
  for (const candidate of candidates.slice(1)) {
    const difference = candidate.distanceSquared - best.distanceSquared
    if (difference < -1e-12) {
      best = candidate
    } else if (
      Math.abs(difference) <= 1e-12 &&
      candidate.rotation === normalizedPenRotation
    ) {
      best = candidate
    }
  }
  return {
    rotation: best.rotation,
    featureId: best.featureId,
    kind: best.kind,
  }
}

import type { CubeCoordinate } from '../types'
import { Pieces } from '../types'
import {
  type HexFeatureId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './hexGrid/edgesAndNodes'

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6

const squarePillars = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
])

export type LaurPillarPortFeature = {
  rotation: number
  featureId: HexFeatureId
}

export function getPillarPorts(
  pillarInventoryID: string,
  rotation: number,
): number[] {
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) return []

  if (squarePillars.has(pillarInventoryID)) {
    if (!Number.isInteger(rotation)) return []
    return [0, 1.5, 3, 4.5].map((offset) => mod6(rotation + offset))
  }
  if (pillarInventoryID === Pieces.laurWallTrianglePillar) {
    return [0, 2, 4].map((offset) => mod6(rotation + offset))
  }
  return []
}

export function getPillarPortFeatures(
  pillarInventoryID: string,
  pillarCoords: CubeCoordinate,
  rotation: number,
): LaurPillarPortFeature[] {
  return getPillarPorts(pillarInventoryID, rotation).map((portRotation) => ({
    rotation: portRotation,
    featureId: Number.isInteger(portRotation)
      ? edgeIdFromHex(pillarCoords, portRotation)
      : nodeIdFromHexRotation(pillarCoords, portRotation),
  }))
}

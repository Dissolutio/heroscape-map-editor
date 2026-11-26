import type { CubeCoordinate } from '../types'
import type { HexFeatureId } from './hexGrid/edgesAndNodes'
import { getPillarPorts, portFeatureId } from './portPieces'

/**
 * Port positions of every port pillar (Laur pillars and Void pylons). The
 * port directions themselves are data in portPieces.ts.
 */
export { getPillarPorts }

export type LaurPillarPortFeature = {
  rotation: number
  featureId: HexFeatureId
}

export function getPillarPortFeatures(
  pillarInventoryID: string,
  pillarCoords: CubeCoordinate,
  rotation: number,
): LaurPillarPortFeature[] {
  return getPillarPorts(pillarInventoryID, rotation).map((portRotation) => ({
    rotation: portRotation,
    featureId: portFeatureId(pillarCoords, portRotation),
  }))
}

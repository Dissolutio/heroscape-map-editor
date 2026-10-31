import type { CubeCoordinate } from '../../types'
import { HexTerrain, Pieces } from '../../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../../utils/hex-utils'
import { getLaurAddonFootprint } from '../laurAddonFootprints'
import { getPillarPortFeatures } from '../laurPillarPorts'
import { piecesSoFar } from '../pieces'
import {
  type HexFeatureId,
  type HexEdgeId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './edgesAndNodes'

export type PieceFeatureKind = 'edge' | 'node'
export type PieceFeatureId = HexFeatureId
export type HexCellId = `hex:${number},${number},${number}`

type RotationGranularity = 'whole-step' | 'half-step' | 'whole-and-half-step'

type PortProviderDeclaration = {
  portKinds: readonly PieceFeatureKind[]
  anchor: 'pillar-center'
  rotation: RotationGranularity
  source: 'port-provider'
}

type PieceAttachmentDeclaration = {
  featureKinds: readonly PieceFeatureKind[]
  anchor: 'piece-origin' | 'battlement-offset' | 'road-wall-offset'
  rotation: RotationGranularity
  source: 'attachment'
}

type PieceTopologyDeclaration =
  | PortProviderDeclaration
  | PieceAttachmentDeclaration

export const pieceTopologyDeclarations = {
  [Pieces.laurWallSquarePillar]: {
    portKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-step',
    source: 'port-provider',
  },
  [Pieces.laurWallPillarStackable]: {
    portKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-step',
    source: 'port-provider',
  },
  [Pieces.laurWallTrianglePillar]: {
    portKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-and-half-step',
    source: 'port-provider',
  },
  [Pieces.laurWallShort]: {
    featureKinds: ['edge'],
    anchor: 'piece-origin',
    rotation: 'whole-step',
    source: 'attachment',
  },
  [Pieces.laurWallShortStackable]: {
    featureKinds: ['edge'],
    anchor: 'piece-origin',
    rotation: 'whole-step',
    source: 'attachment',
  },
  [Pieces.laurWallLong]: {
    featureKinds: ['node'],
    anchor: 'piece-origin',
    rotation: 'half-step',
    source: 'attachment',
  },
  [Pieces.laurWallLongStackable]: {
    featureKinds: ['node'],
    anchor: 'piece-origin',
    rotation: 'half-step',
    source: 'attachment',
  },
  [Pieces.laurWallArch]: {
    featureKinds: ['node'],
    anchor: 'piece-origin',
    rotation: 'half-step',
    source: 'attachment',
  },
  [Pieces.laurWallRuin1]: {
    featureKinds: ['edge', 'node'],
    anchor: 'piece-origin',
    rotation: 'whole-and-half-step',
    source: 'attachment',
  },
  [Pieces.laurWallRuin2]: {
    featureKinds: ['edge', 'node'],
    anchor: 'piece-origin',
    rotation: 'whole-and-half-step',
    source: 'attachment',
  },
  [Pieces.laurWallRuin3]: {
    featureKinds: ['edge', 'node'],
    anchor: 'piece-origin',
    rotation: 'whole-and-half-step',
    source: 'attachment',
  },
  [Pieces.battlement]: {
    featureKinds: ['edge'],
    anchor: 'battlement-offset',
    rotation: 'whole-step',
    source: 'attachment',
  },
  [Pieces.roadWall]: {
    featureKinds: ['edge'],
    anchor: 'road-wall-offset',
    rotation: 'whole-step',
    source: 'attachment',
  },
  [Pieces.ropeLadder]: {
    featureKinds: ['edge'],
    anchor: 'piece-origin',
    rotation: 'whole-step',
    source: 'attachment',
  },
} as const satisfies Record<string, PieceTopologyDeclaration>

type PieceFeatureInput = {
  pieceID: string
  pieceCoords: CubeCoordinate
  rotation: number
  altitude?: number
}

type BoardPieceFeatureInput = {
  inventoryID: string
  pieceCoords: CubeCoordinate
  rotation: number
  altitude?: number
}

export type PieceFeatureResult = {
  featureIds: PieceFeatureId[]
  footprint: {
    endHexIds: HexCellId[]
    blockedHexIds: HexCellId[]
    altitude: number
    heightInLevels: number
  } | null
}

export type PieceEdgeInput = PieceFeatureInput | BoardPieceFeatureInput

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6

function isAllowedRotation(rotation: number, granularity: RotationGranularity) {
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) {
    return false
  }
  if (granularity === 'whole-step') return Number.isInteger(rotation)
  if (granularity === 'half-step') return !Number.isInteger(rotation)
  return true
}

function hexCellId(coords: CubeCoordinate): HexCellId {
  if (
    !Number.isSafeInteger(coords.q) ||
    !Number.isSafeInteger(coords.r) ||
    !Number.isSafeInteger(coords.s) ||
    coords.q + coords.r + coords.s !== 0
  ) {
    throw new RangeError('Expected an integer cube coordinate')
  }
  const normalizeZero = (value: number) => (Object.is(value, -0) ? 0 : value)
  return `hex:${normalizeZero(coords.q)},${normalizeZero(coords.r)},${normalizeZero(coords.s)}`
}

function negativeDirection(rotation: number) {
  const direction = HEX_DIRECTIONS[mod6(rotation)]
  return { q: -direction.q, r: -direction.r, s: -direction.s }
}

function getAttachmentAnchor(
  input: PieceFeatureInput | BoardPieceFeatureInput,
  declaration: PieceAttachmentDeclaration,
) {
  if (declaration.anchor === 'battlement-offset') {
    return hexUtilsAdd(input.pieceCoords, negativeDirection(input.rotation + 3))
  }
  if (declaration.anchor === 'road-wall-offset') {
    return hexUtilsAdd(input.pieceCoords, negativeDirection(input.rotation + 4))
  }
  return input.pieceCoords
}

function getAttachmentDeclaration(input: PieceEdgeInput) {
  const pieceID = 'pieceID' in input ? input.pieceID : input.inventoryID
  const declaration =
    pieceTopologyDeclarations[pieceID as keyof typeof pieceTopologyDeclarations]
  return declaration?.source === 'attachment' ? declaration : undefined
}

export function getPieceEdgeAnchor(
  input: PieceEdgeInput,
): CubeCoordinate | null {
  const declaration = getAttachmentDeclaration(input)
  if (
    !declaration ||
    !declaration.featureKinds.includes('edge') ||
    !Number.isInteger(input.rotation) ||
    !isAllowedRotation(input.rotation, declaration.rotation)
  ) {
    return null
  }
  return getAttachmentAnchor(input, declaration)
}

export function getPieceEdgeId(input: PieceEdgeInput): HexEdgeId | null {
  const declaration = getAttachmentDeclaration(input)
  const anchor = getPieceEdgeAnchor(input)
  if (!declaration || !anchor) return null
  return edgeIdFromHex(
    anchor,
    declaration.anchor === 'battlement-offset'
      ? input.rotation + 3
      : input.rotation,
  )
}

export function getPieceFeatureIds(
  input: PieceFeatureInput | BoardPieceFeatureInput,
): PieceFeatureResult | null {
  const pieceID = 'pieceID' in input ? input.pieceID : input.inventoryID
  const declaration: PieceTopologyDeclaration | undefined =
    pieceTopologyDeclarations[pieceID as keyof typeof pieceTopologyDeclarations]
  if (
    !declaration ||
    !isAllowedRotation(input.rotation, declaration.rotation)
  ) {
    return null
  }

  const featureIds: PieceFeatureId[] = []
  if (declaration.source === 'port-provider') {
    featureIds.push(
      ...getPillarPortFeatures(pieceID, input.pieceCoords, input.rotation).map(
        ({ featureId }) => featureId,
      ),
    )
  } else {
    if (
      declaration.featureKinds.includes('edge') &&
      Number.isInteger(input.rotation)
    ) {
      const edgeId = getPieceEdgeId(input)
      if (edgeId) featureIds.push(edgeId)
    } else if (declaration.featureKinds.includes('node')) {
      featureIds.push(
        nodeIdFromHexRotation(
          getAttachmentAnchor(input, declaration),
          input.rotation,
        ),
      )
    }
  }

  let footprint: PieceFeatureResult['footprint'] = null
  if (piecesSoFar[pieceID]?.terrain === HexTerrain.laurWallAddon) {
    const result = getLaurAddonFootprint({
      inventoryID: pieceID,
      anchor: input.pieceCoords,
      altitude: input.altitude ?? 0,
      rotation: input.rotation,
    })
    if (!result) return null
    footprint = {
      endHexIds: result.endHexes.map(hexCellId),
      blockedHexIds: result.blockedHexes.map(hexCellId),
      altitude: result.altitude,
      heightInLevels: result.heightInLevels,
    }
  }

  return { featureIds, footprint }
}

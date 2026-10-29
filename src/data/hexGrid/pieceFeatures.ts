import type { CubeCoordinate } from '../../types'
import { HexTerrain, Pieces } from '../../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../../utils/hex-utils'
import { getLaurAddonFootprint } from '../laurAddonFootprints'
import { getPillarPorts } from '../laurPillarPorts'
import { piecesSoFar } from '../pieces'
import {
  type HexEdgeId,
  type HexNodeId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './edgesAndNodes'

export type PieceFeatureKind = 'edge' | 'node'
export type PieceFeatureId = HexEdgeId | HexNodeId
export type HexCellId = `hex:${number},${number},${number}`

type RotationGranularity = 'whole-step' | 'half-step' | 'whole-and-half-step'

type PieceFeatureDeclaration = {
  featureKinds: readonly PieceFeatureKind[]
  anchor:
    | 'piece-origin'
    | 'pillar-center'
    | 'battlement-offset'
    | 'road-wall-offset'
  rotation: RotationGranularity
  source: 'attachment' | 'pillar-ports'
}

export const pieceFeatureDeclarations = {
  [Pieces.laurWallSquarePillar]: {
    featureKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-step',
    source: 'pillar-ports',
  },
  [Pieces.laurWallPillarStackable]: {
    featureKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-step',
    source: 'pillar-ports',
  },
  [Pieces.laurWallTrianglePillar]: {
    featureKinds: ['edge', 'node'],
    anchor: 'pillar-center',
    rotation: 'whole-and-half-step',
    source: 'pillar-ports',
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
} as const satisfies Record<string, PieceFeatureDeclaration>

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
  declaration: PieceFeatureDeclaration,
) {
  if (declaration.anchor === 'battlement-offset') {
    return hexUtilsAdd(input.pieceCoords, negativeDirection(input.rotation + 3))
  }
  if (declaration.anchor === 'road-wall-offset') {
    return hexUtilsAdd(input.pieceCoords, negativeDirection(input.rotation + 4))
  }
  return input.pieceCoords
}

export function getPieceFeatureIds(
  input: PieceFeatureInput | BoardPieceFeatureInput,
): PieceFeatureResult | null {
  const pieceID = 'pieceID' in input ? input.pieceID : input.inventoryID
  const declaration: PieceFeatureDeclaration | undefined =
    pieceFeatureDeclarations[pieceID as keyof typeof pieceFeatureDeclarations]
  if (
    !declaration ||
    !isAllowedRotation(input.rotation, declaration.rotation)
  ) {
    return null
  }

  const featureIds: PieceFeatureId[] = []
  if (declaration.source === 'pillar-ports') {
    for (const port of getPillarPorts(pieceID, input.rotation)) {
      featureIds.push(
        Number.isInteger(port)
          ? edgeIdFromHex(input.pieceCoords, port)
          : nodeIdFromHexRotation(input.pieceCoords, port),
      )
    }
  } else {
    const anchor = getAttachmentAnchor(input, declaration)
    if (
      declaration.featureKinds.includes('edge') &&
      Number.isInteger(input.rotation)
    ) {
      featureIds.push(
        edgeIdFromHex(
          anchor,
          declaration.anchor === 'battlement-offset'
            ? input.rotation + 3
            : input.rotation,
        ),
      )
    } else if (declaration.featureKinds.includes('node')) {
      featureIds.push(nodeIdFromHexRotation(anchor, input.rotation))
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

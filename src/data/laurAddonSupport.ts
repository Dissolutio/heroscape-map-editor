import type { BoardPiece, BoardPieces, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import {
  type HexFeatureId,
  edgeIdFromHex,
  nodeIdFromHexRotation,
} from './hexGrid/edgesAndNodes'
import { getPillarPortFeatures } from './laurPillarPorts'

export type LaurAddonSupport = 'supported' | 'unsupported'
export type LaurAddonSupportBoard = { boardPieces: BoardPieces }

type RequiredPort = {
  coords: CubeCoordinate
  featureId: HexFeatureId
}

type PillarPortIndex = Map<number, Map<HexFeatureId, CubeCoordinate[]>>

const squarePillars = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
])
const shortBridges = new Set<string>([
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
])
const longBridges = new Set<string>([
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
])
const ruins = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
])

const mod6 = (rotation: number) => ((rotation % 6) + 6) % 6
const featureIdForPort = (coords: CubeCoordinate, rotation: number) =>
  Number.isInteger(rotation)
    ? edgeIdFromHex(coords, rotation)
    : nodeIdFromHexRotation(coords, rotation)
const sameCoords = (first: CubeCoordinate, second: CubeCoordinate) =>
  first.q === second.q && first.r === second.r && first.s === second.s

function getRequiredPorts(addon: BoardPiece): RequiredPort[] | null {
  const rotation = mod6(addon.rotation)
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) {
    return null
  }

  if (shortBridges.has(addon.inventoryID)) {
    if (!Number.isInteger(rotation)) return null
    const direction = rotation
    const farCoords = hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[direction])
    return [
      {
        coords: addon.pieceCoords,
        featureId: featureIdForPort(addon.pieceCoords, rotation),
      },
      {
        coords: farCoords,
        featureId: featureIdForPort(farCoords, mod6(direction + 3)),
      },
    ]
  }

  if (longBridges.has(addon.inventoryID)) {
    if (Number.isInteger(rotation)) return null
    const direction = Math.floor(rotation)
    const farCoords = hexUtilsAdd(
      hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[direction]),
      HEX_DIRECTIONS[(direction + 1) % 6],
    )
    return [
      {
        coords: addon.pieceCoords,
        featureId: featureIdForPort(addon.pieceCoords, rotation),
      },
      {
        coords: farCoords,
        featureId: featureIdForPort(farCoords, mod6(rotation + 3)),
      },
    ]
  }

  if (ruins.has(addon.inventoryID)) {
    return [
      {
        coords: addon.pieceCoords,
        featureId: featureIdForPort(addon.pieceCoords, rotation),
      },
    ]
  }

  return null
}

function buildPillarPortIndex(boardPieces: BoardPieces): PillarPortIndex {
  const portsByAltitude: PillarPortIndex = new Map()
  for (const piece of boardPieces) {
    if (
      !squarePillars.has(piece.inventoryID) &&
      piece.inventoryID !== Pieces.laurWallTrianglePillar
    ) {
      continue
    }
    const ports = getPillarPortFeatures(
      piece.inventoryID,
      piece.pieceCoords,
      piece.rotation,
    )
    if (!ports.length) continue
    const portsAtAltitude =
      portsByAltitude.get(piece.altitude) ??
      new Map<HexFeatureId, CubeCoordinate[]>()
    for (const { featureId } of ports) {
      const providers = portsAtAltitude.get(featureId) ?? []
      providers.push(piece.pieceCoords)
      portsAtAltitude.set(featureId, providers)
    }
    portsByAltitude.set(piece.altitude, portsAtAltitude)
  }
  return portsByAltitude
}

function supportedByIndex(addon: BoardPiece, portsByLocation: PillarPortIndex) {
  const requiredPorts = getRequiredPorts(addon)
  if (!requiredPorts) return false
  return requiredPorts.every(({ coords, featureId }) =>
    portsByLocation
      .get(addon.altitude)
      ?.get(featureId)
      ?.some((providerCoords) => sameCoords(providerCoords, coords)),
  )
}

export function isLaurAddonSupported(
  board: LaurAddonSupportBoard,
  addonPiece: BoardPiece,
): LaurAddonSupport {
  const portsByLocation = buildPillarPortIndex(board.boardPieces)
  return supportedByIndex(addonPiece, portsByLocation)
    ? 'supported'
    : 'unsupported'
}

export function getUnsupportedLaurAddonUIDs(
  board: LaurAddonSupportBoard,
): string[] {
  const portsByLocation = buildPillarPortIndex(board.boardPieces)
  return board.boardPieces
    .filter((piece) => isLaurWallAddonPieceID(piece.inventoryID))
    .filter((piece) => !supportedByIndex(piece, portsByLocation))
    .map(({ uid }) => uid)
}

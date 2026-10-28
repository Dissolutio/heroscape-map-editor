import type { BoardPiece, BoardPieces, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { getPillarPorts } from './laurPillarPorts'

export type LaurAddonSupport = 'supported' | 'unsupported'
export type LaurAddonSupportBoard = { boardPieces: BoardPieces }

type RequiredPort = {
  coords: CubeCoordinate
  rotation: number
}

type PillarPortIndex = Map<string, Set<number>>

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
const locationKey = (coords: CubeCoordinate, altitude: number) =>
  `${coords.q},${coords.r},${coords.s}@${altitude}`

function getRequiredPorts(addon: BoardPiece): RequiredPort[] | null {
  const rotation = mod6(addon.rotation)
  if (!Number.isFinite(rotation) || !Number.isInteger(rotation * 2)) {
    return null
  }

  if (shortBridges.has(addon.inventoryID)) {
    if (!Number.isInteger(rotation)) return null
    const direction = rotation
    return [
      { coords: addon.pieceCoords, rotation },
      {
        coords: hexUtilsAdd(addon.pieceCoords, HEX_DIRECTIONS[direction]),
        rotation: mod6(direction + 3),
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
      { coords: addon.pieceCoords, rotation },
      { coords: farCoords, rotation: mod6(rotation + 3) },
    ]
  }

  if (ruins.has(addon.inventoryID)) {
    return [{ coords: addon.pieceCoords, rotation }]
  }

  return null
}

function buildPillarPortIndex(boardPieces: BoardPieces): PillarPortIndex {
  const portsByLocation: PillarPortIndex = new Map()
  for (const piece of boardPieces) {
    if (
      !squarePillars.has(piece.inventoryID) &&
      piece.inventoryID !== Pieces.laurWallTrianglePillar
    ) {
      continue
    }
    const ports = getPillarPorts(piece.inventoryID, piece.rotation)
    if (!ports.length) continue
    const key = locationKey(piece.pieceCoords, piece.altitude)
    const current = portsByLocation.get(key) ?? new Set<number>()
    for (const port of ports) current.add(port)
    portsByLocation.set(key, current)
  }
  return portsByLocation
}

function supportedByIndex(addon: BoardPiece, portsByLocation: PillarPortIndex) {
  const requiredPorts = getRequiredPorts(addon)
  if (!requiredPorts) return false
  return requiredPorts.every(({ coords, rotation }) =>
    portsByLocation.get(locationKey(coords, addon.altitude))?.has(rotation),
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

import type { BoardPiece, BoardPieces, CubeCoordinate } from '../types'
import type { HexFeatureId } from './hexGrid/edgesAndNodes'
import { getPillarPortFeatures } from './laurPillarPorts'
import {
  type PortFamily,
  getPortAddon,
  getPortAddonEnds,
  getPortPillar,
  isPortAddonPieceID,
} from './portPieces'

/**
 * Support for every port add-on (Laur walls and ruins, the Deflector
 * Shield): each port it needs must be offered, at its altitude, by a pillar
 * of its own family in the right hex. The ports come from portPieces.ts.
 */
export type LaurAddonSupport = 'supported' | 'unsupported'
export type LaurAddonSupportBoard = { boardPieces: BoardPieces }

type PortProvider = { coords: CubeCoordinate; family: PortFamily }
type PillarPortIndex = Map<number, Map<HexFeatureId, PortProvider[]>>

const sameCoords = (first: CubeCoordinate, second: CubeCoordinate) =>
  first.q === second.q && first.r === second.r && first.s === second.s

function buildPillarPortIndex(boardPieces: BoardPieces): PillarPortIndex {
  const portsByAltitude: PillarPortIndex = new Map()
  for (const piece of boardPieces) {
    const pillar = getPortPillar(piece.inventoryID)
    if (!pillar) continue
    const ports = getPillarPortFeatures(
      piece.inventoryID,
      piece.pieceCoords,
      piece.rotation,
    )
    if (!ports.length) continue
    const portsAtAltitude =
      portsByAltitude.get(piece.altitude) ??
      new Map<HexFeatureId, PortProvider[]>()
    for (const { featureId } of ports) {
      const providers = portsAtAltitude.get(featureId) ?? []
      providers.push({ coords: piece.pieceCoords, family: pillar.family })
      portsAtAltitude.set(featureId, providers)
    }
    portsByAltitude.set(piece.altitude, portsAtAltitude)
  }
  return portsByAltitude
}

function supportedByIndex(addon: BoardPiece, portsByLocation: PillarPortIndex) {
  const family = getPortAddon(addon.inventoryID)?.family
  const requiredPorts = getPortAddonEnds(addon)
  if (!family || !requiredPorts) return false
  return requiredPorts.every(({ coords, featureId }) =>
    portsByLocation
      .get(addon.altitude)
      ?.get(featureId)
      ?.some(
        (provider) =>
          provider.family === family && sameCoords(provider.coords, coords),
      ),
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
    .filter((piece) => isPortAddonPieceID(piece.inventoryID))
    .filter((piece) => !supportedByIndex(piece, portsByLocation))
    .map(({ uid }) => uid)
}

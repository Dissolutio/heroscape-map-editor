/**
 * Physical Laur add-on footprint data used by conflict evaluation. Add-ons
 * remain boardPieces-only; these hexes describe their pillar attachment ends
 * and the neighboring hexes their models block.
 */
import type { CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { piecesSoFar } from './pieces'

const shortWalls = new Set<string>([
  Pieces.laurWallShort,
  Pieces.laurWallShortStackable,
])
const longWalls = new Set<string>([
  Pieces.laurWallLong,
  Pieces.laurWallLongStackable,
  Pieces.laurWallArch,
])
const ruins = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
])

export type LaurAddonFootprint = {
  /** Pillar hexes the add-on clips onto. */
  endHexes: CubeCoordinate[]
  /** Non-end hexes physically blocked by the add-on. */
  blockedHexes: CubeCoordinate[]
  /** The add-on's altitude, as given by its BoardPiece. */
  altitude: number
  /** The registered piece height, in levels. */
  heightInLevels: number
}

/**
 * Return the registered physical footprint for a Laur wall add-on, or null
 * for an unsupported piece, invalid rotation, or missing registered height.
 * Integer directions select a side; half-step directions select a vertex.
 */
export function getLaurAddonFootprint({
  inventoryID,
  anchor,
  altitude,
  rotation,
}: {
  inventoryID: string
  anchor: CubeCoordinate
  altitude: number
  rotation: number
}): LaurAddonFootprint | null {
  if (
    !shortWalls.has(inventoryID) &&
    !longWalls.has(inventoryID) &&
    !ruins.has(inventoryID)
  ) {
    return null
  }
  if (!Number.isFinite(rotation)) return null

  const halfSteps = rotation * 2
  if (!Number.isInteger(halfSteps)) return null
  const normalizedHalfSteps = ((halfSteps % 12) + 12) % 12
  const normalizedRotation = normalizedHalfSteps / 2
  const isHalfStep = normalizedHalfSteps % 2 === 1
  if (shortWalls.has(inventoryID) && isHalfStep) return null
  if (longWalls.has(inventoryID) && !isHalfStep) return null

  const heightInLevels = piecesSoFar[inventoryID]?.height
  if (heightInLevels === undefined) return null

  const direction = Math.floor(normalizedRotation)
  const firstNeighbor = hexUtilsAdd(anchor, HEX_DIRECTIONS[direction])

  if (shortWalls.has(inventoryID)) {
    return {
      endHexes: [anchor, firstNeighbor],
      blockedHexes: [],
      altitude,
      heightInLevels,
    }
  }

  if (longWalls.has(inventoryID)) {
    const secondNeighbor = hexUtilsAdd(
      anchor,
      HEX_DIRECTIONS[(direction + 1) % 6],
    )
    return {
      endHexes: [
        anchor,
        hexUtilsAdd(firstNeighbor, HEX_DIRECTIONS[(direction + 1) % 6]),
      ],
      blockedHexes: [firstNeighbor, secondNeighbor],
      altitude,
      heightInLevels,
    }
  }

  const blockedHexes = isHalfStep
    ? [firstNeighbor, hexUtilsAdd(anchor, HEX_DIRECTIONS[(direction + 1) % 6])]
    : [firstNeighbor]
  return {
    endHexes: [anchor],
    blockedHexes,
    altitude,
    heightInLevels,
  }
}

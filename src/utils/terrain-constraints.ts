import { piecesSoFar } from '../data/pieces'
import { terrainSetsByShortID } from '../data/terrainSets'
import type { PieceInventory, TerrainConstraintSource } from '../types'
import { normalizePieceInventory } from './piece-inventory'

export function getSetConstrainedInventory(setsUsed?: string[]) {
  return (setsUsed ?? []).reduce<Record<string, number>>((acc, setID) => {
    const set = terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
    if (!set?.inventory) {
      return acc
    }

    for (const [pieceID, count] of Object.entries(set.inventory)) {
      acc[pieceID] = (acc[pieceID] ?? 0) + Number(count)
    }

    return acc
  }, {})
}

export function getEffectiveTerrainConstraintInventory({
  setsUsed,
  terrainConstraintSource,
  customConstraintInventory,
  userPieceInventory,
}: {
  setsUsed?: string[]
  terrainConstraintSource?: TerrainConstraintSource
  customConstraintInventory?: PieceInventory | null
  userPieceInventory?: PieceInventory
}) {
  switch (terrainConstraintSource) {
    case 'setsUsed':
      return getSetConstrainedInventory(setsUsed)
    case 'personalInventory':
      return normalizePieceInventory(userPieceInventory)
    case 'inventoryFile':
      return normalizePieceInventory(customConstraintInventory)
    default:
      return {}
  }
}

export function hasActiveTerrainConstraints({
  setsUsed,
  terrainConstraintSource,
  customConstraintInventoryFileName,
}: {
  setsUsed?: string[]
  terrainConstraintSource?: TerrainConstraintSource
  customConstraintInventoryFileName?: string
}) {
  switch (terrainConstraintSource) {
    case 'setsUsed':
      return (setsUsed ?? []).length > 0
    case 'personalInventory':
      return true
    case 'inventoryFile':
      return Boolean(customConstraintInventoryFileName)
    default:
      return false
  }
}

export function getAvailableLandPrefixesForInventory(
  constrainedInventory?: PieceInventory,
) {
  const prefixes = new Set<string>()

  for (const [pieceID, count] of Object.entries(constrainedInventory ?? {})) {
    if (count <= 0) {
      continue
    }

    const landPrefix = piecesSoFar[pieceID]?.landPrefix
    if (landPrefix) {
      prefixes.add(landPrefix)
    }
  }

  return prefixes
}

export function getAvailableLandPrefixesForSets(setsUsed?: string[]) {
  return getAvailableLandPrefixesForInventory(getSetConstrainedInventory(setsUsed))
}

export function getConstrainedLandInventoryByTerrainAndSizeFromInventory(
  constrainedInventory?: PieceInventory,
) {
  const lookup = new Map<string, Map<number, string>>()

  for (const [pieceID, count] of Object.entries(constrainedInventory ?? {})) {
    if ((count ?? 0) <= 0) {
      continue
    }

    const piece = piecesSoFar[pieceID]
    if (!piece?.isHexTerrainPiece || !piece.terrain) {
      continue
    }

    if (!lookup.has(piece.terrain)) {
      lookup.set(piece.terrain, new Map<number, string>())
    }

    lookup.get(piece.terrain)?.set(piece.size, piece.id)
  }

  return lookup
}

export function getConstrainedLandInventoryByTerrainAndSize(
  setsUsed?: string[],
) {
  return getConstrainedLandInventoryByTerrainAndSizeFromInventory(
    getSetConstrainedInventory(setsUsed),
  )
}

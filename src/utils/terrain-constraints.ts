import { piecesSoFar } from '../data/pieces'
import { terrainSetsByShortID } from '../data/terrainSets'

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

export function getAvailableLandPrefixesForSets(setsUsed?: string[]) {
  const prefixes = new Set<string>()

  for (const [pieceID, count] of Object.entries(
    getSetConstrainedInventory(setsUsed),
  )) {
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
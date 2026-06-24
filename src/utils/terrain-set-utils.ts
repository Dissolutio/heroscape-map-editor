import { terrainSetsByShortID } from '../data/terrainSets'

export type TerrainSet =
  (typeof terrainSetsByShortID)[keyof typeof terrainSetsByShortID]

type TerrainSetEra = TerrainSet['era']

// Keep the UI ordering rules in one place so every terrain set picker stays consistent.
const terrainSetTypeOrder: Record<TerrainSet['setType'], number> = {
  'Master Set': 0,
  'Battle Box': 1,
  'Terrain Expansion': 2,
}

// Some release dates are month/year and some are just year, so normalize both to a
// single sortable number before comparing them.
const getReleaseDateSortValue = (releaseDate: string): number => {
  const monthYearMatch = releaseDate.match(/^(\d{2})\/(\d{4})$/)
  if (monthYearMatch) {
    const month = Number.parseInt(monthYearMatch[1], 10)
    const year = Number.parseInt(monthYearMatch[2], 10)
    return year * 12 + month
  }

  const yearMatch = releaseDate.match(/^(\d{4})$/)
  if (yearMatch) {
    const year = Number.parseInt(yearMatch[1], 10)
    return year * 12 + 1
  }

  return Number.MAX_SAFE_INTEGER
}

export const getSortedTerrainSets = (): TerrainSet[] => {
  return Object.values(terrainSetsByShortID).sort((setA, setB) => {
    const setTypeA = terrainSetTypeOrder[setA.setType]
    const setTypeB = terrainSetTypeOrder[setB.setType]
    if (setTypeA !== setTypeB) {
      return setTypeA - setTypeB
    }

    const releaseDateA = getReleaseDateSortValue(setA.releaseDate)
    const releaseDateB = getReleaseDateSortValue(setB.releaseDate)
    if (releaseDateA !== releaseDateB) {
      return releaseDateA - releaseDateB
    }

    return setA.name.localeCompare(setB.name)
  })
}

export const getTerrainSetsForEra = (era: TerrainSetEra): TerrainSet[] => {
  return getSortedTerrainSets().filter((terrainSet) => terrainSet.era === era)
}

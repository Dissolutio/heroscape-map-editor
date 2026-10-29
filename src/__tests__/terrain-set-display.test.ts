import { describe, expect, it } from 'vitest'
import { terrainSetsByShortID } from '../data/terrainSets'
import { getRequiredTerrainText, getSetsUsedText } from '../utils/map-utils'

describe('terrain set display names', () => {
  it('uses full names in the sets-used summary', () => {
    expect(getSetsUsedText(['J', 'J', 'C'])).toBe(
      'Swamps of Valhalla x2, Age of Annihilation x1',
    )
  })

  it('never includes terrain set abbreviations in required terrain text', () => {
    const setsUsed = Object.values(terrainSetsByShortID).map((set) => set.id)
    const requiredTerrainText = getRequiredTerrainText(setsUsed)

    for (const set of Object.values(terrainSetsByShortID)) {
      expect(requiredTerrainText).not.toContain(set.abbreviation)
    }
  })

  it('includes the full name, set type, and count in required terrain text', () => {
    const set = terrainSetsByShortID.J

    expect(getRequiredTerrainText([set.id, set.id])).toBe(
      `${set.name} ${set.setType} (x2)`,
    )
  })
})

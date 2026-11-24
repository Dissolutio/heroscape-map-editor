import { describe, expect, it } from 'vitest'
import { getConvertTerrainAvailability } from '../controls/convertTerrainAvailability'
import type { BoardPiece } from '../types'
import { Pieces } from '../types'

const piece: BoardPiece = {
  uid: 'grass',
  inventoryID: Pieces.grass1,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q: 0, r: 0, s: 0 },
}

const baseInput = {
  boardPieces: [piece],
  selectedPieceIDs: [] as string[],
  setsUsed: [],
  terrainConstraintSource: 'none' as const,
  customConstraintInventory: {},
  customConstraintInventoryFileName: '',
  userPieceInventory: {},
  compact: false,
}

describe('convert terrain availability', () => {
  it('uses the card reason when the selection has no eligible pieces', () => {
    const availability = getConvertTerrainAvailability(baseInput)

    expect(availability.isDisabled).toBe(true)
    expect(availability.disabledMessage).toBe('No eligible pieces selected')
  })

  it('enables conversion when a selected piece has available terrain options', () => {
    const availability = getConvertTerrainAvailability({
      ...baseInput,
      selectedPieceIDs: ['grass'],
    })

    expect(availability.isDisabled).toBe(false)
    expect(availability.availableTerrains.length).toBeGreaterThan(0)
  })

  it('reports the constrained-options reason used by the card', () => {
    const availability = getConvertTerrainAvailability({
      ...baseInput,
      selectedPieceIDs: ['grass'],
      terrainConstraintSource: 'inventoryFile',
      customConstraintInventoryFileName: 'empty-inventory.csv',
    })

    expect(availability.isDisabled).toBe(true)
    expect(availability.disabledMessage).toBe(
      'No constrained terrain options available',
    )
  })
})

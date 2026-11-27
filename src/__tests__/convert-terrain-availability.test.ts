import { describe, expect, it } from 'vitest'
import { getConvertTerrainAvailability } from '../controls/convertTerrainAvailability'
import { getVoidMatHexes } from '../data/voidMat'
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

  it('offers Void Mat conversions when VC is enabled or already present', () => {
    const mat: BoardPiece = {
      ...piece,
      uid: 'void-mat',
      inventoryID: Pieces.voidMat,
    }
    const matAvailability = getConvertTerrainAvailability({
      ...baseInput,
      boardPieces: [mat],
      selectedPieceIDs: [mat.uid],
    })
    expect(matAvailability.canConvertVoidMatToMarkers).toBe(true)
    expect(matAvailability.shouldRender).toBe(true)
    expect(matAvailability.isDisabled).toBe(false)

    const markers = getVoidMatHexes(mat).map((pieceCoords, index) => ({
      ...mat,
      uid: `marker-${index}`,
      inventoryID: Pieces.voidMarker,
      pieceCoords,
    }))
    const markerAvailability = getConvertTerrainAvailability({
      ...baseInput,
      boardPieces: markers,
      selectedPieceIDs: markers.map((marker) => marker.uid),
    })
    expect(markerAvailability.canConvertVoidMarkersToMat).toBe(true)
    expect(markerAvailability.voidMatLayoutForMarkers).toBeDefined()

    const disabledAvailability = getConvertTerrainAvailability({
      ...baseInput,
      boardPieces: [mat],
      selectedPieceIDs: [mat.uid],
      includeVCContent: false,
    })
    expect(disabledAvailability.canConvertVoidMatToMarkers).toBe(true)
  })

  it('does not offer Void Mat conversion for incomplete or mismatched markers', () => {
    const mat: BoardPiece = {
      ...piece,
      uid: 'void-mat',
      inventoryID: Pieces.voidMat,
    }
    const markers = getVoidMatHexes(mat).map((pieceCoords, index) => ({
      ...mat,
      uid: `marker-${index}`,
      inventoryID: Pieces.voidMarker,
      pieceCoords,
    }))
    for (const selection of [
      markers.slice(0, 13),
      [
        ...markers.slice(0, 13),
        {
          ...markers[13],
          pieceCoords: { q: 20, r: 0, s: -20 },
        },
      ],
    ]) {
      const availability = getConvertTerrainAvailability({
        ...baseInput,
        boardPieces: selection,
        selectedPieceIDs: selection.map((marker) => marker.uid),
      })
      expect(availability.canConvertVoidMarkersToMat).toBe(false)
    }
  })
})

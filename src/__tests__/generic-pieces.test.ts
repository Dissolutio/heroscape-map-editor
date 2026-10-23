import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { pieceGroups } from '../data/pieceGroups'
import { terrainSetsByShortID } from '../data/terrainSets'
import { blankPieceInventory } from '../inventory/blankInventory'
import { countPiecesUsedWithLaurStacking } from '../inventory/laurInventoryReconcile'
import {
  GENERIC_PIECE_IDS,
  HexTerrain,
  isGenericPieceID,
  PiecePrefixes,
  Pieces,
} from '../types'
import {
  getAvailableLandPrefixesForInventory,
  getEffectiveTerrainConstraintInventory,
  getSetConstrainedInventory,
} from '../utils/terrain-constraints'
import { normalizePieceInventory } from '../utils/piece-inventory'
import { isFluidTerrainHex, isSolidTerrainHex } from '../utils/board-utils'
import { getBuriedTileMarks } from '../utils/tileMarks'
import { makeTable, place } from './helpers/board'

const genericSolidIDs = [
  Pieces.generic1,
  Pieces.generic2,
  Pieces.generic3,
  Pieces.generic7,
  Pieces.generic24,
]

const genericFluidIDs = [
  Pieces.genericFluid1,
  Pieces.genericFluid2,
  Pieces.genericFluid3,
  Pieces.genericFluid7,
  Pieces.genericFluid24,
]

describe('Generic terrain pieces', () => {
  it('registers both land families with the expected templates and heights', () => {
    for (const [ids, terrain, height, prefix] of [
      [genericSolidIDs, HexTerrain.generic, 1, PiecePrefixes.generic],
      [genericFluidIDs, HexTerrain.genericFluid, 0, PiecePrefixes.genericFluid],
    ] as const) {
      for (const id of ids) {
        const piece = piecesSoFar[id]
        expect(piece).toMatchObject({
          id,
          terrain,
          landPrefix: prefix,
          isHexTerrainPiece: true,
          isObstaclePiece: false,
          isUninventoried: true,
          size: Number(id.match(/\d+/)?.[0]),
          template: id.match(/\d+/)?.[0],
          height,
        })
      }
    }
    expect(
      genericSolidIDs.every((id) => isSolidTerrainHex(piecesSoFar[id].terrain)),
    ).toBe(true)
    expect(
      genericFluidIDs.every((id) => isFluidTerrainHex(piecesSoFar[id].terrain)),
    ).toBe(true)
  })

  it.each(GENERIC_PIECE_IDS)('places %s on the table', (pieceID) => {
    const table = makeTable()
    const result = place({
      board: table,
      pieceID,
      at: table.center,
      altitude: 0,
    })

    expect(result.error).toBeUndefined()
    expect(result.board.boardPieces).toHaveLength(1)
  })

  it('allows solid pieces to stack on solid terrain', () => {
    const table = makeTable()
    const lower = place({
      board: table,
      pieceID: Pieces.generic1,
      at: table.center,
      altitude: 0,
    })
    const upper = place({
      board: lower.board,
      pieceID: Pieces.generic1,
      at: table.center,
      altitude: 1,
    })

    expect(lower.error).toBeUndefined()
    expect(upper.error).toBeUndefined()
    expect(upper.board.boardPieces).toHaveLength(2)
  })

  it('allows fluid pieces to stack on fluid terrain', () => {
    const table = makeTable()
    const lower = place({
      board: table,
      pieceID: Pieces.genericFluid1,
      at: table.center,
      altitude: 0,
    })
    const upper = place({
      board: lower.board,
      pieceID: Pieces.genericFluid1,
      at: table.center,
      altitude: 1,
    })

    expect(lower.error).toBeUndefined()
    expect(upper.error).toBeUndefined()
    expect(upper.board.boardPieces).toHaveLength(2)
  })

  it('treats solid and fluid Generic pieces as land for buried marks', () => {
    for (const inventoryID of GENERIC_PIECE_IDS) {
      expect(
        getBuriedTileMarks(
          {
            uid: inventoryID,
            inventoryID,
            altitude: 0,
            rotation: 0,
            pieceCoords: { q: 0, r: 0, s: 0 },
          },
          {
            isBuried: true,
            isSubterrainBuried: true,
            isPartiallyBuried: false,
          },
        ),
      ).toBe('*†')
    }
  })

  it('does not put Generic pieces in finite inventory or required-set usage', () => {
    expect(GENERIC_PIECE_IDS.every((id) => !(id in blankPieceInventory))).toBe(
      true,
    )
    for (const set of Object.values(terrainSetsByShortID)) {
      for (const id of GENERIC_PIECE_IDS) {
        expect(set.inventory).not.toHaveProperty(id)
      }
    }
    for (const setID of Object.keys(terrainSetsByShortID)) {
      const inventory = getSetConstrainedInventory([setID])
      for (const id of GENERIC_PIECE_IDS) {
        expect(inventory).not.toHaveProperty(id)
      }
    }
    const usage = countPiecesUsedWithLaurStacking(
      GENERIC_PIECE_IDS.map((inventoryID) => ({
        uid: inventoryID,
        inventoryID,
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 0, r: 0, s: 0 },
      })),
    )
    expect(GENERIC_PIECE_IDS.some((id) => id in usage)).toBe(false)
    expect(
      getAvailableLandPrefixesForInventory({}).has(PiecePrefixes.generic),
    ).toBe(true)
    expect(
      getAvailableLandPrefixesForInventory({}).has(PiecePrefixes.genericFluid),
    ).toBe(true)
    const personalInventory = getEffectiveTerrainConstraintInventory({
      terrainConstraintSource: 'personalInventory',
      userPieceInventory: normalizePieceInventory({}),
    })
    for (const id of GENERIC_PIECE_IDS) {
      expect(personalInventory).not.toHaveProperty(id)
    }
    const availablePrefixes =
      getAvailableLandPrefixesForInventory(personalInventory)
    expect(availablePrefixes.has(PiecePrefixes.generic)).toBe(true)
    expect(availablePrefixes.has(PiecePrefixes.genericFluid)).toBe(true)
    expect(GENERIC_PIECE_IDS.every(isGenericPieceID)).toBe(true)
  })

  it('shows all Generic pieces in the placed-pieces group', () => {
    expect(
      pieceGroups.find((group) => group.label === 'Generic')?.pieces,
    ).toEqual(GENERIC_PIECE_IDS)
  })
})

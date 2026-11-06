import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import type { BoardPiece, HexMap } from '../types'
import { HexTerrain, Pieces } from '../types'
import {
  analyzeMapTerrain,
  buildCollectionAdaptationMapping,
  getCollectionLandSupply,
  getMissingLandTerrains,
  getRemainingLandShortfalls,
  suggestBuriedFillTerrain,
  suggestTerrainTarget,
} from '../utils/adaptToCollection'

const hexMap: HexMap = {
  id: 'adapt-to-collection',
  name: 'Adapt to collection',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 8,
  length: 8,
}

const at = (q: number, r: number) => ({ q, r, s: -q - r })
const piece = (
  uid: string,
  inventoryID: string,
  q: number,
  r: number,
  altitude = 0,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude,
  rotation: 0,
  pieceCoords: at(q, r),
})

const map = (boardPieces: BoardPiece[]) =>
  buildupJsonFileMap(boardPieces, hexMap)

describe('collection land supply and suggestions', () => {
  it('uses the personal inventory and suggests generic by solid/fluid kind', () => {
    const empty = getCollectionLandSupply({})
    expect(empty.hasAnyPieces).toBe(false)
    expect(suggestTerrainTarget(HexTerrain.snow, empty)).toBe(
      HexTerrain.generic,
    )
    expect(suggestTerrainTarget(HexTerrain.ice, empty)).toBe(
      HexTerrain.genericFluid,
    )
    expect(suggestBuriedFillTerrain(empty, false)).toBe(HexTerrain.generic)
    expect(suggestBuriedFillTerrain(empty, true)).toBe(HexTerrain.genericFluid)
  })

  it('keeps owned terrain by default and uses the editable similarity ranking', () => {
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.toxic1]: 2,
      [Pieces.water1]: 3,
    })
    expect(suggestTerrainTarget(HexTerrain.grass, supply)).toBe(
      HexTerrain.grass,
    )
    expect(suggestTerrainTarget(HexTerrain.lavaField, supply)).toBe(
      HexTerrain.toxic,
    )
    expect(suggestBuriedFillTerrain(supply, false)).toBe(HexTerrain.grass)
    expect(suggestBuriedFillTerrain(supply, true)).toBe(HexTerrain.water)
  })

  it('falls back to the owned terrain with the most same-kind hex supply', () => {
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.rock3]: 4,
      [Pieces.water1]: 2,
      [Pieces.swampWater3]: 3,
    })
    expect(suggestTerrainTarget(HexTerrain.dungeon, supply)).toBe(
      HexTerrain.rock,
    )
    expect(suggestTerrainTarget(HexTerrain.ice, supply)).toBe(HexTerrain.water)
  })

  it('defaults buried fill to Grass, then the best owned terrain, then Generic', () => {
    expect(
      suggestBuriedFillTerrain(
        getCollectionLandSupply({ [Pieces.grass1]: 1, [Pieces.rock1]: 9 }),
        false,
      ),
    ).toBe(HexTerrain.grass)
    expect(
      suggestBuriedFillTerrain(
        getCollectionLandSupply({ [Pieces.rock1]: 1, [Pieces.sand3]: 2 }),
        false,
      ),
    ).toBe(HexTerrain.sand)
  })
})

describe('map analysis and adaptation mapping', () => {
  const landPieces = [
    piece('surface-snow', Pieces.snow1, 1, 1),
    piece('buried-snow', Pieces.snow1, 3, 1),
    piece('snow-cover', Pieces.grass1, 3, 1, 1),
    piece('fluid-ice', Pieces.ice1, 5, 1),
    piece('tree', Pieces.tree10, 7, 1),
  ]

  it('counts surface and buried hexes using buried marks status', () => {
    const { boardHexes, boardPieces } = map(landPieces)
    expect(analyzeMapTerrain(boardHexes, boardPieces)).toEqual([
      { terrain: HexTerrain.grass, surfaceHexes: 1, buriedHexes: 0 },
      { terrain: HexTerrain.ice, surfaceHexes: 1, buriedHexes: 0 },
      { terrain: HexTerrain.snow, surfaceHexes: 1, buriedHexes: 1 },
    ])
  })

  it('maps whole columns and surface-only pieces independently by UID', () => {
    const { boardHexes, boardPieces } = map(landPieces)
    const supply = getCollectionLandSupply({
      [Pieces.rock1]: 2,
      [Pieces.grass1]: 4,
      [Pieces.water1]: 2,
    })
    const choices = {
      [HexTerrain.snow]: {
        targetTerrain: HexTerrain.rock,
        scope: 'wholeColumn' as const,
      },
    }

    expect(
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices,
        buriedFillByKind: { solid: HexTerrain.grass, fluid: HexTerrain.water },
      }),
    ).toEqual({
      'surface-snow': Pieces.rock1,
      'buried-snow': Pieces.rock1,
    })

    expect(
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices: {
          [HexTerrain.snow]: {
            targetTerrain: HexTerrain.rock,
            scope: 'surfaceOnly',
          },
        },
        buriedFillByKind: { solid: HexTerrain.grass, fluid: HexTerrain.water },
      }),
    ).toEqual({
      'surface-snow': Pieces.rock1,
      'buried-snow': Pieces.grass1,
    })
  })

  it('converts a partially buried footprint as one surface piece', () => {
    const boardPieces = [
      piece('partial-snow', Pieces.snow3, 3, 2),
      piece('partial-cover', Pieces.grass1, 3, 2, 1),
    ]
    const { boardHexes } = map(boardPieces)
    const supply = getCollectionLandSupply({ [Pieces.rock3]: 1 })

    expect(analyzeMapTerrain(boardHexes, boardPieces)).toEqual([
      { terrain: HexTerrain.grass, surfaceHexes: 1, buriedHexes: 0 },
      { terrain: HexTerrain.snow, surfaceHexes: 3, buriedHexes: 0 },
    ])
    expect(
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices: {
          [HexTerrain.snow]: {
            targetTerrain: HexTerrain.rock,
            scope: 'surfaceOnly',
          },
        },
        buriedFillByKind: { solid: HexTerrain.grass, fluid: HexTerrain.water },
      }),
    ).toEqual({ 'partial-snow': Pieces.rock3 })
  })

  it('never converts between solid and fluid, and leaves non-land pieces untouched', () => {
    const { boardHexes, boardPieces } = map(landPieces)
    const supply = getCollectionLandSupply({
      [Pieces.rock1]: 1,
      [Pieces.water1]: 1,
    })
    expect(
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices: {
          [HexTerrain.snow]: {
            targetTerrain: HexTerrain.water,
            scope: 'wholeColumn',
          },
          [HexTerrain.ice]: {
            targetTerrain: HexTerrain.rock,
            scope: 'wholeColumn',
          },
        },
        buriedFillByKind: {
          solid: HexTerrain.genericFluid,
          fluid: HexTerrain.generic,
        },
      }),
    ).toEqual({})
  })

  it('falls back to same-size Generic, preserving unsupported sizes otherwise', () => {
    const genericFallbackPiece = piece('snow-2', Pieces.snow2, 1, 1)
    const genericFallbackMap = map([genericFallbackPiece])
    const genericFallbackSupply = getCollectionLandSupply({
      [Pieces.rock1]: 1,
    })
    expect(
      buildCollectionAdaptationMapping({
        boardHexes: genericFallbackMap.boardHexes,
        boardPieces: genericFallbackMap.boardPieces,
        supply: genericFallbackSupply,
        choices: {
          [HexTerrain.snow]: {
            targetTerrain: HexTerrain.rock,
            scope: 'wholeColumn',
          },
        },
        buriedFillByKind: { solid: HexTerrain.rock, fluid: HexTerrain.water },
      }),
    ).toEqual({ 'snow-2': Pieces.generic2 })

    const boardPieces = [piece('road-5', Pieces.road5, 1, 1)]
    const { boardHexes } = map(boardPieces)
    const supply = getCollectionLandSupply({ [Pieces.grass1]: 1 })
    expect(
      buildCollectionAdaptationMapping({
        boardHexes,
        boardPieces,
        supply,
        choices: {
          [HexTerrain.road]: {
            targetTerrain: HexTerrain.grass,
            scope: 'wholeColumn',
          },
        },
        buriedFillByKind: { solid: HexTerrain.grass, fluid: HexTerrain.water },
      }),
    ).toEqual({})
    expect(getRemainingLandShortfalls(boardPieces, {})).toEqual([
      { inventoryID: Pieces.road5, shortfall: 1 },
    ])
    expect(
      getMissingLandTerrains(
        [{ terrain: HexTerrain.road, surfaceHexes: 5, buriedHexes: 0 }],
        supply,
      ),
    ).toEqual([HexTerrain.road])
  })
})

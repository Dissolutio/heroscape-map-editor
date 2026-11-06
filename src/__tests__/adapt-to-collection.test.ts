import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import type { BoardPiece, HexMap } from '../types'
import { HexTerrain, Pieces } from '../types'
import {
  analyzeMapTerrain,
  buildCollectionAdaptationPlan,
  getAdaptedMapName,
  getCollectionLandSupply,
  getMissingLandTerrains,
  getRemainingLandShortfalls,
  suggestBuriedFillTerrain,
  suggestTerrainTarget,
  type AdaptScope,
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
const choice = (
  targetTerrains: string[],
  scope: AdaptScope = 'wholeColumn',
) => ({
  targetTerrains,
  scope,
})
const noBuriedFill = { solid: '', fluid: '' }

describe('collection land supply and suggestions', () => {
  it('only lists owned land terrain and never suggests Generic', () => {
    const empty = getCollectionLandSupply({
      [Pieces.generic1]: 20,
      [Pieces.genericFluid1]: 20,
    })
    expect(empty.hasAnyPieces).toBe(false)
    expect(empty.ownedTerrains).toEqual([])
    expect(suggestTerrainTarget(HexTerrain.snow, empty)).toBe('')
    expect(suggestTerrainTarget(HexTerrain.ice, empty)).toBe('')
    expect(suggestBuriedFillTerrain(empty, false)).toBe('')
    expect(suggestBuriedFillTerrain(empty, true)).toBe('')
  })

  it('keeps the existing similarity order and uses the best same-kind fallback', () => {
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.toxic1]: 2,
      [Pieces.water1]: 3,
    })
    expect(suggestTerrainTarget(HexTerrain.lavaField, supply)).toBe(
      HexTerrain.toxic,
    )
    expect(suggestTerrainTarget(HexTerrain.ice, supply)).toBe(HexTerrain.water)
    expect(suggestBuriedFillTerrain(supply, false)).toBe(HexTerrain.grass)
    expect(suggestBuriedFillTerrain(supply, true)).toBe(HexTerrain.water)
  })

  it('defaults solid buried fill to owned Grass, then most same-kind supply', () => {
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

  it('prefills the adapted-map suffix once and handles unnamed maps', () => {
    expect(getAdaptedMapName('Scenario')).toBe(
      'Scenario (Adapted to collection)',
    )
    expect(getAdaptedMapName('Scenario (Adapted to collection)')).toBe(
      'Scenario (Adapted to collection)',
    )
    expect(getAdaptedMapName('')).toBe('Adapted to collection')
  })
})

describe('collection adaptation planning', () => {
  it('lists only missing land terrains and leaves owned and Generic pieces alone', () => {
    const { boardHexes, boardPieces } = map([
      piece('snow', Pieces.snow1, 1, 1),
      piece('grass', Pieces.grass1, 3, 1),
      piece('generic', Pieces.generic1, 5, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.rock1]: 1,
      [Pieces.generic1]: 1,
    })

    expect(
      getMissingLandTerrains(
        analyzeMapTerrain(boardHexes, boardPieces),
        supply,
      ),
    ).toEqual([HexTerrain.snow])
    expect(
      buildCollectionAdaptationPlan({
        boardHexes,
        boardPieces,
        supply,
        choices: { [HexTerrain.snow]: choice([HexTerrain.rock]) },
        buriedFillByKind: noBuriedFill,
      }).mapping,
    ).toEqual({ snow: Pieces.rock1 })
  })

  it('allocates shared stock across rows in stable terrain order', () => {
    const { boardHexes, boardPieces } = map([
      piece('snow', Pieces.snow1, 1, 1),
      piece('swamp', Pieces.swamp1, 3, 1),
    ])
    const supply = getCollectionLandSupply({ [Pieces.grass1]: 1 })
    const terrains = getMissingLandTerrains(
      analyzeMapTerrain(boardHexes, boardPieces),
      supply,
    )
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: {
        [HexTerrain.snow]: choice([HexTerrain.grass]),
        [HexTerrain.swamp]: choice([HexTerrain.grass]),
      },
      buriedFillByKind: noBuriedFill,
    })

    expect(terrains).toEqual([HexTerrain.snow, HexTerrain.swamp])
    expect(plan.mapping).toEqual({ snow: Pieces.grass1 })
    expect(plan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.swamp, size: 1, count: 1 },
    ])
  })

  it('allocates every surface piece before any buried piece', () => {
    const { boardHexes, boardPieces } = map([
      piece('buried-snow', Pieces.snow1, 1, 1),
      piece('cover', Pieces.rock1, 1, 1, 1),
      piece('surface-swamp', Pieces.swamp1, 3, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.rock1]: 1,
    })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: {
        [HexTerrain.snow]: choice([HexTerrain.grass]),
        [HexTerrain.swamp]: choice([HexTerrain.grass]),
      },
      buriedFillByKind: noBuriedFill,
    })

    expect(plan.mapping).toEqual({ 'surface-swamp': Pieces.grass1 })
    expect(plan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.snow, size: 1, count: 1 },
    ])
  })

  it('assigns up to three substitutes and reports size-specific leftovers', () => {
    const { boardHexes, boardPieces } = map([
      piece('snow-a', Pieces.snow1, 1, 1),
      piece('snow-b', Pieces.snow1, 2, 1),
      piece('snow-c', Pieces.snow1, 3, 1),
      piece('snow-d', Pieces.snow1, 4, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.rock1]: 1,
      [Pieces.grass1]: 1,
      [Pieces.sand1]: 1,
    })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: {
        [HexTerrain.snow]: choice([
          HexTerrain.rock,
          HexTerrain.grass,
          HexTerrain.sand,
        ]),
      },
      buriedFillByKind: noBuriedFill,
    })

    expect(plan.mapping).toEqual({
      'snow-a': Pieces.rock1,
      'snow-b': Pieces.grass1,
      'snow-c': Pieces.sand1,
    })
    expect(plan.surfaceCoverageByTerrain[HexTerrain.snow]).toEqual([1, 1, 1])
    expect(plan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.snow, size: 1, count: 1 },
    ])
  })

  it('uses only same-size swaps and leaves unsupported sizes unchanged', () => {
    const { boardHexes, boardPieces } = map([
      piece('snow-3', Pieces.snow3, 1, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.rock1]: 1,
      [Pieces.rock3]: 1,
    })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: { [HexTerrain.snow]: choice([HexTerrain.rock]) },
      buriedFillByKind: noBuriedFill,
    })

    expect(plan.mapping).toEqual({ 'snow-3': Pieces.rock3 })
    expect(plan.unconvertedPieces).toEqual([])

    const shortSupplyPlan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply: getCollectionLandSupply({ [Pieces.rock1]: 1 }),
      choices: { [HexTerrain.snow]: choice([HexTerrain.rock]) },
      buriedFillByKind: noBuriedFill,
    })
    expect(shortSupplyPlan.mapping).toEqual({})
    expect(shortSupplyPlan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.snow, size: 3, count: 1 },
    ])
  })

  it('uses an owned buried fill and shares its quantity with other swaps', () => {
    const { boardHexes, boardPieces } = map([
      piece('buried-snow-a', Pieces.snow1, 1, 1),
      piece('cover', Pieces.rock1, 1, 1, 1),
      piece('buried-snow-b', Pieces.snow1, 3, 1),
      piece('cover-b', Pieces.rock1, 3, 1, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.grass1]: 1,
      [Pieces.rock1]: 2,
    })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: {
        [HexTerrain.snow]: choice([HexTerrain.rock], 'surfaceOnly'),
      },
      buriedFillByKind: {
        solid: HexTerrain.grass,
        fluid: '',
      },
    })

    expect(suggestBuriedFillTerrain(supply, false)).toBe(HexTerrain.grass)
    expect(plan.mapping).toEqual({ 'buried-snow-a': Pieces.grass1 })
    expect(plan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.snow, size: 1, count: 1 },
    ])
    expect(
      getRemainingLandShortfalls(
        [
          piece('cover', Pieces.rock1, 1, 1, 1),
          piece('cover-b', Pieces.rock1, 3, 1, 1),
          piece('buried-snow-after', Pieces.grass1, 1, 1),
        ],
        { [Pieces.grass1]: 1, [Pieces.rock1]: 2 },
      ),
    ).toEqual([])
  })

  it('does not use Generic as a fallback and leaves Generic map pieces unchanged', () => {
    const { boardHexes, boardPieces } = map([
      piece('snow-2', Pieces.snow2, 1, 1),
      piece('generic-map-piece', Pieces.generic1, 3, 1),
    ])
    const supply = getCollectionLandSupply({
      [Pieces.rock1]: 1,
      [Pieces.generic2]: 10,
    })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: { [HexTerrain.snow]: choice([HexTerrain.rock]) },
      buriedFillByKind: { solid: '', fluid: '' },
    })

    expect(supply.ownedTerrains).toEqual([HexTerrain.rock])
    expect(plan.mapping).toEqual({})
    expect(plan.unconvertedPieces).toEqual([
      { terrain: HexTerrain.snow, size: 2, count: 1 },
    ])
  })
})

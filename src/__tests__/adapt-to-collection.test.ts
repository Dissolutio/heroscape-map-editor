import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import type { BoardPiece, HexMap } from '../types'
import { HexTerrain, Pieces } from '../types'
import {
  analyzeMapTerrain,
  buildCollectionAdaptationPlan,
  getAdaptedMapName,
  getMissingObstacles,
  getCollectionLandSupply,
  getObstacleSubstituteCandidates,
  getMissingLandTerrains,
  getRemainingLandShortfalls,
  suggestBuriedFillTerrain,
  suggestTerrainTarget,
  isGameplayAffectingObstacle,
  OBSTACLE_SUBSTITUTION_FAMILIES,
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
  it('limits obstacle substitutes to compatible families and matching footprints', () => {
    expect(OBSTACLE_SUBSTITUTION_FAMILIES.forestTree).toEqual([
      'forestTree',
      'snowTree',
    ])
    expect(OBSTACLE_SUBSTITUTION_FAMILIES.rockOutcrop).toEqual([
      'rockOutcrop',
      'lavaRockOutcrop',
      'toxicOutcrop',
    ])
    expect(OBSTACLE_SUBSTITUTION_FAMILIES.laurJungleTree).toEqual([
      'laurJungleTree',
      'ticallaPalm',
    ])

    const candidates = getObstacleSubstituteCandidates(Pieces.tree10, {
      [Pieces.snowTree10]: 1,
      [Pieces.glacier1]: 1,
    })
    expect(candidates).toEqual([Pieces.snowTree10])

    const shape = (inventoryID: string) => {
      const pieceTemplate = piecesSoFar[inventoryID]?.template
      if (!pieceTemplate) throw new Error('test setup: template is unavailable')
      return [
        ...new Set(
          getPieceTemplateCoords({
            clickedHex: at(0, 0),
            rotation: 0,
            template: pieceTemplate,
            isVsTile: false,
          }).map(({ q, r, s }) => `${q},${r},${s}`),
        ),
      ].sort()
    }
    expect(shape(Pieces.tree10)).toEqual(shape(candidates[0] ?? ''))
  })

  it('prefers the closest obstacle height and filters gameplay pieces last', () => {
    expect(
      getObstacleSubstituteCandidates(Pieces.tree10, {
        [Pieces.snowTree12]: 1,
        [Pieces.snowTree10]: 1,
        [Pieces.tree11]: 1,
      }),
    ).toEqual([Pieces.snowTree10, Pieces.tree11, Pieces.snowTree12])
    expect(isGameplayAffectingObstacle(Pieces.laurPalm13)).toBe(true)
    expect(isGameplayAffectingObstacle(Pieces.shroudshroom7)).toBe(true)
    expect(isGameplayAffectingObstacle(Pieces.cannon)).toBe(true)
    expect(isGameplayAffectingObstacle(Pieces.tree10)).toBe(false)
  })

  it('keeps obstacle conflicts unchanged for an identical-footprint substitute', () => {
    const boardPieces = [
      piece('tree', Pieces.tree10, 2, 2),
      piece('outcrop', Pieces.outcrop1, 2, 2),
    ]
    const conflictsBefore = computeConflictedPieceUIDs(boardPieces).sort()
    const substituted = boardPieces.map((boardPiece) =>
      boardPiece.uid === 'tree'
        ? { ...boardPiece, inventoryID: Pieces.snowTree10 }
        : boardPiece,
    )

    expect(conflictsBefore).toEqual(['outcrop', 'tree'])
    expect(computeConflictedPieceUIDs(substituted).sort()).toEqual(
      conflictsBefore,
    )
    expect(
      getObstacleSubstituteCandidates(
        Pieces.tree10,
        { [Pieces.snowTree10]: 1 },
        boardPieces,
      ),
    ).toEqual([Pieces.snowTree10])
  })

  it('allocates shared obstacle stock in stable order and reports leftovers', () => {
    const { boardHexes, boardPieces } = map([
      piece('tree-11', Pieces.tree11, 3, 1),
      piece('tree-10', Pieces.tree10, 1, 1),
    ])
    const supply = getCollectionLandSupply({ [Pieces.snowTree10]: 1 })
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply,
      choices: {},
      obstacleChoices: {
        [Pieces.tree10]: { targetInventoryIDs: [Pieces.snowTree10] },
        [Pieces.tree11]: { targetInventoryIDs: [Pieces.snowTree10] },
      },
      buriedFillByKind: noBuriedFill,
    })

    expect(plan.mapping).toEqual({ 'tree-10': Pieces.snowTree10 })
    expect(plan.obstacleCoverageByInventoryID).toEqual({
      [Pieces.tree10]: [1, 0, 0],
      [Pieces.tree11]: [0, 0, 0],
    })
    expect(plan.unconvertedObstacles).toEqual([
      { inventoryID: Pieces.tree11, count: 1 },
    ])
  })

  it('allocates gameplay-affecting obstacle rows after ordinary obstacles', () => {
    const boardPieces = [
      piece('cannon', Pieces.cannon, 3, 1),
      piece('tree', Pieces.tree10, 1, 1),
    ]
    expect(getMissingObstacles(boardPieces, {})).toEqual([
      { inventoryID: Pieces.tree10, count: 1 },
      { inventoryID: Pieces.cannon, count: 1 },
    ])
    const { boardHexes } = map(boardPieces)
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply: getCollectionLandSupply({
        [Pieces.snowTree10]: 1,
        [Pieces.ropeLadder]: 1,
      }),
      choices: {},
      obstacleChoices: {
        [Pieces.tree10]: { targetInventoryIDs: [Pieces.snowTree10] },
        [Pieces.cannon]: { targetInventoryIDs: [Pieces.ropeLadder] },
      },
      buriedFillByKind: noBuriedFill,
    })
    expect(Object.keys(plan.mapping)).toEqual(['tree', 'cannon'])
  })

  it('leaves obstacles with no possible substitute unchanged and reports them', () => {
    const { boardHexes, boardPieces } = map([piece('hive', Pieces.hive, 2, 2)])
    const plan = buildCollectionAdaptationPlan({
      boardHexes,
      boardPieces,
      supply: getCollectionLandSupply({}),
      choices: {},
      buriedFillByKind: noBuriedFill,
    })

    expect(plan.mapping).toEqual({})
    expect(plan.unconvertedObstacles).toEqual([
      { inventoryID: Pieces.hive, count: 1 },
    ])
  })

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

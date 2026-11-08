import { describe, expect, it } from 'vitest'
import {
  getPieceKeyDescriptionGaps,
  getPieceKeyModel,
  getPieceKeyTerrainDescription,
} from '../pdf-svg-shared/pieceKey'
import { piecesSoFar } from '../data/pieces'
import type { BoardPiece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { isSolidTerrainHex } from '../utils/board-utils'

const makePiece = (inventoryID: string, index: number): BoardPiece => ({
  uid: `key-${index}`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q: index, r: 0, s: -index },
})

describe('piece key model', () => {
  it('orders only used land terrains and sizes and leaves unused cells empty', () => {
    const model = getPieceKeyModel(
      [
        makePiece(Pieces.rock7, 0),
        makePiece(Pieces.sand1, 1),
        makePiece(Pieces.grass24, 2),
        makePiece(Pieces.grass1, 3),
      ],
      {},
      true,
    )

    expect(model.landColumns.map(({ terrain }) => terrain)).toEqual([
      'grass',
      'sand',
      'rock',
    ])
    expect(model.landRows.map(({ size }) => size)).toEqual([24, 7, 1])
    expect(
      model.landColumns.map((column) =>
        column.cells.map(({ size, entry }) => [size, entry.inventoryID]),
      ),
    ).toEqual([
      [
        [24, Pieces.grass24],
        [1, Pieces.grass1],
      ],
      [[1, Pieces.sand1]],
      [[7, Pieces.rock7]],
    ])
    expect(model.landRows.map(({ description }) => description)).toEqual([
      'gray borders',
      'purple borders',
      'red borders',
    ])
  })

  it('changes row descriptions when color borders are disabled', () => {
    const model = getPieceKeyModel(
      [makePiece(Pieces.grass1, 0), makePiece(Pieces.grass7, 1)],
      {},
      false,
    )

    expect(model.landRows.map(({ description }) => description)).toEqual([
      'dark borders',
      'dark borders',
    ])
  })

  it('keeps only standard land sizes in rows and groups special land pieces', () => {
    const model = getPieceKeyModel(
      [
        makePiece(Pieces.grass1, 0),
        makePiece(Pieces.grass2, 1),
        makePiece(Pieces.grass3, 2),
        makePiece(Pieces.grass7, 3),
        makePiece(Pieces.grass24, 4),
        makePiece(Pieces.concrete6, 5),
        makePiece(Pieces.ice4, 6),
        makePiece(Pieces.road5, 7),
        makePiece(Pieces.wallWalk7, 8),
        makePiece(Pieces.swampWater6, 9),
      ],
      {},
      true,
    )

    expect(model.landRows.map(({ size }) => size)).toEqual([24, 7, 3, 2, 1])
    expect(model.specialGroups.map(({ id }) => id)).toEqual([
      'roads-and-wall-walks',
      'special-land-concrete',
      'special-land-ice',
      'special-land-swampWater',
    ])
    expect(
      model.specialGroups[0].entries.map(({ inventoryID }) => inventoryID),
    ).toEqual([Pieces.road5, Pieces.wallWalk7])
    expect(
      model.specialGroups.slice(1).map(({ entries }) => entries[0].inventoryID),
    ).toEqual([Pieces.concrete6, Pieces.ice4, Pieces.swampWater6])
  })

  it('updates Special Tiles descriptions when border colors are disabled', () => {
    const colorBorders = getPieceKeyModel(
      [makePiece(Pieces.wood2, 0)],
      {},
      true,
    )
    const darkBorders = getPieceKeyModel(
      [makePiece(Pieces.wood2, 0)],
      {},
      false,
    )

    expect(colorBorders.specialGroups[0].description).toBe(
      'orange borders, brown wood-grain centers',
    )
    expect(darkBorders.specialGroups[0].description).toBe(
      'dark borders, brown wood-grain centers',
    )
  })

  it('describes ladder borders as black in both border modes', () => {
    for (const useTerrainBorderColor of [true, false]) {
      const model = getPieceKeyModel(
        [makePiece(Pieces.ladder, 0)],
        {},
        useTerrainBorderColor,
      )

      expect(model.specialGroups[0]).toMatchObject({
        id: 'ladder',
        description: 'black borders',
      })
    }
  })

  it('labels Toxic terrain as Toxic Land', () => {
    const model = getPieceKeyModel([makePiece(Pieces.toxic1, 0)], {}, true)

    expect(model.landColumns).toMatchObject([
      { terrain: HexTerrain.toxic, title: 'Toxic Land' },
    ])
  })

  it('groups special pieces by family with counts and tree heights', () => {
    const model = getPieceKeyModel(
      [
        makePiece(Pieces.water3, 0),
        makePiece(Pieces.water3, 1),
        makePiece(Pieces.wellspringWater1, 2),
        makePiece(Pieces.lava1, 3),
        makePiece(Pieces.tree10, 4),
        makePiece(Pieces.tree415, 5),
        makePiece(Pieces.palm14, 6),
        makePiece(Pieces.wood2, 7),
        makePiece(Pieces.laurWallSquarePillar, 8),
        makePiece(Pieces.laurWallLong, 9),
        makePiece(Pieces.laurWallShort, 10),
        makePiece(Pieces.ropeLadder, 11),
        makePiece(Pieces.ladder, 12),
        makePiece(Pieces.cannon, 13),
        makePiece(Pieces.shipBow, 14),
        makePiece(Pieces.glyphPower, 15),
        makePiece(Pieces.startZone1, 16),
      ],
      {},
      false,
    )

    expect(model.specialGroups.map(({ id }) => id)).toEqual([
      'water',
      'wellspring',
      'other-fluids',
      'evergreen',
      'jungle',
      'wood',
      'laur',
      'ladder',
      'rope-ladder',
      'cannon',
      'ship',
      'glyph',
      'start-zone',
    ])
    expect(model.specialGroups[0].entries[0]).toMatchObject({
      inventoryID: Pieces.water3,
      count: 2,
    })
    const evergreen = model.specialGroups.find(({ id }) => id === 'evergreen')
    const laur = model.specialGroups.find(({ id }) => id === 'laur')
    expect(evergreen?.entries.map(({ inventoryID }) => inventoryID)).toEqual([
      Pieces.tree10,
      Pieces.tree415,
    ])
    expect(laur?.entries.map(({ inventoryID }) => inventoryID)).toEqual([
      Pieces.laurWallLong,
      Pieces.laurWallShort,
      Pieces.laurWallSquarePillar,
    ])
    expect(laur).toMatchObject({
      title: 'Pillars and Walls (Laur)',
      description:
        'pillars have pink borders and purple centers; wall add-ons are pink',
    })
    expect(laur?.entries.map(({ title }) => title)).toEqual([
      'long wall',
      'short wall',
      'square pillar',
    ])
  })

  it('uses the title as a safe fallback for missing terrain descriptions', () => {
    expect(
      getPieceKeyTerrainDescription('future-terrain', 'Future Terrain'),
    ).toBe('Future Terrain')
    expect(getPieceKeyDescriptionGaps(['grass', 'future-terrain'])).toEqual([
      'future-terrain',
    ])
  })

  it('has a description entry for every registered land terrain', () => {
    const landTerrains = [
      ...new Set(
        Object.values(piecesSoFar)
          .filter(
            (piece) =>
              piece.landPrefix &&
              isSolidTerrainHex(piece.terrain) &&
              piece.terrain !== HexTerrain.wood,
          )
          .map(({ terrain }) => terrain),
      ),
    ]

    expect(getPieceKeyDescriptionGaps(landTerrains)).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import {
  getPieceKeyDescriptionGaps,
  getPieceKeyModel,
  getPieceKeyRowsForColumns,
  getPieceKeyTerrainDescription,
} from '../pdf-svg-shared/pieceKey'
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
    ])
    expect(
      model.specialGroups[0].entries.map(({ inventoryID }) => inventoryID),
    ).toEqual([Pieces.road5, Pieces.wallWalk7])
    expect(
      model.specialGroups.slice(1).map(({ entries }) => entries[0].inventoryID),
    ).toEqual([Pieces.concrete6])
    expect(
      model.fluidColumns
        .flatMap((column) => column.cells)
        .map(({ entry }) => entry.inventoryID),
    ).toEqual([Pieces.swampWater6, Pieces.ice4])
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

  it('describes key borders in both border modes', () => {
    const boardPieces = [
      makePiece(Pieces.water1, 0),
      makePiece(Pieces.wellspringWater1, 1),
      makePiece(Pieces.tree10, 2),
      makePiece(Pieces.palm14, 3),
      makePiece(Pieces.laurWallSquarePillar, 4),
    ]

    for (const useTerrainBorderColor of [true, false]) {
      const model = getPieceKeyModel(boardPieces, {}, useTerrainBorderColor)
      const descriptions = new Map(
        model.specialGroups.map(({ id, description }) => [id, description]),
      )
      expect(model.specialGroups.some(({ id }) => id === 'water')).toBe(false)
      expect(model.specialGroups.some(({ id }) => id === 'wellspring')).toBe(
        false,
      )
      expect(model.fluidRows[0]?.description).toBe(
        useTerrainBorderColor ? 'blue borders' : 'dark borders',
      )
      expect(descriptions.get('evergreen')).toBe(
        useTerrainBorderColor
          ? 'green borders and centers; number indicates tree height'
          : 'dark borders and green centers; number indicates tree height',
      )
      expect(descriptions.get('jungle')).toBe(
        useTerrainBorderColor
          ? 'brown borders, yellow centers'
          : 'dark borders, yellow centers',
      )
      expect(descriptions.get('laur')).toBe(
        useTerrainBorderColor
          ? 'pillars have pink borders and purple centers; wall add-ons are pink'
          : 'pillars and wall add-ons have dark borders; pillars have purple centers',
      )
    }
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
    expect(
      model.fluidColumns.find(({ terrain }) => terrain === HexTerrain.water)
        ?.cells[0].entry,
    ).toMatchObject({
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
        'pillars and wall add-ons have dark borders; pillars have purple centers',
    })
    expect(laur?.entries.map(({ title }) => title)).toEqual([
      'long wall',
      'short wall',
      'square pillar',
    ])
  })

  it('builds fluid columns and size rows from only the fluids used', () => {
    const model = getPieceKeyModel(
      [
        makePiece(Pieces.water3, 0),
        makePiece(Pieces.water3, 1),
        makePiece(Pieces.wellspringWater1, 2),
        makePiece(Pieces.swampWater6, 3),
        makePiece(Pieces.ice4, 4),
        makePiece(Pieces.ice6, 5),
        makePiece(Pieces.lava1, 6),
        makePiece(Pieces.shadow3, 7),
        makePiece(Pieces.toxicWater1, 8),
        makePiece(Pieces.genericFluid2, 9),
        makePiece(Pieces.genericFluid2, 10),
      ],
      {},
      true,
    )

    expect(model.fluidColumns.map(({ terrain }) => terrain)).toEqual([
      HexTerrain.water,
      HexTerrain.wellspringWater,
      HexTerrain.swampWater,
      HexTerrain.lava,
      HexTerrain.ice,
      HexTerrain.shadow,
      HexTerrain.toxicWater,
      HexTerrain.genericFluid,
    ])
    expect(model.fluidRows.map(({ size }) => size)).toEqual([6, 4, 3, 2, 1])
    expect(
      model.fluidColumns.map((column) =>
        column.cells.map(({ size, entry }) => [size, entry.inventoryID]),
      ),
    ).toEqual([
      [[3, Pieces.water3]],
      [[1, Pieces.wellspringWater1]],
      [[6, Pieces.swampWater6]],
      [[1, Pieces.lava1]],
      [
        [6, Pieces.ice6],
        [4, Pieces.ice4],
      ],
      [[3, Pieces.shadow3]],
      [[1, Pieces.toxicWater1]],
      [[2, Pieces.genericFluid2]],
    ])
    expect(model.fluidColumns[0].cells[0].entry.count).toBe(2)
    expect(model.fluidColumns[7]).toMatchObject({
      title: 'Generic Fluid',
      description: 'user-selected centers',
    })
    expect(model.fluidRows.map(({ description }) => description)).toEqual([
      'blue borders',
      'blue borders',
      'blue borders',
      'blue borders',
      'blue borders',
    ])
    expect(
      model.specialGroups.flatMap(({ entries }) =>
        entries.map(({ inventoryID }) => inventoryID),
      ),
    ).not.toContain(Pieces.genericFluid2)
  })

  it('uses only fluid sizes present in each wrapped column chunk', () => {
    const model = getPieceKeyModel(
      [
        makePiece(Pieces.water3, 0),
        makePiece(Pieces.wellspringWater1, 1),
        makePiece(Pieces.swampWater6, 2),
        makePiece(Pieces.ice4, 3),
        makePiece(Pieces.ice6, 4),
        makePiece(Pieces.lava1, 5),
        makePiece(Pieces.shadow3, 6),
        makePiece(Pieces.toxicWater1, 7),
        makePiece(Pieces.genericFluid2, 8),
      ],
      {},
      true,
    )
    const firstChunk = model.fluidColumns.slice(0, 6)
    const secondChunk = model.fluidColumns.slice(6)

    expect(
      getPieceKeyRowsForColumns(firstChunk, model.fluidRows).map(
        ({ size }) => size,
      ),
    ).toEqual([6, 4, 3, 1])
    expect(
      getPieceKeyRowsForColumns(secondChunk, model.fluidRows).map(
        ({ size }) => size,
      ),
    ).toEqual([2, 1])
    expect(
      getPieceKeyRowsForColumns(
        model.fluidColumns.filter(
          ({ terrain }) => terrain === HexTerrain.toxicWater,
        ),
        model.fluidRows,
      ).map(({ size }) => size),
    ).toEqual([1])
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

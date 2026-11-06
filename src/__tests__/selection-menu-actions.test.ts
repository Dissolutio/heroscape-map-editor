import { describe, expect, it } from 'vitest'
import { getLaurAddonFeatureId } from '../data/laurAddonPlacement'
import { piecesSoFar } from '../data/pieces'
import {
  getSelectionMenuItems,
  getVisibleSelectionPieces,
  invertSelection,
  selectConnected,
  selectSameLevel,
  selectSameType,
  selectionMenuActions,
  type SelectionMenuAction,
  type SelectionMenuContext,
} from '../selection/selectionMenuActions'
import type { Board, Table } from './helpers/board'
import { makeTable, place } from './helpers/board'
import { type BoardHex, type BoardPiece, Pieces } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

const noSelection = () => undefined

function context(
  board: Board,
  seedPieceIDs: string[] = [],
  selectedPieceIDs = seedPieceIDs,
  viewingLevel = 3,
  isShowStartZones = true,
): SelectionMenuContext {
  return {
    seedPieceIDs,
    selectedPieceIDs,
    boardPieces: board.boardPieces,
    boardHexes: board.boardHexes,
    viewingLevel,
    isShowStartZones,
    setSelectedPieceIDs: noSelection,
  }
}

function put(
  board: Board,
  pieceID: string,
  at: Table['center'],
  altitude = 0,
  uid = pieceID,
) {
  return place({ board, pieceID, at, altitude, uid }).board
}

function piece(
  uid: string,
  inventoryID: string,
  pieceCoords: Table['center'],
  altitude = 0,
  rotation = 0,
): BoardPiece {
  return { uid, inventoryID, pieceCoords, altitude, rotation }
}

describe('selection menu pure actions', () => {
  it('selects land with the same prefix across sizes, but exact IDs for other pieces', () => {
    const table = makeTable(20)
    const first = put(table, Pieces.grass1, table.center, 0, 'grass-1')
    const grass = put(
      first,
      Pieces.grass2,
      { q: table.center.q + 5, r: table.center.r, s: table.center.s - 5 },
      0,
      'grass-2',
    )
    const otherLand = put(
      grass,
      Pieces.sand1,
      { q: table.center.q - 5, r: table.center.r, s: table.center.s + 5 },
      0,
      'sand',
    )
    const firstTree = put(
      otherLand,
      Pieces.tree10,
      { q: table.center.q + 4, r: table.center.r, s: table.center.s - 4 },
      0,
      'tree-10',
    )
    const trees = put(
      firstTree,
      Pieces.tree11,
      { q: table.center.q - 4, r: table.center.r, s: table.center.s + 4 },
      0,
      'tree-11',
    )

    expect(selectSameType(context(trees, ['grass-1']))).toEqual([
      'grass-1',
      'grass-2',
    ])
    expect(selectSameType(context(trees, ['tree-10']))).toEqual(['tree-10'])
  })

  it('selects pieces at each seed base altitude and excludes hidden pieces', () => {
    const table = makeTable(16)
    const floor = put(table, Pieces.grass1, table.center, 0, 'floor')
    const stacked = put(floor, Pieces.grass1, table.center, 1, 'stacked')
    const sameLevel = put(
      stacked,
      Pieces.sand1,
      { q: table.center.q + 4, r: table.center.r, s: table.center.s - 4 },
      0,
      'sand',
    )
    const zone = put(
      sameLevel,
      Pieces.startZone1,
      { q: table.center.q + 4, r: table.center.r, s: table.center.s - 4 },
      0,
      'zone',
    )
    const board = {
      ...zone,
      boardPieces: [
        ...zone.boardPieces,
        piece(
          'above-view',
          Pieces.grass1,
          { q: table.center.q - 4, r: table.center.r, s: table.center.s + 4 },
          4,
        ),
      ],
    }

    expect(
      selectSameLevel(context(board, ['floor'], ['floor'], 1, false)),
    ).toEqual(['floor', 'sand'])
    expect(
      getVisibleSelectionPieces(
        board.boardPieces,
        board.boardHexes,
        1,
        false,
      ).map((bp) => bp.uid),
    ).toEqual(['floor', 'sand'])
    expect(
      selectSameLevel(context(board, ['stacked'], ['stacked'], 1, false)),
    ).toEqual([])
  })

  it('inverts only visible placed pieces and does not include objective markers', () => {
    const table = makeTable(12)
    const board = put(table, Pieces.grass1, table.center, 0, 'visible')
    const stacked = put(board, Pieces.grass1, table.center, 1, 'above')
    const ctx = context(stacked, ['visible'], ['visible'], 1)
    const objectiveMarkerUID = 'objective-marker'

    expect(invertSelection(ctx)).toEqual([])
    expect(
      invertSelection({
        ...ctx,
        selectedPieceIDs: [],
        seedPieceIDs: [],
      }),
    ).toEqual(['visible'])
    expect(invertSelection(ctx)).not.toContain(objectiveMarkerUID)
  })

  it('returns no seeded selection when the current seed is empty', () => {
    const table = makeTable(8)
    const board = put(table, Pieces.grass1, table.center, 0, 'grass')
    const ctx = context(board)

    expect(selectSameType(ctx)).toEqual([])
    expect(selectConnected(ctx)).toEqual([])
    expect(selectSameLevel(ctx)).toEqual([])
    expect(invertSelection(ctx)).toEqual(['grass'])
  })

  it('connects multi-hex footprints and vertical stacks, but not corner touches', () => {
    const table = makeTable(30)
    const large = put(table, Pieces.grass3, table.center, 0, 'large')
    const ownedHexes = Object.values(large.boardHexes).filter(
      (hex) => hex.boardPieceUID === 'large',
    )
    const ownedIDs = new Set(ownedHexes.map((hex) => hex.id))
    const neighborCoords = ownedHexes
      .flatMap((hex) =>
        Object.values(HEX_DIRECTIONS).map((direction) =>
          hexUtilsAdd(hex, direction),
        ),
      )
      .find(
        (coords) =>
          !ownedIDs.has(`${ownedHexes[0].altitude}~${coords.q}~${coords.r}`),
      )
    if (!neighborCoords) {
      throw new Error('test setup: large tile has no available neighbor')
    }
    const neighbor = put(large, Pieces.grass1, neighborCoords, 0, 'neighbor')
    const stacked = put(neighbor, Pieces.grass1, table.center, 1, 'stacked')
    const isolatedCoords = {
      q: table.center.q + 6,
      r: table.center.r + 6,
      s: table.center.s - 12,
    }
    const isolated = put(stacked, Pieces.grass1, isolatedCoords, 0, 'isolated')
    const cornerCoords = hexUtilsAdd(isolatedCoords, { q: 1, r: 1, s: -2 })
    const allPieces = put(isolated, Pieces.grass1, cornerCoords, 0, 'corner')
    const selected = selectConnected(context(allPieces, ['large']))

    expect(selected).toContain('large')
    expect(selected).toContain('neighbor')
    expect(selected).toContain('stacked')
    expect(selected).not.toContain('corner')
  })

  it('connects Laur add-ons to their matching attachment feature', () => {
    const table = makeTable(10)
    const pillar = piece('pillar', Pieces.laurWallSquarePillar, table.center)
    const addon = piece('addon', Pieces.laurWallShort, table.center)
    expect(
      getLaurAddonFeatureId(addon.pieceCoords, addon.rotation),
    ).toBeDefined()
    const board: Board = {
      boardPieces: [pillar, addon],
      boardHexes: {},
    }

    expect(selectConnected(context(board, ['addon']))).toEqual([
      'pillar',
      'addon',
    ])
  })

  it('finishes a generated 5,000-piece connected map in under a second', () => {
    const boardPieces = Array.from({ length: 5000 }, (_, index) =>
      piece(`piece-${index}`, Pieces.grass1, { q: index, r: 0, s: -index }),
    )
    const boardHexes = Object.fromEntries(
      boardPieces.map((bp) => {
        const hex: BoardHex = {
          id: `1~${bp.pieceCoords.q}~0`,
          q: bp.pieceCoords.q,
          r: 0,
          s: bp.pieceCoords.s,
          altitude: 1,
          terrain: piecesSoFar[Pieces.grass1].terrain,
          pieceID: '',
          boardPieceUID: bp.uid,
          inventoryID: bp.inventoryID,
          pieceRotation: 0,
        }
        return [hex.id, hex]
      }),
    )
    const ctx = {
      seedPieceIDs: ['piece-0'],
      selectedPieceIDs: ['piece-0'],
      boardPieces,
      boardHexes,
      viewingLevel: 1,
      isShowStartZones: true,
      setSelectedPieceIDs: noSelection,
    } satisfies SelectionMenuContext

    const start = performance.now()
    const selected = selectConnected(ctx)

    expect(selected).toHaveLength(5000)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})

describe('selection menu action registry', () => {
  it('keeps the first four actions ordered and disables seed actions without a seed', () => {
    const table = makeTable(8)
    const board = put(table, Pieces.grass1, table.center, 0, 'grass')
    const ctx = context(board)
    const items = getSelectionMenuItems(selectionMenuActions, ctx)

    expect(items.map(({ action }) => action.id)).toEqual([
      'same-type',
      'connected',
      'same-level',
      'invert',
    ])
    expect(items.map(({ enabled }) => enabled)).toEqual([
      false,
      false,
      false,
      true,
    ])
    expect(items[0].disabledReason).toBe('Select a visible piece first.')
  })

  it('includes newly registered actions in the menu data', () => {
    const table = makeTable(8)
    const board = put(table, Pieces.grass1, table.center, 0, 'grass')
    const fakeAction: SelectionMenuAction = {
      id: 'test-action',
      label: 'Test action',
      group: 'test',
      tooltip: 'Test tooltip',
      isEnabled: () => true,
      disabledReason: () => undefined,
      run: noSelection,
    }
    const items = getSelectionMenuItems(
      [...selectionMenuActions, fakeAction],
      context(board, ['grass']),
    )

    const lastItem = items[items.length - 1]
    expect(lastItem?.action).toBe(fakeAction)
    expect(lastItem?.enabled).toBe(true)
  })
})

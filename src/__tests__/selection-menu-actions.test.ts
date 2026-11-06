import { describe, expect, it } from 'vitest'
import { getPieceEdgeId } from '../data/hexGrid/pieceFeatures'
import { hexesForEdge } from '../data/hexGrid/edgesAndNodes'
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
import { genBoardHexID } from '../utils/map-utils'

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

function occupiedHex(
  uid: string,
  inventoryID: string,
  coords: Table['center'],
  altitude: number,
  isVerticalClearanceHex = false,
): BoardHex {
  const id = genBoardHexID({ ...coords, altitude })
  return {
    id,
    ...coords,
    altitude,
    pieceID: id,
    boardPieceUID: uid,
    inventoryID,
    terrain: piecesSoFar[inventoryID].terrain,
    pieceRotation: 0,
    ...(isVerticalClearanceHex ? { isVerticalClearanceHex: true } : {}),
  }
}

function selectionBoard(boardPieces: BoardPiece[], hexes: BoardHex[]): Board {
  return {
    boardPieces,
    boardHexes: Object.fromEntries(hexes.map((hex) => [hex.id, hex])),
  }
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

  it('connects land at the same altitude, but not side or corner contacts at another level', () => {
    const table = makeTable(8)
    const levelOne = [
      piece('grass', Pieces.grass1, table.center),
      piece('sand', Pieces.sand1, hexUtilsAdd(table.center, HEX_DIRECTIONS[0])),
      piece(
        'corner',
        Pieces.grass1,
        hexUtilsAdd(table.center, { q: 2, r: 1, s: -3 }),
      ),
    ]
    const higherNeighbor = piece(
      'higher-neighbor',
      Pieces.grass1,
      hexUtilsAdd(table.center, HEX_DIRECTIONS[1]),
      1,
    )
    const board = selectionBoard(
      [...levelOne, higherNeighbor],
      [
        occupiedHex('grass', Pieces.grass1, table.center, 1),
        occupiedHex('sand', Pieces.sand1, levelOne[1].pieceCoords, 1),
        occupiedHex('corner', Pieces.grass1, levelOne[2].pieceCoords, 1),
        occupiedHex(
          'higher-neighbor',
          Pieces.grass1,
          higherNeighbor.pieceCoords,
          2,
        ),
      ],
    )

    expect(selectConnected(context(board, ['grass']))).toEqual([
      'grass',
      'sand',
    ])
  })

  it('connects obstacles only to their supported land and through connected land', () => {
    const table = makeTable(8)
    const firstCoords = table.center
    const secondCoords = hexUtilsAdd(firstCoords, HEX_DIRECTIONS[0])
    const firstLand = piece('land-1', Pieces.grass1, firstCoords)
    const secondLand = piece('land-2', Pieces.sand1, secondCoords)
    const firstTree = piece('tree-1', Pieces.tree10, firstCoords, 1)
    const secondTree = piece('tree-2', Pieces.tree11, secondCoords, 1)
    const board = selectionBoard(
      [firstLand, secondLand, firstTree, secondTree],
      [
        occupiedHex('land-1', Pieces.grass1, firstCoords, 1),
        occupiedHex('land-2', Pieces.sand1, secondCoords, 1),
        occupiedHex('tree-1', Pieces.tree10, firstCoords, 2),
        occupiedHex('tree-2', Pieces.tree11, secondCoords, 2),
      ],
    )

    expect(selectConnected(context(board, ['land-1']))).toEqual([
      'land-1',
      'land-2',
      'tree-1',
      'tree-2',
    ])
    expect(selectConnected(context(board, ['tree-1']))).toEqual([
      'land-1',
      'land-2',
      'tree-1',
      'tree-2',
    ])
    expect(selectConnected(context(board, ['tree-2']))).toEqual([
      'land-1',
      'land-2',
      'tree-1',
      'tree-2',
    ])
  })

  it('does not connect adjacent obstacles on separate land or land beside the obstacle', () => {
    const table = makeTable(8)
    const firstCoords = table.center
    const secondCoords = hexUtilsAdd(firstCoords, { q: 2, r: 0, s: -2 })
    const firstTree = piece('tree-1', Pieces.tree10, firstCoords, 1)
    const secondTree = piece('tree-2', Pieces.tree11, secondCoords, 1)
    const treeClearance = hexUtilsAdd(firstCoords, HEX_DIRECTIONS[0])
    const adjacentLandCoords = hexUtilsAdd(firstCoords, HEX_DIRECTIONS[1])
    const adjacentLand = piece(
      'adjacent-land',
      Pieces.grass1,
      adjacentLandCoords,
      1,
    )
    const board = selectionBoard(
      [
        piece('land-1', Pieces.grass1, firstCoords),
        piece('land-2', Pieces.sand1, secondCoords),
        firstTree,
        secondTree,
        adjacentLand,
      ],
      [
        occupiedHex('land-1', Pieces.grass1, firstCoords, 1),
        occupiedHex('land-2', Pieces.sand1, secondCoords, 1),
        occupiedHex('tree-1', Pieces.tree10, firstCoords, 2),
        occupiedHex('tree-1', Pieces.tree10, treeClearance, 2, true),
        occupiedHex('tree-2', Pieces.tree11, secondCoords, 2),
        occupiedHex('adjacent-land', Pieces.grass1, adjacentLandCoords, 2),
      ],
    )

    expect(selectConnected(context(board, ['tree-1']))).toEqual([
      'land-1',
      'tree-1',
    ])
    expect(selectConnected(context(board, ['tree-1']))).not.toContain('tree-2')
    expect(selectConnected(context(board, ['tree-1']))).not.toContain(
      'adjacent-land',
    )
  })

  it('selects an obstacle seed even when it has no land beneath it', () => {
    const table = makeTable(8)
    const tree = piece('tree', Pieces.tree10, table.center, 1)
    const board = selectionBoard([tree], [])

    expect(selectConnected(context(board, ['tree']))).toEqual(['tree'])
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

  it('connects Laur walls through their pillar stack to supporting land', () => {
    const table = makeTable(8)
    const coords = table.center
    const land = piece('land', Pieces.grass1, coords)
    const pillar = piece('pillar', Pieces.laurWallSquarePillar, coords, 1)
    const addon = piece('addon', Pieces.laurWallShort, coords, 1)
    const board = selectionBoard(
      [land, pillar, addon],
      [
        occupiedHex('land', Pieces.grass1, coords, 1),
        occupiedHex('pillar', Pieces.laurWallSquarePillar, coords, 2),
      ],
    )

    expect(selectConnected(context(board, ['addon']))).toEqual([
      'land',
      'pillar',
      'addon',
    ])
  })

  it('connects a ladder to the land at its bottom and top', () => {
    const table = makeTable(8)
    const coords = table.center
    const ladder = piece('ladder', Pieces.ladder, coords, 1)
    const bottom = piece('bottom', Pieces.grass1, coords)
    const top = piece('top', Pieces.sand1, coords, 2)
    const board = selectionBoard(
      [bottom, ladder, top],
      [
        occupiedHex('bottom', Pieces.grass1, coords, 1),
        occupiedHex('ladder', Pieces.ladder, coords, 2),
        occupiedHex('top', Pieces.sand1, coords, 3),
      ],
    )

    expect(selectConnected(context(board, ['ladder']))).toEqual([
      'bottom',
      'ladder',
      'top',
    ])
  })

  it.each([Pieces.ropeLadder, Pieces.battlement])(
    'connects %s to land or wall at its edge',
    (inventoryID) => {
      const table = makeTable(8)
      const edgePiece = piece('edge-piece', inventoryID, table.center, 1)
      const edgeID = getPieceEdgeId({
        ...edgePiece,
        pieceID: inventoryID,
      })
      if (!edgeID) throw new Error('test setup: edge piece has no edge ID')
      const endpoints = hexesForEdge(edgeID)
      const attachedCoords = endpoints[0]
      const attachedID =
        inventoryID === Pieces.battlement ? Pieces.fortifiedWall : Pieces.grass1
      const attached = piece('attached', attachedID, attachedCoords)
      const board = selectionBoard(
        [edgePiece, attached],
        [
          occupiedHex('edge-piece', inventoryID, edgePiece.pieceCoords, 2),
          occupiedHex('attached', attachedID, attachedCoords, 1),
        ],
      )

      expect(selectConnected(context(board, ['edge-piece']))).toEqual([
        'edge-piece',
        'attached',
      ])
    },
  )

  it('does not connect a road wall to adjacent land', () => {
    const table = makeTable(8)
    const coords = table.center
    const neighborCoords = hexUtilsAdd(coords, HEX_DIRECTIONS[0])
    const roadWall = piece('road-wall', Pieces.roadWall, coords, 1)
    const land = piece('land', Pieces.grass1, neighborCoords)
    const board = selectionBoard(
      [roadWall, land],
      [
        occupiedHex('road-wall', Pieces.roadWall, coords, 2),
        occupiedHex('land', Pieces.grass1, neighborCoords, 1),
      ],
    )

    expect(selectConnected(context(board, ['road-wall']))).toEqual([
      'road-wall',
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

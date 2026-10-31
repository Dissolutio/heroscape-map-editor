/**
 * CLICK PLACEMENT (world/mapDisplayClickHandler.tsx)
 *
 * Characterization of what a left click with a piece pen does today, per
 * piece family, through the real handler and the real store (paintTile, which
 * places permissively). Nothing is rendered: MapDisplay3D's children are
 * stubbed, and the stubbed EmptyHexes hands back the handler (see
 * helpers/clickHandler.ts). The cases live in helpers/placementCases.ts.
 */
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { evaluateLaurAddonConflicts } from '../data/laurAddonConflicts'
import { getLaurAddonHitHex } from '../data/laurAddonStacking'
import { placementBlockedMessages } from '../data/placement'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'
import { Pieces } from '../types'
import {
  cloneBoard,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './helpers/board'
import {
  SELECTED_BEFORE_CLICK,
  clickWithPen,
  clickWithSelection,
} from './helpers/clickHandler'
import {
  onCastleWall,
  onPillar,
  onTrianglePillar,
  placementCases,
} from './helpers/placementCases'

vi.mock('notistack', () => ({
  closeSnackbar: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))
vi.mock('../hooks/useMiddleClickPickPenMode.tsx', () => ({
  useMiddleClickPickPenMode: () => undefined,
}))
vi.mock('../world/maphex/instance/EmptyHex.tsx', async () => ({
  default: (await import('./helpers/handlerCapture')).CaptureHandler,
}))
vi.mock('../world/MapBoardPiece3D.tsx', () => ({ MapBoardPiece3D: () => null }))
vi.mock('../world/OperationPiecePreviews.tsx', () => ({
  OperationPiecePreviews: () => null,
}))
vi.mock('../world/PiecePreview.tsx', () => ({ default: () => null }))
vi.mock('../world/TableSurfaceMesh.tsx', () => ({
  TableSurfaceMesh: () => null,
}))
vi.mock('../world/maphex/MapHex3D.tsx', () => ({ MapHex3D: () => null }))
vi.mock('../world/maphex/instance/FluidCap.tsx', () => ({
  default: () => null,
}))
vi.mock('../world/maphex/instance/SolidCaps.tsx', () => ({
  default: () => null,
}))
vi.mock('../world/models/LandSubterrainInstanced.tsx', () => ({
  default: () => null,
  getLandSubterrainInstanceData: () => [],
}))

const snackbar = vi.mocked(enqueueSnackbar)
// the handler always passes an options object
const snackbarMessages = () =>
  snackbar.mock.calls.map((call) => (call[0] as { message?: string }).message)

function onAddon(pieceID: string, rotation: number) {
  const table = withGrassFloor(makeTable(9))
  const { board } = place({
    board: cloneBoard(table),
    pieceID,
    at: table.center,
    altitude: 1,
    rotation,
    uid: 'addon-base',
    permissive: true,
  })
  const addon = board.boardPieces.find(
    (boardPiece) => boardPiece.uid === 'addon-base',
  )
  if (!addon) throw new Error('test setup: add-on base was not placed')
  return { board, hex: getLaurAddonHitHex(addon), addon }
}

beforeEach(() => {
  snackbar.mockClear()
  useBoundStore.setState((state) => ({
    terrainConstraintSource: 'none',
    customConstraintInventoryFileName: '',
    customConstraintInventory: {},
    hexMap: { ...state.hexMap, setsUsed: [] },
  }))
})

function clickSnackbarAction(index: number, label: string) {
  const options = snackbar.mock.calls[index]?.[0] as
    | { action?: unknown }
    | undefined
  if (!options || typeof options.action !== 'function') {
    throw new Error(`Expected ${label} snackbar action`)
  }
  const action = options.action('test-snackbar') as ReactElement<{
    onClick?: (event: never) => void
  }>
  if (!action.props.onClick) throw new Error(`Expected ${label} button`)
  action.props.onClick(undefined as never)
}

describe('click placement through the real handler', () => {
  it('sets a multi-hex group pivot from the clicked hex without changing selection', () => {
    const table = makeTable(12)
    let board = place({
      board: cloneBoard(table),
      pieceID: Pieces.grass3,
      at: table.center,
      altitude: 0,
      uid: 'tile',
    }).board
    board = place({
      board,
      pieceID: Pieces.grass1,
      at: { q: table.center.q + 4, r: table.center.r, s: table.center.s - 4 },
      altitude: 0,
      uid: 'other',
    }).board
    const clickedHex = Object.values(board.boardHexes).find(
      (hex) =>
        hex.boardPieceUID === 'tile' &&
        (hex.q !== table.center.q || hex.r !== table.center.r),
    )
    if (!clickedHex) throw new Error('test setup: missing non-origin hex')

    const pivotClick = clickWithSelection({
      board,
      hex: clickedHex,
      selectedPieceIDs: ['other', 'tile'],
    })
    expect(pivotClick.selectedPieceIDs).toEqual(['other', 'tile'])
    expect(pivotClick.rotationPivot).toMatchObject({
      uid: 'tile',
      coords: { q: clickedHex.q, r: clickedHex.r, s: clickedHex.s },
    })

    const shiftSelection = clickWithSelection({
      board,
      hex: clickedHex,
      selectedPieceIDs: ['other'],
      shiftKey: true,
    })
    expect(shiftSelection.selectedPieceIDs).toEqual(['other', 'tile'])
    expect(shiftSelection.rotationPivot).toMatchObject({
      uid: 'tile',
      coords: { q: clickedHex.q, r: clickedHex.r, s: clickedHex.s },
    })

    const currentPivotClick = clickWithSelection({
      board,
      hex: clickedHex,
      selectedPieceIDs: ['other', 'tile'],
      rotationPivot: pivotClick.rotationPivot,
    })
    expect(currentPivotClick.selectedPieceIDs).toEqual(['tile'])
    expect(currentPivotClick.rotationPivot).toBeNull()
  })

  it('sets a single-piece pivot on first click and moves it without toggling', () => {
    const table = makeTable(12)
    const board = place({
      board: cloneBoard(table),
      pieceID: Pieces.grass3,
      at: table.center,
      altitude: 0,
      uid: 'tile',
    }).board
    const clickedHex = Object.values(board.boardHexes).find(
      (hex) =>
        hex.boardPieceUID === 'tile' &&
        (hex.q !== table.center.q || hex.r !== table.center.r),
    )
    if (!clickedHex) throw new Error('test setup: missing non-origin hex')

    const firstClick = clickWithSelection({
      board,
      hex: clickedHex,
      selectedPieceIDs: [],
    })
    expect(firstClick.selectedPieceIDs).toEqual(['tile'])
    expect(firstClick.rotationPivot).toMatchObject({
      uid: 'tile',
      coords: { q: clickedHex.q, r: clickedHex.r, s: clickedHex.s },
    })

    const originHex = Object.values(board.boardHexes).find(
      (hex) =>
        hex.boardPieceUID === 'tile' &&
        hex.q === table.center.q &&
        hex.r === table.center.r,
    )
    if (!originHex) throw new Error('test setup: missing origin hex')
    const movePivotToOrigin = clickWithSelection({
      board,
      hex: originHex,
      selectedPieceIDs: ['tile'],
      rotationPivot: firstClick.rotationPivot,
    })
    expect(movePivotToOrigin.selectedPieceIDs).toEqual(['tile'])
    expect(movePivotToOrigin.rotationPivot?.coords).toMatchObject({
      q: table.center.q,
      r: table.center.r,
      s: table.center.s,
    })
    const deselectAtOrigin = clickWithSelection({
      board,
      hex: originHex,
      selectedPieceIDs: ['tile'],
      rotationPivot: movePivotToOrigin.rotationPivot,
    })
    expect(deselectAtOrigin.selectedPieceIDs).toEqual([])
    expect(deselectAtOrigin.rotationPivot).toBeNull()

    const currentPivotClick = clickWithSelection({
      board,
      hex: clickedHex,
      selectedPieceIDs: ['tile'],
      rotationPivot: firstClick.rotationPivot,
    })
    expect(currentPivotClick.selectedPieceIDs).toEqual([])
    expect(currentPivotClick.rotationPivot).toBeNull()
  })

  it.each(placementCases)('$name', ({ pieceID, rotation, setup, expected }) => {
    const { board, hex } = setup()
    const before = cloneBoard(board)
    const result = clickWithPen({ board, pieceID, hex, rotation })
    expect(board).toEqual(before) // the click works on the store's copy

    if ('refused' in expected) {
      expect(result.added).toEqual([])
      expect(result.boardPieces).toEqual(board.boardPieces)
      // a refusal leaves the selection alone
      expect(result.selectedPieceIDs).toEqual([SELECTED_BEFORE_CLICK])
      const message = placementBlockedMessages[expected.refused]
      expect(snackbarMessages()).toEqual(message ? [message] : [])
      return
    }
    const { coords, altitude, rotation: placedRotation } = expected.placed
    expect(result.added).toHaveLength(1)
    const [added] = result.added
    expect(added.inventoryID).toBe(expected.clickPieceID ?? pieceID)
    expect(added.pieceCoords).toEqual(coords)
    expect(added.rotation).toBe(placedRotation)
    if (altitude !== undefined) expect(added.altitude).toBe(altitude)
    // Placement clears selection; an automatic Laur switch is announced.
    expect(result.selectedPieceIDs).toEqual([])
    expect(snackbarMessages()).toEqual(
      expected.clickPieceID ? ['Placed the stackable version'] : [],
    )
  })

  it('a placement onto another piece flags the conflict', () => {
    const table = withGrassFloor(makeTable(9))
    const { board } = place({
      board: cloneBoard(table),
      pieceID: 'tr10',
      at: table.center,
      altitude: 1,
      uid: 'T1',
      permissive: true,
    })
    const hex = hexAt(board, table.center, 1) as BoardHex
    const result = clickWithPen({ board, pieceID: 'tr10', hex })
    expect(result.added).toHaveLength(1)
    expect(result.conflictedPieceUIDs).toEqual(
      expect.arrayContaining(['T1', result.added[0].uid]),
    )
  })

  it('a second start zone on the same hex is a silent no-op', () => {
    const table = withGrassFloor(makeTable(9))
    const { board } = place({
      board: cloneBoard(table),
      pieceID: 'z1',
      at: table.center,
      altitude: 1,
      permissive: true,
    })
    const hex = hexAt(board, table.center, 1) as BoardHex
    const result = clickWithPen({ board, pieceID: 'z1', hex })
    expect(result.added).toEqual([])
    expect(snackbarMessages()).toEqual([])
    expect(result.selectedPieceIDs).toEqual([])
  })

  it('switches a non-stackable square pillar pen to the stackable version on a stack', () => {
    const { board, hex } = onPillar()
    const result = clickWithPen({
      board,
      pieceID: Pieces.laurWallSquarePillar,
      hex,
    })
    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      inventoryID: Pieces.laurWallPillarStackable,
      altitude: 9,
    })
    expect(useBoundStore.getState().penMode).toBe(
      Pieces.laurWallPillarStackable,
    )
    expect(snackbarMessages()).toEqual(['Placed the stackable version'])
    clickSnackbarAction(0, 'Undo')
    expect(useBoundStore.getState().boardPieces).toEqual(board.boardPieces)
  })

  it('switches a non-stackable short wall pen to the stackable version on a stack', () => {
    const { board, hex, addon } = onAddon(Pieces.laurWallShortStackable, 0)
    useBoundStore.setState({
      terrainConstraintSource: 'inventoryFile',
      customConstraintInventoryFileName: 'test-inventory.csv',
      customConstraintInventory: {
        [Pieces.laurWallShort]: 2,
        [Pieces.laurWallShortStackable]: 2,
      },
    })
    const result = clickWithPen({
      board,
      pieceID: Pieces.laurWallShort,
      hex,
    })
    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      inventoryID: Pieces.laurWallShortStackable,
      altitude: 9,
    })
    expect(evaluateLaurAddonConflicts([addon, result.added[0]], {})).toEqual([])
    expect(snackbarMessages()).toEqual(['Placed the stackable version'])
  })

  it('switches a non-stackable long wall pen to the stackable version on a stack', () => {
    const { board, hex, addon } = onAddon(Pieces.laurWallLongStackable, 0.5)
    const result = clickWithPen({
      board,
      pieceID: Pieces.laurWallLong,
      hex,
      rotation: 0.5,
    })
    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      inventoryID: Pieces.laurWallLongStackable,
      altitude: 9,
    })
    expect(evaluateLaurAddonConflicts([addon, result.added[0]], {})).toEqual([])
    expect(snackbarMessages()).toEqual(['Placed the stackable version'])
  })

  it('asks before switching when the stackable variant is out of inventory', () => {
    const { board, hex } = onAddon(Pieces.laurWallShortStackable, 0)
    useBoundStore.setState({
      terrainConstraintSource: 'inventoryFile',
      customConstraintInventoryFileName: 'test-inventory.csv',
      customConstraintInventory: {
        [Pieces.laurWallShort]: 2,
        [Pieces.laurWallShortStackable]: 0,
      },
    })
    const result = clickWithPen({
      board,
      pieceID: Pieces.laurWallShort,
      hex,
    })
    expect(result.added).toEqual([])
    expect(snackbar.mock.calls[0]?.[0]).toMatchObject({
      autoHideDuration: 5000,
    })
    expect(useBoundStore.getState().penMode).toBe(Pieces.laurWallShort)
    expect(snackbarMessages()).toEqual([
      'Non-stackable Laur pieces cannot be stacked, and their stackable versions are not in your inventory.',
    ])
    clickSnackbarAction(0, 'Switch anyway')
    expect(useBoundStore.getState().penMode).toBe(Pieces.laurWallShortStackable)
    const boardPieces = useBoundStore.getState().boardPieces
    expect(boardPieces[boardPieces.length - 1]).toMatchObject({
      inventoryID: Pieces.laurWallShortStackable,
      altitude: 9,
    })
    expect(snackbarMessages()).toEqual([
      'Non-stackable Laur pieces cannot be stacked, and their stackable versions are not in your inventory.',
      'Placed the stackable version',
    ])
  })

  it('undo takes a click placement back off the board', () => {
    const table = withGrassFloor(makeTable(9))
    const hex = hexAt(table, table.center, 1) as BoardHex
    const result = clickWithPen({ board: table, pieceID: 'tr10', hex })
    expect(result.added).toHaveLength(1)
    useBoundStore.temporal.getState().undo()
    const { boardPieces, boardHexes } = useBoundStore.getState()
    expect(boardPieces).toEqual(table.boardPieces)
    expect(boardHexes).toEqual(table.boardHexes)
  })

  /**
   * ShipBow.tsx used to hand the handler an empty object (`{}`) when its
   * deck was clicked with any pen but solid land, and the handler threw
   * reading `hex.pieceID`. ShipBow now ignores those clicks the way ShipWall
   * does, and the resolver ignores a pointer that is not a hex. (Was a
   * KNOWN GAP.)
   */
  it('clicking a ship bow deck with a tree pen does nothing', () => {
    const table = withGrassFloor(makeTable(9))
    const result = clickWithPen({
      board: table,
      pieceID: 'tr10',
      hex: {} as BoardHex,
    })
    expect(result.added).toEqual([])
    expect(result.selectedPieceIDs).toEqual([SELECTED_BEFORE_CLICK])
    expect(snackbarMessages()).toEqual([])
  })

  it('a piece that would hang off the map shows the message and places nothing', () => {
    const table = withGrassFloor(makeTable(9))
    const corner = hexAt(table, { q: 0, r: 0, s: 0 }, 1) as BoardHex
    const result = clickWithPen({ board: table, pieceID: 'g7', hex: corner })
    expect(result.added).toEqual([])
    expect(result.board.boardHexes).toEqual(table.boardHexes)
    expect(result.selectedPieceIDs).toEqual([SELECTED_BEFORE_CLICK])
    expect(snackbarMessages()).toEqual([
      'That piece would hang off the edge of the map.',
    ])
  })

  it('a battlement on the map edge facing out is still placed (it sits on the edge)', () => {
    const table = withGrassFloor(makeTable(9))
    const corner = hexAt(table, { q: 0, r: 0, s: 0 }, 1) as BoardHex
    // rotation 3 points west, off the map
    const result = clickWithPen({
      board: table,
      pieceID: 'bt',
      hex: corner,
      rotation: 3,
    })
    expect(result.added).toHaveLength(1)
    expect(snackbarMessages()).toEqual([])
  })

  /**
   * The only things that connect to a castle wall's top are the bottom of
   * another castle wall (without its base) and a wall-walk tile. Everything
   * else is refused with a message and places nothing. (Was a KNOWN GAP:
   * the castle-wall rule put any pen on the wall cap.)
   */
  it.each(['bt', 'rw', 'rl', 'g1', 'y0', 'tr10', 'ld'])(
    'only a castle wall or wall walk can go on a castle wall top, not %s',
    (pieceID) => {
      const { board, hex } = onCastleWall()
      const result = clickWithPen({ board, pieceID, hex })
      expect(result.added).toEqual([])
      expect(result.selectedPieceIDs).toEqual([SELECTED_BEFORE_CLICK])
      expect(snackbarMessages()).toEqual([
        'Only a castle wall or wall walk fits on a castle wall.',
      ])
    },
  )

  it.each(['lws', 'lwa'])(
    'a Laur add-on (%s) can be placed on a castle wall',
    (pieceID) => {
      const { board, hex } = onCastleWall()
      const result = clickWithPen({ board, pieceID, hex })
      expect(result.added).toHaveLength(1)
      expect(snackbarMessages()).toEqual([])
    },
  )

  /**
   * A triangle pillar cannot stack on a square pillar, or the other way
   * round. (Was a KNOWN GAP: it was placed at the lower pillar's base.)
   */
  it.each([
    { pieceID: 'lwt', on: 'square', setup: onPillar },
    { pieceID: 'lwp', on: 'triangle', setup: onTrianglePillar },
  ])(
    'a $pieceID pillar clicked on a $on pillar is not placed',
    ({ pieceID, setup }) => {
      const { board, hex } = setup()
      const result = clickWithPen({ board, pieceID, hex })
      expect(result.added).toEqual([])
      expect(snackbarMessages()).toEqual([
        'Triangle and square pillars do not stack.',
      ])
    },
  )
})

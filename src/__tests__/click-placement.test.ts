/**
 * CLICK PLACEMENT (world/MapDisplay3D.tsx onPointerUpPaintPiece)
 *
 * Characterization of what a left click with a piece pen does today, per
 * piece family, through the real handler and the real store (paintTile, which
 * places permissively). Nothing is rendered: MapDisplay3D's children are
 * stubbed, and the stubbed EmptyHexes hands back the handler (see
 * helpers/clickHandler.ts). The cases live in helpers/placementCases.ts.
 */
import { enqueueSnackbar } from 'notistack'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { placementBlockedMessages } from '../data/placement'
import useBoundStore from '../store/store'
import type { BoardHex } from '../types'
import {
  cloneBoard,
  hexAt,
  makeTable,
  place,
  withGrassFloor,
} from './helpers/board'
import { SELECTED_BEFORE_CLICK, clickWithPen } from './helpers/clickHandler'
import {
  onCastleWall,
  onPillar,
  onTrianglePillar,
  placementCases,
} from './helpers/placementCases'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))
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

beforeEach(() => {
  snackbar.mockClear()
})

describe('click placement through the real handler', () => {
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
    expect(added.inventoryID).toBe(pieceID)
    expect(added.pieceCoords).toEqual(coords)
    expect(added.rotation).toBe(placedRotation)
    if (altitude !== undefined) expect(added.altitude).toBe(altitude)
    // a placement clears the selection and shows no error
    expect(result.selectedPieceIDs).toEqual([])
    expect(snackbarMessages()).toEqual([])
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

  /**
   * Laur add-ons only attach to Laur pillars, castle walls included. (Was a
   * KNOWN GAP: the castle-wall rule ran before the add-on refusal.)
   */
  it.each(['lws', 'lwa'])(
    'a Laur add-on (%s) clicked on a castle wall is not placed',
    (pieceID) => {
      const { board, hex } = onCastleWall()
      const result = clickWithPen({ board, pieceID, hex })
      expect(result.added).toEqual([])
      expect(snackbarMessages()).toEqual([
        'Must add to Square/Triangle Pillar.',
      ])
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

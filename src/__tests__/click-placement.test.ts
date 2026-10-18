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
import { placementCases } from './helpers/placementCases'

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
      expect(snackbarMessages()).toEqual(
        expected.refused === 'needsLaurPillar'
          ? ['Must add to Square/Triangle Pillar.']
          : [],
      )
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
   * KNOWN GAP: ShipBow.tsx hands the handler an empty object (`{}`) when its
   * deck is clicked with any pen but solid land, and the handler reads
   * `hex.pieceID.includes(...)` on it, which throws a TypeError. The click
   * should do nothing instead. Suggested fix: pass the real deck hex from
   * ShipBow.tsx, or have the handler ignore a hex with no id.
   */
  it.fails(
    'KNOWN GAP: clicking a ship bow deck with a tree pen throws instead of doing nothing',
    () => {
      const table = withGrassFloor(makeTable(9))
      const result = clickWithPen({
        board: table,
        pieceID: 'tr10',
        hex: {} as BoardHex,
      })
      expect(result.added).toEqual([])
    },
  )
})

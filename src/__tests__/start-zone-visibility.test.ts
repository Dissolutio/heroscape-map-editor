import { createStore } from 'zustand/vanilla'
import { enqueueSnackbar } from 'notistack'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { getDraggableSelectionGroup } from '../data/dragMove'
import {
  filterVisiblePieceIDs,
  START_ZONES_HIDDEN_MESSAGE,
  shouldRenderPlacedPiece,
} from '../data/startZoneVisibility'
import createMapSlice from '../store/map-slice'
import createUISlice from '../store/ui-slice'
import type { AppState } from '../store/store'
import { Pieces, type HexMap } from '../types'
import { makeTable, place } from './helpers/board'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const hexMap: HexMap = {
  id: 'start-zone-visibility',
  name: 'Start Zone Visibility',
  author: '',
  version: 1,
  shape: 'rectangle',
  width: 10,
  length: 10,
}

const table = makeTable(10)
const startZoneBoard = place({
  board: table,
  pieceID: Pieces.startZone1,
  at: table.center,
  altitude: 0,
  uid: 'zone',
}).board
const board = place({
  board: startZoneBoard,
  pieceID: Pieces.grass1,
  at: {
    q: table.center.q + 3,
    r: table.center.r,
    s: table.center.s - 3,
  },
  altitude: 0,
  uid: 'land',
}).board
const zone = board.boardPieces.find((piece) => piece.uid === 'zone')
if (!zone) throw new Error('test setup: start-zone fixture is incomplete')
const pivot = {
  uid: zone.uid,
  coords: { ...zone.pieceCoords },
  pieceCoords: { ...zone.pieceCoords },
  pieceAltitude: zone.altitude,
  surfaceAltitude: zone.altitude + 1,
}

function createTestStore() {
  return createStore<AppState>()((...args) => ({
    ...createMapSlice(...args),
    ...createUISlice(...args),
  }))
}

const mockStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('start-zone visibility', () => {
  it('renders placed start zones only while the setting is on', () => {
    expect(
      shouldRenderPlacedPiece({ inventoryID: Pieces.startZone1 }, false),
    ).toBe(false)
    expect(shouldRenderPlacedPiece({ inventoryID: Pieces.grass1 }, false)).toBe(
      true,
    )
    expect(
      shouldRenderPlacedPiece({ inventoryID: Pieces.startZone1 }, true),
    ).toBe(true)
  })

  it('filters hidden start-zone IDs without changing other selection IDs', () => {
    expect(
      filterVisiblePieceIDs(['land', 'zone'], board.boardPieces, false),
    ).toEqual(['land'])
    expect(
      filterVisiblePieceIDs(['land', 'zone'], board.boardPieces, true),
    ).toEqual(['land', 'zone'])
  })

  it('clears hidden zones from selection and resets their pivot', () => {
    vi.stubGlobal('localStorage', mockStorage)
    const store = createTestStore()
    store.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      selectedPieceIDs: ['land', 'zone'],
      rotationPivot: pivot,
      hoveredPieceID: 'zone',
    })

    store.getState().toggleIsShowStartZones(false)

    expect(store.getState().isShowStartZones).toBe(false)
    expect(store.getState().selectedPieceIDs).toEqual(['land'])
    expect(store.getState().rotationPivot).toBeNull()
    expect(store.getState().hoveredPieceID).toBe('')

    store.getState().toggleSelectedPieceID('zone', true)
    expect(store.getState().selectedPieceIDs).toEqual(['land'])
  })

  it('does not put a hidden start zone in a draggable selection group', () => {
    expect(
      getDraggableSelectionGroup(['zone'], 'zone', board.boardPieces, false),
    ).toBeNull()
    expect(
      getDraggableSelectionGroup(
        ['zone', 'land'],
        'land',
        board.boardPieces,
        false,
      ),
    ).toBeNull()
  })

  it('filters hidden start-zone selections when a map is loaded', () => {
    vi.stubGlobal('localStorage', mockStorage)
    const store = createTestStore()
    store.setState({
      isShowStartZones: false,
      selectedPieceIDs: ['zone'],
      rotationPivot: pivot,
    })

    store.getState().loadMap(buildupJsonFileMap(board.boardPieces, hexMap), {
      holdAutosave: true,
    })

    expect(store.getState().selectedPieceIDs).toEqual([])
    expect(store.getState().rotationPivot).toBeNull()
  })

  it('does not restore a deleted start zone to selection while it is hidden', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', mockStorage)
    vi.resetModules()
    const [{ default: store }, undoUtils] = await Promise.all([
      import('../store/store'),
      import('../utils/undoWithSelectionRestore'),
    ])
    const temporal = store.temporal.getState()
    temporal.pause()
    store
      .getState()
      .loadMap(buildupJsonFileMap([zone], hexMap), { holdAutosave: true })
    temporal.clear()
    temporal.resume()

    store.getState().toggleSelectedPieceID('zone')
    store.getState().pushPendingUndoSelectionRestore(['zone'])
    store.getState().unpaintTile('zone')
    store.getState().toggleSelectedPieceID('')
    store.getState().toggleIsShowStartZones(false)

    undoUtils.undoWithSelectionRestore()

    expect(store.getState().boardPieces.map((piece) => piece.uid)).toContain(
      'zone',
    )
    expect(store.getState().selectedPieceIDs).toEqual([])
    expect(store.getState().pendingRedoSelectionRestoreStack).toEqual([])
  })

  it('notifies when an in-progress start-zone drag drops while hidden', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', mockStorage)
    vi.resetModules()
    const { default: store } = await import('../store/store')
    const { commitMoveDecision } = await import('../world/drag/dragController')
    const temporal = store.temporal.getState()
    temporal.pause()
    store
      .getState()
      .loadMap(buildupJsonFileMap([zone], hexMap), { holdAutosave: true })
    temporal.clear()
    temporal.resume()
    store.getState().toggleIsShowStartZones(false)
    vi.clearAllMocks()

    const newPieceCoords = {
      q: table.center.q + 1,
      r: table.center.r,
      s: table.center.s - 1,
    }
    commitMoveDecision({
      type: 'move',
      uid: 'zone',
      newPieceCoords,
      newAltitude: 0,
      newRotation: 0,
    })

    expect(enqueueSnackbar).toHaveBeenCalledWith({
      message: START_ZONES_HIDDEN_MESSAGE,
      variant: 'info',
    })
    expect(
      store.getState().boardPieces.find((piece) => piece.uid === 'zone')
        ?.pieceCoords,
    ).toEqual(newPieceCoords)
  })
})

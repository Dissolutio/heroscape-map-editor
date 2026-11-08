import { createStore } from 'zustand/vanilla'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isGlyphBoardPiece,
  shouldRenderPlacedPiece,
} from '../data/startZoneVisibility'
import createActionLogSlice from '../store/action-log-slice'
import createMapSlice from '../store/map-slice'
import createUISlice from '../store/ui-slice'
import type { AppState } from '../store/store'
import { Pieces } from '../types'
import { makeTable, place } from './helpers/board'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const table = makeTable(12)
const floorBoard = place({
  board: table,
  pieceID: Pieces.grass1,
  at: table.center,
  altitude: 0,
  uid: 'floor',
}).board
const glyphBoard = place({
  board: floorBoard,
  pieceID: Pieces.glyphPower,
  at: table.center,
  altitude: 1,
  uid: 'glyph',
}).board
const board = place({
  board: glyphBoard,
  pieceID: Pieces.grass1,
  at: {
    q: table.center.q + 4,
    r: table.center.r,
    s: table.center.s - 4,
  },
  altitude: 0,
  uid: 'land',
}).board
const glyphHex = Object.values(board.boardHexes).find(
  (hex) => hex.boardPieceUID === 'glyph',
)
if (!glyphHex) throw new Error('test setup: glyph fixture is incomplete')
const glyph = board.boardPieces.find((piece) => piece.uid === 'glyph')
if (!glyph) throw new Error('test setup: glyph piece is incomplete')

function createTestStore() {
  return createStore<AppState>()((...args) => ({
    ...createMapSlice(...args),
    ...createUISlice(...args),
    ...createActionLogSlice(...args),
  }))
}

const mockStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('glyph visibility', () => {
  it('starts on and suppresses the complete placed glyph when hidden', () => {
    const store = createTestStore()

    expect(store.getState().isShowGlyphs).toBe(true)
    expect(isGlyphBoardPiece(glyph)).toBe(true)
    expect(shouldRenderPlacedPiece(glyph, true, false)).toBe(false)
    expect(
      shouldRenderPlacedPiece({ inventoryID: Pieces.grass1 }, true, false),
    ).toBe(true)
  })

  it('drops hidden glyphs from selection and rejects click and set-selection', () => {
    vi.stubGlobal('localStorage', mockStorage)
    const store = createTestStore()
    store.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      viewingLevel: 3,
      selectedPieceIDs: ['land', 'glyph'],
      rotationPivot: {
        uid: 'glyph',
        coords: { ...glyph.pieceCoords },
        pieceCoords: { ...glyph.pieceCoords },
        pieceAltitude: glyph.altitude,
        surfaceAltitude: glyph.altitude + 1,
      },
      hoveredPieceID: 'glyph',
      hoveredHex: glyphHex,
      hoveredWorldPoint: { x: 1, z: 2 },
    })

    store.getState().toggleIsShowGlyphs(false)

    expect(store.getState().selectedPieceIDs).toEqual(['land'])
    expect(store.getState().rotationPivot).toBeNull()
    expect(store.getState().hoveredPieceID).toBe('')
    expect(store.getState().hoveredHex).toBeUndefined()
    expect(store.getState().hoveredWorldPoint).toBeUndefined()

    store.getState().toggleSelectedPieceID('glyph')
    store.getState().setSelectedPieceIDs(['glyph', 'land'])
    expect(store.getState().selectedPieceIDs).toEqual(['land'])

    store.getState().toggleIsShowGlyphs(true)
    expect(store.getState().selectedPieceIDs).toEqual(['land'])
    expect(store.getState().rotationPivot).toBeNull()
    store.getState().toggleSelectedPieceID('glyph')
    expect(store.getState().selectedPieceIDs).toEqual(['glyph'])
  })

  it('does not set hover state to a hidden glyph', () => {
    vi.stubGlobal('localStorage', mockStorage)
    const store = createTestStore()
    store.setState({
      boardPieces: board.boardPieces,
      isShowGlyphs: false,
    })

    store.getState().toggleHoveredPieceID('glyph')

    expect(store.getState().hoveredPieceID).toBe('')
  })
})

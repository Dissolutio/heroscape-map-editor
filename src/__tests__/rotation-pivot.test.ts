import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  createRotationPivot,
  getClosestOwnedPieceHex,
  resolveRotationPivot,
  shouldSetRotationPivotOnClick,
} from '../data/rotationPivot'
import { Pieces, type BoardHex, type BoardPiece } from '../types'
import { genBoardHexID, getBoardHex3DCoords } from '../utils/map-utils'
import { makeTable, place } from './helpers/board'

const otherHex = (hexes: BoardHex[], piece: BoardPiece): BoardHex | undefined =>
  hexes.find(
    (hex) =>
      hex.boardPieceUID === piece.uid &&
      (hex.q !== piece.pieceCoords.q || hex.r !== piece.pieceCoords.r),
  )

async function loadStore() {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  vi.resetModules()
  const [{ default: store }, undoUtils] = await Promise.all([
    import('../store/store'),
    import('../utils/undoWithSelectionRestore'),
  ])
  return {
    store,
    undoWithSelectionRestore: undoUtils.undoWithSelectionRestore,
    redoWithSelectionRestore: undoUtils.redoWithSelectionRestore,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('group rotation pivot resolution', () => {
  const table = makeTable(12)
  const tileBoard = place({
    board: table,
    pieceID: Pieces.grass3,
    at: table.center,
    altitude: 0,
    uid: 'tile',
  }).board
  const board = place({
    board: tileBoard,
    pieceID: Pieces.rock1,
    at: { q: table.center.q + 4, r: table.center.r, s: table.center.s - 4 },
    altitude: 0,
    uid: 'other',
  }).board
  const tile = board.boardPieces.find((piece) => piece.uid === 'tile')
  if (!tile) throw new Error('test setup: missing multi-hex tile')
  const clickedHex = otherHex(Object.values(board.boardHexes), tile)
  if (!clickedHex) throw new Error('test setup: missing non-origin hex')
  const pivot = createRotationPivot(tile, clickedHex)
  if (!pivot) throw new Error('test setup: could not create pivot')
  const movedTilePieces = board.boardPieces.map((piece) =>
    piece.uid === 'tile'
      ? {
          ...piece,
          pieceCoords: {
            q: piece.pieceCoords.q + 1,
            r: piece.pieceCoords.r,
            s: piece.pieceCoords.s - 1,
          },
        }
      : piece,
  )
  const movedTile = movedTilePieces.find((piece) => piece.uid === 'tile')
  if (!movedTile) throw new Error('test setup: moved tile is missing')

  it('uses a valid clicked non-origin footprint hex', () => {
    expect(
      resolveRotationPivot(
        ['other', 'tile'],
        board.boardPieces,
        board.boardHexes,
        pivot,
      ),
    ).toEqual({
      coords: { q: clickedHex.q, r: clickedHex.r, s: clickedHex.s },
      surfaceAltitude: clickedHex.altitude,
    })
  })

  it('resolves the closest owned hex from a model pointer position', () => {
    const position = getBoardHex3DCoords(clickedHex)
    const resolved = getClosestOwnedPieceHex(board.boardHexes, 'tile', {
      x: position.x,
      z: position.z,
    })
    expect(resolved).toEqual(clickedHex)
  })

  it.each([
    {
      reason: 'no stored click',
      selected: ['other', 'tile'],
      stored: null,
      pieces: board.boardPieces,
      hexes: board.boardHexes,
      expected: tile,
    },
    {
      reason: 'a different last selection',
      selected: ['tile', 'other'],
      stored: pivot,
      pieces: board.boardPieces,
      hexes: board.boardHexes,
      expected: board.boardPieces.find((piece) => piece.uid === 'other'),
    },
    {
      reason: 'a moved piece',
      selected: ['other', 'tile'],
      stored: pivot,
      pieces: movedTilePieces,
      hexes: board.boardHexes,
      expected: movedTile,
    },
    {
      reason: 'a footprint hex that is no longer owned',
      selected: ['other', 'tile'],
      stored: pivot,
      pieces: board.boardPieces,
      hexes: Object.fromEntries(
        Object.entries(board.boardHexes).filter(
          ([id]) =>
            id !==
            genBoardHexID({
              ...clickedHex,
              altitude: clickedHex.altitude,
            }),
        ),
      ),
      expected: tile,
    },
    {
      reason: 'a selection restored without its transient pivot',
      selected: ['other', 'tile'],
      stored: null,
      pieces: board.boardPieces,
      hexes: board.boardHexes,
      expected: tile,
    },
  ])('falls back to the selected piece origin for $reason', (testCase) => {
    const resolved = resolveRotationPivot(
      testCase.selected,
      testCase.pieces,
      testCase.hexes,
      testCase.stored,
    )
    if (!testCase.expected)
      throw new Error('test setup: missing fallback piece')
    expect(resolved?.coords).toEqual(testCase.expected.pieceCoords)
    expect(resolved?.surfaceAltitude).toBe(testCase.expected.altitude + 1)
  })

  it('has no resolved pivot when the selection is empty', () => {
    expect(
      resolveRotationPivot([], board.boardPieces, board.boardHexes, pivot),
    ).toBeUndefined()
  })

  it('only treats another clicked footprint hex of the last piece as a pivot click', () => {
    const originHex =
      board.boardHexes[
        genBoardHexID({ ...tile.pieceCoords, altitude: clickedHex.altitude })
      ]
    if (!originHex) throw new Error('test setup: missing origin hex')

    expect(
      shouldSetRotationPivotOnClick(
        ['other', 'tile'],
        board.boardPieces,
        board.boardHexes,
        null,
        clickedHex,
        false,
      ),
    ).toBe(true)
    expect(
      shouldSetRotationPivotOnClick(
        ['other', 'tile'],
        board.boardPieces,
        board.boardHexes,
        pivot,
        clickedHex,
        false,
      ),
    ).toBe(false)
    expect(
      shouldSetRotationPivotOnClick(
        ['other', 'tile'],
        board.boardPieces,
        board.boardHexes,
        null,
        originHex,
        false,
      ),
    ).toBe(false)
    expect(
      shouldSetRotationPivotOnClick(
        ['other', 'tile'],
        board.boardPieces,
        board.boardHexes,
        null,
        clickedHex,
        true,
      ),
    ).toBe(false)
    expect(
      shouldSetRotationPivotOnClick(
        ['tile'],
        board.boardPieces,
        board.boardHexes,
        null,
        clickedHex,
        false,
      ),
    ).toBe(false)
  })

  it('does not revive a pivot after the selection changes away and back', async () => {
    const { store } = await loadStore()
    const temporal = store.temporal.getState()
    temporal.pause()
    store.getState().loadMap(
      buildupJsonFileMap(board.boardPieces, {
        id: 'pivot-selection',
        name: 'Pivot selection',
        author: '',
        shape: 'rectangle',
        width: 12,
        length: 12,
      }),
      { holdAutosave: true },
    )
    temporal.clear()
    temporal.resume()
    store.setState({
      selectedPieceIDs: ['other', 'tile'],
      rotationPivot: null,
    })
    const clickedPosition = getBoardHex3DCoords(clickedHex)
    store.getState().toggleSelectedPieceID('tile', false, {
      x: clickedPosition.x,
      z: clickedPosition.z,
    })
    expect(store.getState().selectedPieceIDs).toEqual(['other', 'tile'])
    expect(store.getState().rotationPivot?.coords).toEqual({
      q: clickedHex.q,
      r: clickedHex.r,
      s: clickedHex.s,
    })

    store.getState().toggleSelectedPieceID('tile', true)
    expect(store.getState().selectedPieceIDs).toEqual(['other'])
    store.getState().toggleSelectedPieceID('tile', true)

    expect(store.getState().selectedPieceIDs).toEqual(['other', 'tile'])
    expect(store.getState().rotationPivot).toBeNull()
    expect(
      resolveRotationPivot(
        store.getState().selectedPieceIDs,
        store.getState().boardPieces,
        store.getState().boardHexes,
        store.getState().rotationPivot,
      )?.coords,
    ).toEqual(tile.pieceCoords)
  })

  it('clears the transient pivot on map load, movement, undo and redo', async () => {
    const { store, undoWithSelectionRestore, redoWithSelectionRestore } =
      await loadStore()
    const map = buildupJsonFileMap(board.boardPieces, {
      id: 'pivot-reset',
      name: 'Pivot reset',
      author: '',
      shape: 'rectangle',
      width: 12,
      length: 12,
    })
    const temporal = store.temporal.getState()
    temporal.pause()
    store.getState().loadMap(map, { holdAutosave: true })
    temporal.clear()
    temporal.resume()

    store.getState().setRotationPivot(pivot)
    store.getState().loadMap(map, { holdAutosave: true })
    expect(store.getState().rotationPivot).toBeNull()

    store.setState({
      selectedPieceIDs: ['other', 'tile'],
      rotationPivot: pivot,
    })
    const piece = store
      .getState()
      .boardPieces.find((candidate) => candidate.uid === 'tile')
    if (!piece) throw new Error('test setup: missing tile')
    store.getState().movePieces({
      moves: [
        {
          uid: piece.uid,
          newPieceCoords: {
            q: piece.pieceCoords.q + 1,
            r: piece.pieceCoords.r,
            s: piece.pieceCoords.s - 1,
          },
        },
      ],
    })
    expect(store.getState().rotationPivot).toBeNull()

    store.getState().setRotationPivot(pivot)
    undoWithSelectionRestore()
    expect(store.getState().rotationPivot).toBeNull()
    store.getState().setRotationPivot(pivot)
    redoWithSelectionRestore()
    expect(store.getState().rotationPivot).toBeNull()
  })
})

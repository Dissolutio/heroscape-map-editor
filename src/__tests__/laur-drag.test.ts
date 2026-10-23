/**
 * Laur drag-to-move: characterize the existing boardPieces-only add-on and
 * grid-backed pillar move behavior before enabling either terrain for drag.
 */
import { describe, expect, it } from 'vitest'
import { addPiece } from '../data/addPiece'
import { applyPieceMoves } from '../data/movePieces'
import { piecesSoFar } from '../data/pieces'
import { removePiece } from '../data/removePiece'
import { HexTerrain } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { type Board, hexAt, makeTable, place } from './helpers/board'

describe('Laur piece move characterization', () => {
  it('an add-on is stored only in boardPieces and moves without grid expansion', () => {
    const table = makeTable()
    const addon = piecesSoFar.lws
    const start = table.center
    const destination = hexUtilsAdd(start, HEX_DIRECTIONS[0])
    const added = addPiece({
      piece: addon,
      boardHexes: table.boardHexes,
      boardPieces: table.boardPieces,
      pieceCoords: start,
      placementAltitude: 0,
      rotation: 0,
      isVsTile: false,
      uid: 'addon',
    })

    expect(added.error).toBeUndefined()
    expect(added.newBoardHexes).toEqual(table.boardHexes)
    expect(added.newBoardPieces).toHaveLength(1)

    const moved = applyPieceMoves(
      {
        boardHexes: added.newBoardHexes,
        boardPieces: added.newBoardPieces,
        conflictedPieceUIDs: [],
      },
      [{ uid: 'addon', newPieceCoords: destination }],
    )

    expect(moved?.boardPieces).toEqual([
      {
        uid: 'addon',
        inventoryID: addon.id,
        altitude: 0,
        rotation: 0,
        pieceCoords: destination,
      },
    ])
    expect(moved?.boardHexes).toEqual(table.boardHexes)

    const removed = removePiece({
      uid: 'addon',
      boardHexes: moved?.boardHexes ?? {},
      boardPieces: moved?.boardPieces ?? [],
    })
    expect(removed.error).toBeUndefined()
    expect(removed.newBoardHexes).toEqual(table.boardHexes)
    expect(removed.newBoardPieces).toEqual([])
  })

  it('a pillar move rebuilds its grid expansion and preserves its identity', () => {
    const table = makeTable()
    const start = table.center
    const destination = hexUtilsAdd(start, HEX_DIRECTIONS[0])
    const placed = place({
      board: table,
      pieceID: 'lwp',
      at: start,
      altitude: 0,
      rotation: 0,
      uid: 'pillar',
    })

    expect(placed.error).toBeUndefined()
    expect(
      Object.values(placed.board.boardHexes).some(
        (hex) => hex.boardPieceUID === 'pillar',
      ),
    ).toBe(true)

    const moved = applyPieceMoves(
      {
        ...placed.board,
        conflictedPieceUIDs: [],
      },
      [{ uid: 'pillar', newPieceCoords: destination }],
    )
    const movedPillar = moved?.boardPieces.find(
      (piece) => piece.uid === 'pillar',
    )

    expect(movedPillar).toMatchObject({
      uid: 'pillar',
      inventoryID: piecesSoFar.lwp.id,
      pieceCoords: destination,
    })
    expect(
      Object.values(moved?.boardHexes ?? {}).some(
        (hex) =>
          hex.boardPieceUID === 'pillar' &&
          hex.q === destination.q &&
          hex.r === destination.r,
      ),
    ).toBe(true)
    expect(hexAt(placed.board, start, 1)?.boardPieceUID).toBe('pillar')
    expect(hexAt(moved ?? table, start, 1)?.boardPieceUID).not.toBe('pillar')
  })

  it('moving a pillar leaves its add-on at the old attachment site', () => {
    const table = makeTable()
    const start = table.center
    const destination = hexUtilsAdd(start, HEX_DIRECTIONS[0])
    const withPillar = place({
      board: table,
      pieceID: 'lwp',
      at: start,
      altitude: 0,
      uid: 'pillar',
    })
    const withAddon = place({
      board: withPillar.board,
      pieceID: 'lws',
      at: start,
      altitude: 0,
      uid: 'addon',
    })

    expect(withPillar.error).toBeUndefined()
    expect(withAddon.error).toBeUndefined()
    expect(withAddon.board.boardPieces).toHaveLength(2)
    expect(
      withAddon.board.boardHexes[
        Object.keys(withAddon.board.boardHexes).find((id) => {
          const hex = withAddon.board.boardHexes[id]
          return hex.q === start.q && hex.r === start.r && hex.altitude === 0
        }) ?? ''
      ]?.terrain,
    ).not.toBe(HexTerrain.laurWallAddon)

    const moved = applyPieceMoves(
      {
        ...withAddon.board,
        conflictedPieceUIDs: [],
      },
      [{ uid: 'pillar', newPieceCoords: destination }],
    )

    expect(
      moved?.boardPieces.find((piece) => piece.uid === 'addon'),
    ).toMatchObject({
      uid: 'addon',
      inventoryID: piecesSoFar.lws.id,
      pieceCoords: start,
    })
  })

  it('moving stacked Laur pieces preserves their inventory IDs', () => {
    const table = makeTable()
    let board: Board = table
    const lower = table.center
    const lowerFar = hexUtilsAdd(lower, HEX_DIRECTIONS[0])
    const upper = hexUtilsAdd(lower, HEX_DIRECTIONS[2])
    for (const [uid, coords, altitude] of [
      ['lower-pillar', lower, 0],
      ['lower-far', lowerFar, 0],
      ['upper-pillar', lower, 8],
      ['upper-far', lowerFar, 8],
    ] as const) {
      const placed = place({
        board,
        pieceID: 'lwp',
        at: coords,
        altitude,
        uid,
      })
      expect(placed.error).toBeUndefined()
      board = placed.board
    }
    for (const [uid, coords, altitude] of [
      ['lower-addon', lower, 0],
      ['upper-addon', lower, 8],
    ] as const) {
      const placed = place({
        board,
        pieceID: 'lws2',
        at: coords,
        altitude,
        uid,
      })
      expect(placed.error).toBeUndefined()
      board = placed.board
    }

    const moved = applyPieceMoves(
      {
        ...board,
        conflictedPieceUIDs: [],
      },
      [
        { uid: 'upper-pillar', newPieceCoords: upper },
        { uid: 'upper-addon', newPieceCoords: upper },
      ],
    )

    expect(moved?.boardPieces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: 'upper-pillar',
          inventoryID: piecesSoFar.lwp.id,
          altitude: 8,
          pieceCoords: upper,
        }),
        expect.objectContaining({
          uid: 'upper-addon',
          inventoryID: piecesSoFar.lws2.id,
          altitude: 8,
          pieceCoords: upper,
        }),
      ]),
    )
  })
})

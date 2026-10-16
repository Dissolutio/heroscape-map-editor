/**
 * REPLAY AND CONFLICTS (data/rebuildBoardState.ts)
 *
 * boardHexes is derived state. On load, and again after every paint, move,
 * convert and delete, the app recomputes which pieces are "in conflict" by
 * replaying boardPieces in array order onto an empty board with permissive
 * placement. A conflict is exactly "two pieces claimed the same hex": the
 * later piece takes the hex and both pieces are reported.
 *
 * That is a deliberately narrow definition, and the tests below pin what it
 * does and does not catch. The agent notes already say collision mapping is
 * incomplete; this is where that boundary is.
 */
import { describe, expect, it } from 'vitest'
import { rebuildBoardStateFromPieces } from '../data/rebuildBoardState'
import type { BoardPiece } from '../types'
import { type Board, hexAt, makeTable, place, remove } from './helpers/board'

const table = makeTable()
const C = table.center
const east = { q: C.q + 1, r: C.r, s: C.s - 1 }

const bp = (
  uid: string,
  inventoryID: string,
  at = C,
  altitude = 0,
  rotation = 0,
): BoardPiece => ({ uid, inventoryID, altitude, rotation, pieceCoords: at })

const sorted = (xs: string[]) => [...xs].sort()

describe('rebuildBoardStateFromPieces', () => {
  it('a map with no overlaps replays to exactly what placing the pieces one at a time gives', () => {
    let board: Board = table
    board = place({
      board,
      pieceID: 'g1',
      at: C,
      altitude: 0,
      uid: 'floor',
    }).board
    board = place({
      board,
      pieceID: 'g1',
      at: C,
      altitude: 1,
      uid: 'upper',
    }).board
    board = place({
      board,
      pieceID: 'r1',
      at: east,
      altitude: 0,
      uid: 'neighbor',
    }).board

    const replayed = rebuildBoardStateFromPieces(board.boardPieces)
    expect(replayed.conflictedPieceUIDs).toEqual([])
    expect(replayed.boardPieces.map((p) => p.uid)).toEqual([
      'floor',
      'upper',
      'neighbor',
    ])
    expect(replayed.boardHexes).toEqual(
      // the replay starts from nothing, so compare only the hexes that exist
      // after placement (the empty table hexes are not part of a replay)
      Object.fromEntries(
        Object.entries(board.boardHexes).filter(
          ([, hex]) => hex.terrain !== 'empty',
        ),
      ),
    )
  })

  it('overlapping pieces: BOTH the piece that lost the hex and the one that took it are reported', () => {
    const { conflictedPieceUIDs } = rebuildBoardStateFromPieces([
      bp('first', 'g1'),
      bp('second', 'r1'),
    ])
    expect(sorted(conflictedPieceUIDs)).toEqual(['first', 'second'])
  })

  it('a piece that overlaps nothing is never reported', () => {
    const { conflictedPieceUIDs } = rebuildBoardStateFromPieces([
      bp('a', 'g1'),
      bp('b', 'g1', east),
      bp('c', 'g1', C, 1),
    ])
    expect(conflictedPieceUIDs).toEqual([])
  })

  it('the LAST piece in the array owns a contested hex, so array order is meaningful', () => {
    const ab = rebuildBoardStateFromPieces([bp('a', 'g1'), bp('b', 'r1')])
    const ba = rebuildBoardStateFromPieces([bp('b', 'r1'), bp('a', 'g1')])
    expect(hexAt(ab, C, 1)?.boardPieceUID).toBe('b')
    expect(hexAt(ba, C, 1)?.boardPieceUID).toBe('a')
    // the conflict LIST is the same either way; the surface the map shows is not
    expect(sorted(ab.conflictedPieceUIDs)).toEqual(
      sorted(ba.conflictedPieceUIDs),
    )
  })

  it('pieces with an unregistered inventoryID are skipped: not rebuilt, not conflicts', () => {
    const result = rebuildBoardStateFromPieces([
      bp('real', 'g1'),
      bp('mystery', 'zz-from-the-future'),
    ])
    expect(result.boardPieces.map((p) => p.uid)).toEqual(['real'])
    expect(result.conflictedPieceUIDs).toEqual([])
  })

  it('an empty map is fine', () => {
    expect(rebuildBoardStateFromPieces([])).toEqual({
      boardHexes: {},
      boardPieces: [],
      conflictedPieceUIDs: [],
    })
  })

  it.fails(
    'KNOWN GAP: a piece left floating after its support is deleted is reported as a problem',
    () => {
      // app-requirements.md lists, as a must-have inherited from Virtualscape,
      // "verify basic physics: every piece has something underneath it". Strict
      // placement does check this (see "land needs support" in
      // place-and-remove.test.ts), but the app places and loads with
      // `permissive: true` and the only thing permissive mode reports is a
      // displaced hex. So deleting the bottom of a stack silently leaves the
      // top piece hovering in the air: no error from removePiece, and no
      // conflict here.
      //
      // The contract asserted below (flag it in conflictedPieceUIDs) is a
      // proposal. A separate "unsupported" list would be equally reasonable;
      // change this test to match the design you choose.
      let board: Board = table
      board = place({
        board,
        pieceID: 'g1',
        at: C,
        altitude: 0,
        uid: 'bottom',
      }).board
      board = place({
        board,
        pieceID: 'g1',
        at: C,
        altitude: 1,
        uid: 'top',
      }).board

      const afterDelete = remove(board, 'bottom')
      expect(afterDelete.error).toBeUndefined() // nothing objected to the delete

      const { conflictedPieceUIDs } = rebuildBoardStateFromPieces(
        afterDelete.board.boardPieces,
      )
      expect(conflictedPieceUIDs).toContain('top')
    },
  )
})

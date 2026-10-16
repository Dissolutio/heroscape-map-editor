/**
 * PIECE IDS, SERIALIZATION AND MAP LOADING
 *
 * A saved or shared map is just the map header plus a list of pieces, and each
 * piece is fully described by "altitude~q~r~rotation~inventoryID". Everything
 * else (boardHexes, conflicts) is rebuilt on load. These tests cover that
 * round trip and the load path (`buildupJsonFileMap`), where bad or
 * unexpected data enters the app.
 *
 * Not covered: JSONCrush compression (data/jsonCrush.ts), which needs the real
 * `jsoncrush` package, and the Virtualscape reader/writer.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import type { BoardPiece, HexMap } from '../types'
import {
  decodePieceID,
  encodeBoardPiecesToIds,
  genBoardHexID,
  getBoardPiecesMaxLevel,
  inflateBoardPiecesFromIds,
  normalizeBoardPieces,
} from '../utils/map-utils'
import { hexAt, makeTable } from './helpers/board'

const piece = (
  uid: string,
  inventoryID: string,
  q: number,
  r: number,
  altitude = 0,
  rotation = 0,
): BoardPiece => ({
  uid,
  inventoryID,
  altitude,
  rotation,
  pieceCoords: { q, r, s: -q - r },
})

const rectangleMap = (size = 15): HexMap => ({
  id: 'test-map',
  name: 'Test Map',
  author: '',
  version: 1,
  shape: 'rectangle',
  length: size,
  width: size,
})

describe('piece ids', () => {
  it('an id is altitude~q~r~rotation~inventoryID', () => {
    const ids = encodeBoardPiecesToIds([piece('u1', 'tr10', 4, -2, 3, 1.5)])
    expect(ids).toEqual(['3~4~-2~1.5~tr10'])
  })

  it('encode -> inflate round-trips everything except the (regenerated) uid', () => {
    const original = [
      piece('a', 'g24', 0, 0, 0, 0),
      piece('b', 'tr10', -3, 5, 2, 4),
      piece('c', 'lwl', 7, -9, 1, 1.5), // laur wall addons use half-step rotations
      piece('d', 'cwc', -1, -1, 5, 5),
    ]
    const inflated = inflateBoardPiecesFromIds(encodeBoardPiecesToIds(original))
    const strip = ({ uid: _uid, ...rest }: BoardPiece) => rest
    expect(inflated.map(strip)).toEqual(original.map(strip))
    // every inflated piece gets its own fresh uid
    expect(new Set(inflated.map((p) => p.uid)).size).toBe(inflated.length)
  })

  it('decoding recovers the origin hex and derives s from q and r', () => {
    const decoded = decodePieceID('2~-4~6~3~r7')
    expect(decoded.pieceCoords).toEqual({ q: -4, r: 6, s: -2 })
    expect(decoded.boardHexID).toBe(
      genBoardHexID({ q: -4, r: 6, s: -2, altitude: 2 }),
    )
    expect(decoded.terrain).toBe(piecesSoFar.r7.terrain)
  })

  it('decoding tolerates an inventoryID this app does not know (terrain "empty")', () => {
    // Forward-compat for maps from a newer version. See the load tests below
    // for what happens to such pieces afterwards.
    expect(decodePieceID('0~1~1~0~not-a-real-piece').terrain).toBe('empty')
  })

  it('getBoardPiecesMaxLevel is one above the highest placement altitude (0 when empty)', () => {
    expect(getBoardPiecesMaxLevel([])).toBe(0)
    expect(getBoardPiecesMaxLevel([piece('a', 'g1', 0, 0, 0)])).toBe(1)
    expect(
      getBoardPiecesMaxLevel([
        piece('a', 'g1', 0, 0, 0),
        piece('b', 'g1', 0, 0, 4),
      ]),
    ).toBe(5)
  })
})

describe('normalizeBoardPieces (reads every saved-map format the app has had)', () => {
  it('passes the current BoardPiece[] format through untouched', () => {
    const current = [piece('a', 'g1', 0, 0)]
    expect(normalizeBoardPieces(current)).toBe(current)
  })

  it('upgrades a legacy string[] of piece ids', () => {
    const [p] = normalizeBoardPieces(['1~2~3~0~g1'])
    expect(p).toMatchObject({
      inventoryID: 'g1',
      altitude: 1,
      rotation: 0,
      pieceCoords: { q: 2, r: 3, s: -5 },
    })
    expect(typeof p.uid).toBe('string')
  })

  it('upgrades the oldest format, an object keyed by piece id', () => {
    const result = normalizeBoardPieces({
      '0~1~1~0~g1': 'g1',
      '0~2~1~0~g2': 'g2',
    })
    expect(result.map((p) => p.inventoryID).sort()).toEqual(['g1', 'g2'])
  })

  it('treats an empty array as an empty map', () => {
    expect(normalizeBoardPieces([])).toEqual([])
  })

  it.fails(
    'KNOWN GAP: piece objects without a uid are rejected, not turned into NaN pieces',
    () => {
      // A BoardPiece[] whose first element has no `uid` (hand-edited file, a
      // build from before uids existed, a typo) fails the "current format" check,
      // then falls through to the LAST branch, which treats the array as an
      // object keyed by piece id: Object.keys([...]) is ["0", "1", ...], so each
      // piece is "decoded" from the string "0" and comes back with inventoryID
      // undefined and q/r/s/rotation NaN. Nothing throws; the corrupt pieces flow
      // on into the map (and from there into localStorage on the next autosave).
      //
      // Either returning [] or throwing would be better; update this test to
      // whichever you choose.
      const uidLess = [
        {
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 1, r: 1, s: -2 },
        },
      ]
      let result: BoardPiece[] = []
      try {
        result = normalizeBoardPieces(uidLess)
      } catch {
        // rejecting bad input is an acceptable outcome
      }
      const isSane = (p: BoardPiece) =>
        p.inventoryID in piecesSoFar && Number.isFinite(p.pieceCoords.q)
      expect(result.every(isSane)).toBe(true)
    },
  )
})

describe('buildupJsonFileMap (the load path for files, links and localStorage)', () => {
  const table = makeTable()
  const { q, r } = table.center

  it('rebuilds boardHexes from the piece list: a 1-hex grass tile tops out at altitude 1', () => {
    const map = buildupJsonFileMap([piece('a', 'g1', q, r, 0)], rectangleMap())
    expect(map.boardPieces).toHaveLength(1)
    expect(hexAt(map, table.center, 1)).toMatchObject({
      terrain: 'grass',
      boardPieceUID: 'a',
      isCap: true,
    })
    // the table hex underneath is still there, but no longer a visible cap
    expect(hexAt(map, table.center, 0)).toMatchObject({
      terrain: 'empty',
      isCap: false,
    })
  })

  it('stacks pieces by altitude regardless of the order they are listed in', () => {
    const upperFirst = [
      piece('top', 'g1', q, r, 1),
      piece('bottom', 'g1', q, r, 0),
    ]
    const map = buildupJsonFileMap(upperFirst, rectangleMap())
    expect(hexAt(map, table.center, 2)).toMatchObject({ boardPieceUID: 'top' })
    expect(hexAt(map, table.center, 1)).toMatchObject({
      boardPieceUID: 'bottom',
    })
  })

  it('migrates a legacy hexagon map (no version) by growing its size by one', () => {
    const legacy: HexMap = {
      ...rectangleMap(),
      shape: 'hexagon',
      length: 5,
      width: 5,
      version: undefined,
    }
    const map = buildupJsonFileMap([], legacy)
    expect(map.hexMap).toMatchObject({ version: 1, length: 6, width: 6 })
  })

  it.fails(
    'KNOWN GAP: pieces this app does not recognize are kept, not silently dropped',
    () => {
      // A shared link or file from a NEWER version can contain an inventoryID
      // this version has never heard of (the desktop app auto-updates but is not
      // always current). buildupJsonFileMap skips it ("Should probably handle
      // this different, errors etc." says the comment in the source), the user
      // gets a map with a hole in it and no warning, and the next autosave to
      // localStorage / re-export makes the loss permanent.
      //
      // Keeping unknown pieces in boardPieces (without placing hexes) would
      // preserve them, but see "removePiece" in place-and-remove.test.ts: that
      // currently crashes on exactly such pieces, so the two fixes go together.
      const withUnknown = [
        piece('known', 'g1', q, r, 0),
        piece('mystery', 'zz-from-the-future', q + 2, r, 0),
      ]
      const map = buildupJsonFileMap(withUnknown, rectangleMap())
      expect(map.boardPieces.map((p) => p.uid)).toContain('mystery')
    },
  )

  it.fails(
    'KNOWN GAP: loading is order-stable (re-loading a loaded map keeps the piece order)',
    () => {
      // The altitude sort in buildupJsonFileMap never returns 0 for equal
      // altitudes (it returns -1 whichever way the pair is compared), which in
      // practice REVERSES the pieces of each level on every load. Pieces are
      // saved in the order they sit in boardPieces, so save -> load -> save
      // flips the order each time. For non-overlapping pieces that is harmless,
      // but "later pieces win a contested hex", so for maps with overlaps it
      // changes which piece is reported as displaced after every reload.
      // Fix: return 0 on ties (Array.prototype.sort is stable).
      const three = [
        piece('a', 'g1', q, r, 0),
        piece('b', 'g1', q + 1, r, 0),
        piece('c', 'g1', q + 2, r, 0),
      ]
      const once = buildupJsonFileMap(three, rectangleMap())
      const twice = buildupJsonFileMap(once.boardPieces, rectangleMap())
      expect(twice.boardPieces.map((p) => p.uid)).toEqual(
        once.boardPieces.map((p) => p.uid),
      )
    },
  )

  it('is deterministic: loading the same pieces twice gives identical hexes', () => {
    const pieces = [piece('a', 'g7', q, r, 0), piece('b', 'tr10', q, r, 1)]
    const first = buildupJsonFileMap(pieces, rectangleMap())
    const second = buildupJsonFileMap(pieces, rectangleMap())
    expect(second.boardHexes).toEqual(first.boardHexes)
  })
})

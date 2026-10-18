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
import { describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { piecesSoFar } from '../data/pieces'
import type { BoardPiece, HexMap } from '../types'
import {
  decodePieceID,
  encodeBoardPiecesToIds,
  genBoardHexID,
  getBoardPiecesMaxLevel,
  getDroppedPiecesWarning,
  inflateBoardPiecesFromIds,
  normalizeBoardPieces,
  normalizeBoardPiecesWithDropped,
} from '../utils/map-utils'
import { warnAboutLoadedMap } from '../utils/warnAboutLoadedMap'
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

  // TODO(owner): fluid double-stacking is being reworked on dev; unskip after refactor
  it.skip('getBoardPiecesMaxLevel is one above the highest placement altitude (0 when empty)', () => {
    expect(getBoardPiecesMaxLevel([], {})).toBe(0)
    expect(getBoardPiecesMaxLevel([piece('a', 'g1', 0, 0, 0)], {})).toBe(1)
    expect(
      getBoardPiecesMaxLevel(
        [piece('a', 'g1', 0, 0, 0), piece('b', 'g1', 0, 0, 4)],
        {},
      ),
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

  it(
    'KNOWN GAP: piece objects without a uid are rejected, not turned into NaN pieces',
    () => {
      // Older BoardPiece[] files have no uid. Normalize them by adding a uid
      // while retaining their piece data rather than decoding their array
      // indexes as piece IDs.
      //
      const uidLess = [
        {
          inventoryID: 'g1',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 1, r: 1, s: -2 },
        },
      ]
      const result = normalizeBoardPieces(uidLess)
      const isSane = (p: BoardPiece) =>
        p.inventoryID in piecesSoFar &&
        Number.isFinite(p.altitude) &&
        Number.isFinite(p.rotation) &&
        Number.isFinite(p.pieceCoords.q) &&
        Number.isFinite(p.pieceCoords.r) &&
        Number.isFinite(p.pieceCoords.s)
      expect(result).toHaveLength(1)
      expect(result.every(isSane)).toBe(true)
      expect(result[0]).toMatchObject({
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 1, r: 1, s: -2 },
      })
      expect(result[0].uid).toEqual(expect.any(String))
      expect(result[0].uid.length).toBeGreaterThan(0)
    },
  )

  it('gives several uid-less pieces distinct uids without changing their data', () => {
    const uidLess = [
      {
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 1, r: 1, s: -2 },
      },
      {
        inventoryID: 'r7',
        altitude: 2,
        rotation: 3,
        pieceCoords: { q: -2, r: 4, s: -2 },
      },
      {
        inventoryID: 'g2',
        altitude: 1,
        rotation: 1.5,
        pieceCoords: { q: 3, r: -1, s: -2 },
      },
    ]
    const result = normalizeBoardPieces(uidLess)
    const stripUID = ({ uid: _uid, ...rest }: BoardPiece) => rest

    expect(result).toHaveLength(uidLess.length)
    expect(new Set(result.map((p) => p.uid)).size).toBe(uidLess.length)
    expect(result.map(stripUID)).toEqual(uidLess)
  })

  it('preserves existing uids on pieces that already have them', () => {
    const existing = [
      piece('kept-one', 'g1', 1, 1),
      piece('kept-two', 'r7', -2, 4, 2, 3),
    ]

    expect(normalizeBoardPieces(existing)).toBe(existing)
    expect(normalizeBoardPieces(existing).map((p) => p.uid)).toEqual([
      'kept-one',
      'kept-two',
    ])
  })

  it('regenerates duplicate uids to keep every normalized piece unique', () => {
    const duplicates = [
      piece('reused', 'g1', 1, 1),
      piece('reused', 'r7', -2, 4, 2, 3),
    ]
    const result = normalizeBoardPieces(duplicates)

    expect(result[0].uid).toBe('reused')
    expect(result[1].uid).toEqual(expect.any(String))
    expect(result[1].uid).not.toBe('reused')
    expect(new Set(result.map((p) => p.uid)).size).toBe(result.length)
  })

  it('does not return malformed piece coordinates from any saved format', () => {
    const invalidLegacyObjects = [
      {
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: Number.NaN, r: 1, s: -1 },
      },
    ]

    expect(normalizeBoardPieces(invalidLegacyObjects)).toEqual([])
    expect(normalizeBoardPieces(['0~NaN~1~0~g1'])).toEqual([])
  })

  it('reports malformed pieces as dropped during map loading', () => {
    const legacy = [
      piece('kept', 'g1', 1, 1),
      {
        uid: 'malformed',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: Number.NaN, r: 1, s: -1 },
      },
    ]
    const normalized = normalizeBoardPiecesWithDropped(legacy)
    const map = buildupJsonFileMap(
      normalized.boardPieces,
      rectangleMap(),
      normalized.droppedPieces,
    )

    expect(map.boardPieces.map((p) => p.uid)).toEqual(['kept'])
    expect(map.droppedPieces).toEqual([
      { uid: 'malformed', inventoryID: 'g1', reason: 'malformed' },
    ])
  })

  it('warns once with separate unknown and malformed counts', () => {
    const legacy = [
      piece('kept', 'g1', 1, 1),
      piece('unknown', 'zz-from-the-future', 3, 1),
      {
        uid: 'malformed',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 1, r: Number.POSITIVE_INFINITY, s: -1 },
      },
    ]
    const normalized = normalizeBoardPiecesWithDropped(legacy)
    const map = buildupJsonFileMap(
      normalized.boardPieces,
      rectangleMap(),
      normalized.droppedPieces,
    )
    const enqueueSnackbar = vi.fn()

    warnAboutLoadedMap(enqueueSnackbar, map)

    expect(map.droppedPieces).toHaveLength(2)
    expect(getDroppedPiecesWarning(map.droppedPieces)).toBe(
      'Skipped 1 unknown piece (zz-from-the-future) and 1 malformed piece. Updating the app may let you load unknown pieces.',
    )
    expect(enqueueSnackbar).toHaveBeenCalledTimes(1)
    expect(enqueueSnackbar.mock.calls[0][0].message).toBe(
      getDroppedPiecesWarning(map.droppedPieces),
    )
  })

  it('reports no drops and preserves a clean piece array reference', () => {
    const clean = [piece('known', 'g1', 1, 1)]
    const normalized = normalizeBoardPiecesWithDropped(clean)
    const map = buildupJsonFileMap(
      normalized.boardPieces,
      rectangleMap(),
      normalized.droppedPieces,
    )
    const enqueueSnackbar = vi.fn()

    warnAboutLoadedMap(enqueueSnackbar, map)

    expect(normalized.boardPieces).toBe(clean)
    expect(map.droppedPieces).toEqual([])
    expect(getDroppedPiecesWarning(map.droppedPieces)).toBeNull()
    expect(enqueueSnackbar).not.toHaveBeenCalled()
  })

  it('loads the same uid-less legacy pieces with identical data apart from uids', () => {
    const legacy = [
      {
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 1, r: 1, s: -2 },
      },
      {
        inventoryID: 'r7',
        altitude: 2,
        rotation: 3,
        pieceCoords: { q: -2, r: 4, s: -2 },
      },
    ]
    const load = () =>
      buildupJsonFileMap(normalizeBoardPieces(legacy), rectangleMap())
        .boardPieces
    const first = load()
    const second = load()
    const stripUID = ({ uid: _uid, ...rest }: BoardPiece) => rest

    expect(first.map(stripUID)).toEqual(second.map(stripUID))
    expect(new Set(first.map((p) => p.uid)).size).toBe(first.length)
    expect(first.every((p) => Number.isFinite(p.pieceCoords.q))).toBe(true)
  })
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

  it('pieces this app does not recognize are dropped on load and reported', () => {
    // A shared link or file from a NEWER version can contain an inventoryID
    // this version has never heard of (the desktop app auto-updates but is not
    // always current). Decision: such pieces never enter the app (nothing
    // downstream has to cope with them), and the load result lists them so the
    // UI can warn the user before the next autosave makes the loss permanent.
    const withUnknown = [
      piece('known', 'g1', q, r, 0),
      piece('mystery', 'zz-from-the-future', q + 2, r, 0),
    ]
    const map = buildupJsonFileMap(withUnknown, rectangleMap())
    expect(map.boardPieces.map((p) => p.uid)).toEqual(['known'])
    expect(map.droppedPieces).toEqual([
      {
        uid: 'mystery',
        inventoryID: 'zz-from-the-future',
        reason: 'unknown',
      },
    ])
  })

  it('a share link with an unknown piece id loads the rest and reports the drop', () => {
    // share links carry "altitude~q~r~rotation~inventoryID" strings
    const fromLink = inflateBoardPiecesFromIds([
      `0~${q}~${r}~0~g1`,
      `0~${q + 2}~${r}~0~zz-from-the-future`,
    ])
    const map = buildupJsonFileMap(fromLink, rectangleMap())
    expect(map.boardPieces.map((p) => p.inventoryID)).toEqual(['g1'])
    expect(map.droppedPieces.map((p) => p.inventoryID)).toEqual([
      'zz-from-the-future',
    ])
    expect(map.droppedPieces.map((p) => p.reason)).toEqual(['unknown'])
  })

  it('a map of known pieces reports nothing dropped', () => {
    const map = buildupJsonFileMap([piece('a', 'g1', q, r, 0)], rectangleMap())
    expect(map.droppedPieces).toEqual([])
  })

  it('the drop warning gives the count and each distinct unknown id once', () => {
    expect(getDroppedPiecesWarning([])).toBeNull()
    expect(
      getDroppedPiecesWarning([
        { uid: '1', inventoryID: 'zz1', reason: 'unknown' },
        { uid: '2', inventoryID: 'zz2', reason: 'unknown' },
        { uid: '3', inventoryID: 'zz1', reason: 'unknown' },
      ]),
    ).toBe(
      'Skipped 3 unknown pieces (zz1, zz2). Updating the app may let you load unknown pieces.',
    )
    expect(
      getDroppedPiecesWarning([
        { uid: '1', inventoryID: 'zz1', reason: 'unknown' },
      ]),
    ).toBe(
      'Skipped 1 unknown piece (zz1). Updating the app may let you load unknown pieces.',
    )
  })

  it('loading is order-stable (re-loading a loaded map keeps the piece order)', () => {
    // Pieces are saved in boardPieces order and "later pieces win a contested
    // hex", so the load order must not change between save -> load -> save.
    // (It used to reverse each altitude on every load: the altitude sort never
    // returned 0 for ties.)
    const three = [
      piece('a', 'g1', q, r, 0),
      piece('b', 'g1', q + 1, r, 0),
      piece('c', 'g1', q + 2, r, 0),
    ]
    const once = buildupJsonFileMap(three, rectangleMap())
    expect(once.boardPieces.map((p) => p.uid)).toEqual(['a', 'b', 'c'])
    const twice = buildupJsonFileMap(once.boardPieces, rectangleMap())
    expect(twice.boardPieces.map((p) => p.uid)).toEqual(
      once.boardPieces.map((p) => p.uid),
    )
  })

  it('load order: by altitude, then Laur add-ons, ladders and battlements last, original order kept within each', () => {
    const mixed = [
      piece('addon-1', 'lwl', q, r, 9),
      piece('high', 'g1', q + 3, r, 2),
      piece('ladder', 'ld', q + 4, r, 1),
      piece('low-1', 'g1', q, r, 0),
      piece('addon-2', 'lwr', q + 1, r, 9),
      piece('low-2', 'g1', q + 1, r, 0),
    ]
    const map = buildupJsonFileMap(mixed, rectangleMap())
    expect(map.boardPieces.map((p) => p.uid)).toEqual([
      'low-1',
      'low-2',
      'high',
      'ladder',
      'addon-1',
      'addon-2',
    ])
  })

  it('is deterministic: loading the same pieces twice gives identical hexes', () => {
    const pieces = [piece('a', 'g7', q, r, 0), piece('b', 'tr10', q, r, 1)]
    const first = buildupJsonFileMap(pieces, rectangleMap())
    const second = buildupJsonFileMap(pieces, rectangleMap())
    expect(second.boardHexes).toEqual(first.boardHexes)
  })
})

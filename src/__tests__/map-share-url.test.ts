/**
 * SHARE LINKS
 *
 * Maps are shared as a URL whose `m` query parameter holds the compressed map
 * and whose optional `v` selects the view (a = PDF, b = 2D). People paste these
 * from the production site, a dev server, or the desktop app, so the parser is
 * deliberately forgiving.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import { buildShareUrlWithFallback } from '../data/shareUrl'
import { Pieces, type BoardPiece, type HexMap } from '../types'
import {
  encodeBoardPiecesToIds,
  inflateBoardPiecesFromIds,
} from '../utils/map-utils'
import {
  getViewModeFromQueryParam,
  parseMapShareUrlParams,
} from '../utils/mapShareUrl'

const shareUrlBase = 'https://hexoscape.com/'

const makeBoardPiece = (inventoryID: string, q: number, r = 0): BoardPiece => ({
  uid: `${inventoryID}-${q}-${r}`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q, r, s: -q - r },
})

const fixtureHexMap: HexMap = {
  id: 'share-fallback',
  name: 'Share fallback',
  author: 'Test Builder',
  version: 1,
  shape: 'rectangle',
  width: 10,
  length: 10,
}

const makeMarker = (value: string) => ({
  uid: `marker-${value.length}`,
  anchor: { q: 1, r: 0, s: -1, altitude: 0 },
  size: 1 as const,
  rotation: 0 as const,
  style: 'black' as const,
  content: { kind: 'text' as const, value },
  name: `Marker ${value}`,
})

const baseUrlThatFitsPayload = (payload: string) => {
  const paddingLength =
    2082 - shareUrlBase.length - '?m='.length - payload.length
  expect(paddingLength).toBeGreaterThanOrEqual(0)
  return `${shareUrlBase}${'x'.repeat(paddingLength)}`
}

const expectSharePayload = (
  url: string,
  hexMap: HexMap,
  boardPieces: BoardPiece[],
) => {
  const parsedUrl = new URL(url)
  const mapData = parsedUrl.searchParams.get('m')
  if (!mapData) throw new Error('Expected the shared map payload')
  const decoded = parseMapDataArrayFromCrushed(mapData)

  expect(decoded.hexMap).toEqual({
    ...hexMap,
    mapPortraitBase64: '',
    mapNotes: '',
  })
  expect(decoded.boardPiecesEncodedArr).toEqual(
    encodeBoardPiecesToIds(boardPieces),
  )
}

describe('parseMapShareUrlParams', () => {
  it.each([
    ['production link', 'https://hexoscape.com/?m=abc123&v=a', 'abc123', 'a'],
    ['local dev server', 'http://localhost:5173/?m=abc123', 'abc123', null],
    ['desktop app origin', 'tauri://localhost/?m=abc123&v=b', 'abc123', 'b'],
    ['no scheme', 'hexoscape.com/?m=abc123&v=a', 'abc123', 'a'],
    ['path only', '/?m=abc123', 'abc123', null],
    ['query string with ?', '?m=abc123&v=b', 'abc123', 'b'],
    ['bare query string', 'm=abc123&v=a', 'abc123', 'a'],
    [
      'surrounding whitespace',
      '  https://hexoscape.com/?m=abc123 \n',
      'abc123',
      null,
    ],
  ])('%s', (_label, input, m, v) => {
    expect(parseMapShareUrlParams(input)).toEqual({ m, v })
  })

  it('gives nulls for empty input and for links with no map', () => {
    expect(parseMapShareUrlParams('')).toEqual({ m: null, v: null })
    expect(parseMapShareUrlParams('   ')).toEqual({ m: null, v: null })
    expect(parseMapShareUrlParams('https://hexoscape.com/')).toEqual({
      m: null,
      v: null,
    })
  })

  it('percent-decodes the payload once, as URLSearchParams does', () => {
    // getUrlMapString encodes with encodeURIComponent so that characters the
    // compressor can emit (+ , & space) survive; this is the other half.
    expect(parseMapShareUrlParams('https://x.test/?m=a%2Bb%26c%20d').m).toBe(
      'a+b&c d',
    )
  })
})

describe('buildShareUrlWithFallback', () => {
  it('uses the full map when it fits and preserves the requested view', () => {
    const boardPieces = [makeBoardPiece('g1', 1)]
    const original = structuredClone({ hexMap: fixtureHexMap, boardPieces })
    const result = buildShareUrlWithFallback({
      hexMap: fixtureHexMap,
      boardPieces,
      baseUrl: shareUrlBase,
      view: 'a',
    })

    expect(result).toMatchObject({ removed: [] })
    if ('error' in result) throw new Error('Expected the full map to fit')
    expect(new URL(result.url).searchParams.get('v')).toBe('a')
    expectSharePayload(result.url, fixtureHexMap, boardPieces)
    expect({ hexMap: fixtureHexMap, boardPieces }).toEqual(original)
  })

  it('first removes start zones when that makes the link fit', () => {
    const boardPieces = [makeBoardPiece('z1', 1), makeBoardPiece('g1', 2)]
    const expectedPieces = boardPieces.filter(
      (piece) => piece.inventoryID !== 'z1',
    )
    const payload = getUrlMapString({
      hexMap: fixtureHexMap,
      boardPieces: expectedPieces,
    })
    const baseUrl = baseUrlThatFitsPayload(payload)

    const result = buildShareUrlWithFallback({
      hexMap: fixtureHexMap,
      boardPieces,
      baseUrl,
    })

    expect(result).toMatchObject({ removed: ['startZones'] })
    if ('error' in result) throw new Error('Expected start-zone removal to fit')
    expect(result.url.length).toBe(2082)
    expectSharePayload(result.url, fixtureHexMap, expectedPieces)
  })

  it('then removes markers after start zones', () => {
    const hexMap: HexMap = {
      ...fixtureHexMap,
      objectiveMarkers: [makeMarker('A'.repeat(180))],
    }
    const boardPieces = [
      makeBoardPiece('z1', 1),
      makeBoardPiece('y0', 2),
      makeBoardPiece('y1', 3),
      makeBoardPiece('g1', 4),
    ]
    const expectedPieces = boardPieces.filter(
      (piece) => piece.inventoryID !== 'z1',
    )
    const expectedMap = { ...hexMap, objectiveMarkers: [] }
    const payload = getUrlMapString({
      hexMap: expectedMap,
      boardPieces: expectedPieces,
    })
    const baseUrl = baseUrlThatFitsPayload(payload)

    const result = buildShareUrlWithFallback({
      hexMap,
      boardPieces,
      baseUrl,
    })

    expect(result).toMatchObject({
      removed: ['startZones', 'objectiveMarkers'],
    })
    if ('error' in result) {
      throw new Error('Expected objective-marker removal to fit')
    }
    expect(result.url.length).toBe(2082)
    expectSharePayload(result.url, expectedMap, expectedPieces)
    expect(hexMap.objectiveMarkers).toHaveLength(1)
  })

  it('then removes glyphs when the marker-free map is still too large', () => {
    const hexMap: HexMap = {
      ...fixtureHexMap,
      objectiveMarkers: [makeMarker('A'.repeat(180))],
    }
    const boardPieces = [
      makeBoardPiece('z1', 1),
      makeBoardPiece('y0', 2),
      makeBoardPiece('y1', 3),
      makeBoardPiece('g1', 4),
    ]
    const expectedPieces = boardPieces.filter(
      (piece) =>
        piece.inventoryID !== 'z1' && !piece.inventoryID.startsWith('y'),
    )
    const expectedMap = { ...hexMap, objectiveMarkers: [] }
    const payload = getUrlMapString({
      hexMap: expectedMap,
      boardPieces: expectedPieces,
    })
    const baseUrl = baseUrlThatFitsPayload(payload)

    const result = buildShareUrlWithFallback({
      hexMap,
      boardPieces,
      baseUrl,
    })

    expect(result).toMatchObject({
      removed: ['startZones', 'objectiveMarkers', 'glyphs'],
    })
    if ('error' in result) throw new Error('Expected glyph removal to fit')
    expect(result.url.length).toBe(2082)
    expectSharePayload(result.url, expectedMap, expectedPieces)
  })

  it('catches the crush input limit and retries without start zones', () => {
    const boardPieces = Array.from({ length: 1500 }, (_, index) =>
      makeBoardPiece('z1', index, index % 17),
    )
    const result = buildShareUrlWithFallback({
      hexMap: fixtureHexMap,
      boardPieces,
      baseUrl: shareUrlBase,
    })

    expect(result).toMatchObject({ removed: ['startZones'] })
    if ('error' in result) {
      throw new Error('Expected retrying without start zones to fit')
    }
    expectSharePayload(result.url, fixtureHexMap, [])
  })

  it('returns a too-large result when no version fits', () => {
    const hexMap = {
      ...fixtureHexMap,
      name: Array.from({ length: 20_100 }, (_, index) =>
        String.fromCharCode(33 + (index % 90)),
      ).join(''),
    }

    expect(() =>
      buildShareUrlWithFallback({
        hexMap,
        boardPieces: [],
        baseUrl: shareUrlBase,
      }),
    ).not.toThrow()
    expect(
      buildShareUrlWithFallback({
        hexMap,
        boardPieces: [],
        baseUrl: shareUrlBase,
      }),
    ).toEqual({ error: 'too-large' })
  })
})

describe('cannon share rotations', () => {
  it('preserves a half-step cannon rotation through share and load', () => {
    const cannon = {
      ...makeBoardPiece(Pieces.cannon, 3),
      rotation: 1.5,
    }
    const payload = getUrlMapString({
      hexMap: fixtureHexMap,
      boardPieces: [cannon],
    })
    const parsed = parseMapDataArrayFromCrushed(payload)
    const inflated = inflateBoardPiecesFromIds(parsed.boardPiecesEncodedArr)

    expect(parsed.boardPiecesEncodedArr).toEqual(
      encodeBoardPiecesToIds([cannon]),
    )
    expect(inflated[0]?.rotation).toBe(1.5)
    expect(
      buildupJsonFileMap(inflated, parsed.hexMap).boardPieces[0]?.rotation,
    ).toBe(1.5)
  })
})

describe('objective marker share links', () => {
  it('creates a link that reopens named markers with all placed properties', () => {
    const objectiveMarkers = Array.from({ length: 12 }, (_, index) => ({
      uid: `marker-${index}`,
      anchor: {
        q: index + 1,
        r: 0,
        s: -index - 1,
        altitude: index % 4,
      },
      size: (index % 2 === 0 ? 1 : 2) as 1 | 2,
      rotation: (index % 6) as 0 | 1 | 2 | 3 | 4 | 5,
      style: (index % 2 === 0 ? 'black' : 'white') as 'black' | 'white',
      content:
        index % 2 === 0
          ? { kind: 'number' as const, value: index + 1 }
          : { kind: 'text' as const, value: `M${index}` },
      name: `Objective marker ${String(index + 1).padStart(3, '0')}`,
    }))
    const hexMap: HexMap = {
      id: 'share-objective-markers',
      name: 'Share objective markers',
      author: 'Test Builder',
      version: 1,
      shape: 'rectangle',
      width: 20,
      length: 20,
      objectiveMarkers,
    }

    const payload = getUrlMapString({ hexMap, boardPieces: [] })
    const { m } = parseMapShareUrlParams(`https://hexoscape.com/?m=${payload}`)
    if (m === null) throw new Error('Expected the shared map payload')
    const parsed = parseMapDataArrayFromCrushed(m)
    const loaded = buildupJsonFileMap([], parsed.hexMap)

    expect(loaded.hexMap.objectiveMarkers).toEqual(objectiveMarkers)
    expect(parsed.boardPiecesEncodedArr).toEqual([])
  })
})

describe('getViewModeFromQueryParam', () => {
  it('maps v=a to the PDF view and v=b to the 2D view; anything else is the 3D editor', () => {
    expect(getViewModeFromQueryParam('a')).toBe('pdf')
    expect(getViewModeFromQueryParam('b')).toBe('2d')
    expect(getViewModeFromQueryParam(null)).toBe('default')
    expect(getViewModeFromQueryParam('zzz')).toBe('default')
  })
})

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
import type { HexMap } from '../types'
import {
  getViewModeFromQueryParam,
  parseMapShareUrlParams,
} from '../utils/mapShareUrl'

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

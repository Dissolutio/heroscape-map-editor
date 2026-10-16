/**
 * SHARE LINKS
 *
 * Maps are shared as a URL whose `m` query parameter holds the compressed map
 * and whose optional `v` selects the view (a = PDF, b = 2D). People paste these
 * from the production site, a dev server, or the desktop app, so the parser is
 * deliberately forgiving. (The compression itself is in data/jsonCrush.ts and
 * needs the real `jsoncrush` package; it is not exercised here.)
 */
import { describe, expect, it } from 'vitest'
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

describe('getViewModeFromQueryParam', () => {
  it('maps v=a to the PDF view and v=b to the 2D view; anything else is the 3D editor', () => {
    expect(getViewModeFromQueryParam('a')).toBe('pdf')
    expect(getViewModeFromQueryParam('b')).toBe('2d')
    expect(getViewModeFromQueryParam(null)).toBe('default')
    expect(getViewModeFromQueryParam('zzz')).toBe('default')
  })
})

import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import type { HexMap } from '../types'
import { inflateBoardPiecesFromIds } from '../utils/map-utils'
import { getPortraitDimensions } from '../utils/mapPortrait'
import { parseMapShareUrlParams } from '../utils/mapShareUrl'

describe('portrait downscale dimensions', () => {
  it.each([
    [1600, 900, 800, 450],
    [900, 1600, 450, 800],
    [2400, 2400, 800, 800],
    [800, 600, 800, 600],
    [400, 300, 400, 300],
    [1, 5000, 1, 800],
    [1920, 1080, 800, 450],
    [1000, 333, 800, 266],
  ])('%s x %s -> %s x %s', (width, height, expectedWidth, expectedHeight) => {
    const result = getPortraitDimensions(width, height)
    expect(result).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    })
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(800)
    expect(result.width).toBeLessThanOrEqual(width)
    expect(result.height).toBeLessThanOrEqual(height)
    const scale = Math.min(1, 800 / Math.max(width, height))
    expect(Math.abs(result.width - width * scale)).toBeLessThanOrEqual(1)
    expect(Math.abs(result.height - height * scale)).toBeLessThanOrEqual(1)
  })

  it.each([
    [0, 100],
    [100, 0],
    [-1, 100],
    [100, -1],
    [Number.NaN, 100],
    [100, Number.POSITIVE_INFINITY],
  ])('rejects invalid dimensions %s x %s', (width, height) => {
    expect(() => getPortraitDimensions(width, height)).toThrow(
      'Portrait dimensions must be positive finite numbers',
    )
  })
})

describe('share-link map identity', () => {
  it('preserves hexMap.id through crush, URL parsing, uncrush and load', () => {
    const hexMap: HexMap = {
      id: '1z8g9xloSIzt-',
      name: 'Portrait & identity',
      author: 'Test',
      shape: 'rectangle',
      width: 3,
      length: 1,
      version: 1,
      mapPortraitBase64: 'data:image/jpeg;base64,portrait',
      mapNotes: 'Notes excluded from share links',
    }
    const boardPieces = [
      {
        uid: 'grass',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 0, r: 0, s: 0 },
      },
    ]
    const crushed = getUrlMapString({ hexMap, boardPieces })
    const { m } = parseMapShareUrlParams(`https://hexoscape.com/?m=${crushed}`)
    expect(m).not.toBeNull()
    const decoded = parseMapDataArrayFromCrushed(m ?? '')
    const loaded = buildupJsonFileMap(
      inflateBoardPiecesFromIds(decoded.boardPiecesEncodedArr),
      decoded.hexMap,
    )
    expect(decoded.hexMap.id).toBe(hexMap.id)
    expect(loaded.hexMap.id).toBe(hexMap.id)
    expect(loaded.hexMap.mapPortraitBase64).toBe('')
    expect(loaded.hexMap.mapNotes).toBe('')
    expect(loaded.boardPieces).toHaveLength(1)
  })
})

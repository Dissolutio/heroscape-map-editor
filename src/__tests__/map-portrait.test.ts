import { describe, expect, it, vi } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  getUrlMapString,
  parseMapDataArrayFromCrushed,
} from '../data/jsonCrush'
import type { HexMap } from '../types'
import { inflateBoardPiecesFromIds } from '../utils/map-utils'
import {
  MAX_PORTRAIT_SIZE,
  PORTRAIT_JPEG_QUALITY,
  QUOTA_FALLBACK_JPEG_QUALITY,
  QUOTA_FALLBACK_PORTRAIT_SIZE,
  canvasToMapPortrait,
  getMapPortraitStorageFallback,
  getPortraitDimensions,
} from '../utils/mapPortrait'
import { parseMapShareUrlParams } from '../utils/mapShareUrl'

describe('portrait downscale dimensions', () => {
  it.each([
    [3840, 2160, 1920, 1080],
    [1080, 3840, 540, 1920],
    [2400, 2400, 1920, 1920],
    [1920, 1080, 1920, 1080],
    [400, 300, 400, 300],
    [1, 5000, 1, 1920],
    [1920, 1080, 1920, 1080],
    [2400, 800, 1920, 640],
  ])('%s x %s -> %s x %s', (width, height, expectedWidth, expectedHeight) => {
    const result = getPortraitDimensions(width, height)
    expect(result).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    })
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(
      MAX_PORTRAIT_SIZE,
    )
    expect(result.width).toBeLessThanOrEqual(width)
    expect(result.height).toBeLessThanOrEqual(height)
    const scale = Math.min(1, MAX_PORTRAIT_SIZE / Math.max(width, height))
    expect(Math.abs(result.width - width * scale)).toBeLessThanOrEqual(1)
    expect(Math.abs(result.height - height * scale)).toBeLessThanOrEqual(1)
  })

  it('uses the intended full-quality and quota-fallback settings', () => {
    expect(MAX_PORTRAIT_SIZE).toBe(1920)
    expect(PORTRAIT_JPEG_QUALITY).toBe(0.92)
    expect(QUOTA_FALLBACK_PORTRAIT_SIZE).toBe(800)
    expect(QUOTA_FALLBACK_JPEG_QUALITY).toBe(0.8)
  })

  it('uses high-quality smoothing and steps down large images by halves', () => {
    const canvases: {
      width: number
      height: number
      draws: number[][]
      context: {
        imageSmoothingEnabled: boolean
        imageSmoothingQuality: string
        fillStyle: string
        fillRect: ReturnType<typeof vi.fn>
        drawImage: ReturnType<typeof vi.fn>
      }
      toDataURL: ReturnType<typeof vi.fn>
    }[] = []
    vi.stubGlobal('document', {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          draws: [] as number[][],
          context: {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn((...args: number[]) => {
              canvas.draws.push(args)
            }),
          },
          toDataURL: vi.fn((_type: string, quality: number) => {
            return `${canvas.width}x${canvas.height}:${quality}`
          }),
          getContext: () => canvas.context,
        }
        canvases.push(canvas)
        return canvas
      },
    })

    try {
      const portrait = canvasToMapPortrait({} as CanvasImageSource, 4000, 2000)
      expect(portrait).toBe('1920x960:0.92')
      expect(getMapPortraitStorageFallback(portrait)).toBe('800x400:0.8')
      expect(canvases.map(({ width, height }) => [width, height])).toEqual([
        [2000, 1000],
        [1920, 960],
        [2000, 1000],
        [1000, 500],
        [800, 400],
      ])
      expect(
        canvases.every(
          ({ context }) =>
            context.imageSmoothingEnabled &&
            context.imageSmoothingQuality === 'high',
        ),
      ).toBe(true)
    } finally {
      vi.unstubAllGlobals()
    }
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

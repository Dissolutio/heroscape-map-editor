import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  doesPieceFitOnMap,
  fitMapToPieces,
  mapTableHexes,
  MAX_HEXAGON_FIT_RADIUS,
  MAX_RECTANGLE_FIT_DIMENSION,
} from '../data/fitMapToPieces'
import type { BoardPiece, HexMap } from '../types'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import { getDroppedPiecesWarning } from '../utils/map-utils'

const map = (shape: HexMap['shape'], length = 5, width = length): HexMap => ({
  id: 'growth-cap-test',
  name: 'Growth cap test',
  author: '',
  version: 1,
  shape,
  length,
  width,
})

const piece = (
  uid: string,
  q: number,
  r: number,
  inventoryID = 'g1',
): BoardPiece => ({
  uid,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q, r, s: -q - r },
})

function inBoundsCoord(hexMap: HexMap) {
  const coords =
    hexMap.shape === 'hexagon'
      ? hexUtilsGenHexagonGrid(Math.max(hexMap.length, hexMap.width) - 1)
      : hexUtilsGenRectangleGrid(
          hexMap.length,
          hexMap.width,
          hexMap.originQ ?? 0,
          hexMap.originR ?? 0,
        )
  return coords[0]
}

describe('map load growth cap', () => {
  it.each([
    ['hexagon', 1000],
    ['hexagon', 100_000],
    ['rectangle', 1000],
    ['rectangle', 100_000],
  ] as const)(
    'drops an outlier on a %s map that is %i hexes away and keeps in-bounds pieces',
    (shape, distance) => {
      const hexMap = map(shape)
      const anchor = inBoundsCoord(hexMap)
      const boardPieces = [
        piece('in-bounds', anchor.q, anchor.r),
        piece('too-far', distance, 0),
      ]
      const start = performance.now()
      const loaded = buildupJsonFileMap(boardPieces, hexMap)
      const elapsed = performance.now() - start

      expect(loaded.droppedPieces).toEqual([
        { uid: 'too-far', inventoryID: 'g1', reason: 'too-far' },
      ])
      expect(loaded.boardPieces.map(({ uid }) => uid)).toEqual(['in-bounds'])
      expect(
        Object.values(loaded.boardHexes).some(
          ({ boardPieceUID }) => boardPieceUID === 'in-bounds',
        ),
      ).toBe(true)
      expect(getDroppedPiecesWarning(loaded.droppedPieces)).toBe(
        '1 piece was too far from the map and was left out.',
      )
      if (distance === 100_000) {
        expect(elapsed).toBeLessThan(200)
      }
    },
  )

  it.each(['hexagon', 'rectangle'] as const)(
    'keeps an all-in-bounds %s map unchanged without a warning',
    (shape) => {
      const hexMap = map(shape)
      const anchor = inBoundsCoord(hexMap)
      const loaded = buildupJsonFileMap(
        [piece('in-bounds', anchor.q, anchor.r)],
        hexMap,
      )

      expect(JSON.stringify(loaded.hexMap)).toBe(JSON.stringify(hexMap))
      expect(loaded.droppedPieces).toEqual([])
      expect(getDroppedPiecesWarning(loaded.droppedPieces)).toBeNull()
    },
  )

  it('accepts a hexagon piece at the fit bound and drops one beyond it', () => {
    const hexMap = map('hexagon', 1)
    const atBound = piece('at-bound', MAX_HEXAGON_FIT_RADIUS * 2, 0)
    const beyondBound = piece('beyond-bound', MAX_HEXAGON_FIT_RADIUS * 2 + 1, 0)
    const result = fitMapToPieces(hexMap, [atBound, beyondBound])

    expect(result.hexMap.length).toBe(MAX_HEXAGON_FIT_RADIUS + 1)
    expect(result.droppedPieces).toEqual([beyondBound])
    expect(doesPieceFitOnMap(atBound, mapTableHexes(result.hexMap))).toBe(true)
  })

  it('accepts a rectangle piece at the fit bound and drops one beyond it', () => {
    const hexMap = map('rectangle', 1)
    const atBound = piece('at-bound', MAX_RECTANGLE_FIT_DIMENSION - 1, 0)
    const beyondBound = piece('beyond-bound', MAX_RECTANGLE_FIT_DIMENSION, 0)
    const result = fitMapToPieces(hexMap, [atBound, beyondBound])

    expect(result.hexMap.width).toBe(MAX_RECTANGLE_FIT_DIMENSION)
    expect(result.droppedPieces).toEqual([beyondBound])
    expect(doesPieceFitOnMap(atBound, mapTableHexes(result.hexMap))).toBe(true)
  })

  it.each(['hexagon', 'rectangle'] as const)(
    'keeps legitimate overhangs and drops only the outlier on a %s map',
    (shape) => {
      const hexMap = map(shape)
      const anchor = inBoundsCoord(hexMap)
      const overhang =
        shape === 'hexagon'
          ? piece('overhang', anchor.q + 10, anchor.r)
          : piece('overhang', -2, -2)
      const loaded = buildupJsonFileMap(
        [overhang, piece('too-far', 100_000, 0)],
        hexMap,
      )

      expect(loaded.hexMap).not.toEqual(hexMap)
      expect(loaded.boardPieces.map(({ uid }) => uid)).toEqual(['overhang'])
      expect(loaded.droppedPieces).toEqual([
        { uid: 'too-far', inventoryID: 'g1', reason: 'too-far' },
      ])
      expect(getDroppedPiecesWarning(loaded.droppedPieces)).toContain(
        'too far from the map',
      )
      expect(doesPieceFitOnMap(overhang, mapTableHexes(loaded.hexMap))).toBe(
        true,
      )
    },
  )

  it.each(['hexagon', 'rectangle'] as const)(
    'is idempotent when reloading a fitted %s map',
    (shape) => {
      const hexMap = map(shape)
      const anchor = inBoundsCoord(hexMap)
      const first = buildupJsonFileMap(
        [piece('in-bounds', anchor.q, anchor.r), piece('too-far', 100_000, 0)],
        hexMap,
      )
      const second = buildupJsonFileMap(first.boardPieces, first.hexMap)

      expect(second.hexMap).toEqual(first.hexMap)
      expect(second.boardPieces).toEqual(first.boardPieces)
      expect(second.boardHexes).toEqual(first.boardHexes)
      expect(second.droppedPieces).toEqual([])
      expect(getDroppedPiecesWarning(second.droppedPieces)).toBeNull()
    },
  )
})

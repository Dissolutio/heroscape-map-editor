import { describe, expect, it } from 'vitest'
import {
  doesPieceFitOnMap,
  fitMapToPieces,
  mapTableHexes,
} from '../data/fitMapToPieces'
import { resizeMap } from '../data/resizeMap'
import type { BoardPiece, HexMap } from '../types'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'

const rectangleMap = (length = 3, width = 3): HexMap => ({
  id: 'fit-test',
  name: 'Fit test',
  author: '',
  version: 1,
  shape: 'rectangle',
  length,
  width,
})

const piece = (
  inventoryID: string,
  q: number,
  r: number,
  options: Partial<BoardPiece> = {},
): BoardPiece => ({
  uid: `${inventoryID}-${q}-${r}`,
  inventoryID,
  altitude: 0,
  rotation: 0,
  pieceCoords: { q, r, s: -q - r },
  ...options,
})

describe('fitMapToPieces', () => {
  it.each(Array.from({ length: 40 }, (_, index) => index + 1))(
    'leaves an in-bounds hexagon of size %i unchanged',
    (size) => {
      const map = { ...rectangleMap(size, size), shape: 'hexagon' }
      const [coords] = hexUtilsGenHexagonGrid(size - 1)

      expect(fitMapToPieces(map, [piece('g1', coords.q, coords.r)])).toEqual({
        hexMap: map,
        changed: false,
      })
    },
  )

  it.each([
    [1, 1],
    [2, 4],
    [5, 10],
    [20, 40],
    [40, 20],
    [40, 40],
  ])('leaves an in-bounds rectangle %i by %i unchanged', (length, width) => {
    const map = rectangleMap(length, width)
    const [coords] = hexUtilsGenRectangleGrid(length, width)

    expect(fitMapToPieces(map, [piece('g1', coords.q, coords.r)])).toEqual({
      hexMap: map,
      changed: false,
    })
  })

  it('leaves pieces that are already on the map alone', () => {
    const map = rectangleMap()
    const pieces = [piece('g1', 1, 1)]

    expect(fitMapToPieces(map, pieces)).toEqual({ hexMap: map, changed: false })
  })

  it.each(['rectangle', 'hexagon'] as const)(
    'grows a %s map to fit an overhanging footprint',
    (shape) => {
      const map =
        shape === 'hexagon'
          ? { ...rectangleMap(2, 2), shape, length: 2, width: 2 }
          : rectangleMap(2, 2)
      const pieces = [piece('g2', 10, 10)]

      const result = fitMapToPieces(map, pieces)

      expect(result.changed).toBe(true)
      expect(result.hexMap.length).toBeGreaterThan(map.length)
      expect(result.hexMap.width).toBeGreaterThanOrEqual(map.width)
      expect(
        pieces.every((boardPiece) =>
          doesPieceFitOnMap(boardPiece, mapTableHexes(result.hexMap)),
        ),
      ).toBe(true)
    },
  )

  it('fits a tall piece by its table footprint, regardless of altitude', () => {
    const pieces = [piece('tr10', 20, 20, { altitude: 30 })]
    const result = fitMapToPieces(rectangleMap(), pieces)

    expect(result.changed).toBe(true)
    expect(doesPieceFitOnMap(pieces[0], mapTableHexes(result.hexMap))).toBe(
      true,
    )
  })

  it('does not grow for battlements and road walls on the outward rim', () => {
    const map = rectangleMap()
    const pieces = [piece('bt', 30, 30), piece('rw4', 30, 30)]

    expect(fitMapToPieces(map, pieces)).toEqual({ hexMap: map, changed: false })
  })

  it('includes rope ladders in map fitting', () => {
    const result = fitMapToPieces(rectangleMap(), [piece('rl', 8, 8)])

    expect(result.changed).toBe(true)
  })

  it('includes Laur add-ons that have no boardHexes representation', () => {
    const pieces = [piece('lwl', 30, 30, { altitude: 9 })]
    const result = fitMapToPieces(rectangleMap(), pieces)

    expect(result.changed).toBe(true)
    expect(doesPieceFitOnMap(pieces[0], mapTableHexes(result.hexMap))).toBe(
      true,
    )
  })

  it('grows around a rectangle footprint extending past its top and left edges', () => {
    const boardPiece = piece('g1', -2, -2)
    const result = fitMapToPieces(rectangleMap(), [boardPiece])

    expect(result.changed).toBe(true)
    expect(result.hexMap.originQ).toBeLessThan(0)
    expect(result.hexMap.originR).toBeLessThan(0)
    expect(doesPieceFitOnMap(boardPiece, mapTableHexes(result.hexMap))).toBe(
      true,
    )
  })

  it('expands a hexagon while keeping its previous table and piece coordinates', () => {
    const map = { ...rectangleMap(2, 2), shape: 'hexagon' }
    const originalTableHexes = mapTableHexes(map)
    const boardPiece = piece('g2', -3, -2)
    const result = fitMapToPieces(map, [boardPiece])
    const expandedTableHexes = mapTableHexes(result.hexMap)

    expect(result.changed).toBe(true)
    expect(
      [...originalTableHexes].every((id) => expandedTableHexes.has(id)),
    ).toBe(true)
    expect(doesPieceFitOnMap(boardPiece, expandedTableHexes)).toBe(true)
    expect(boardPiece.pieceCoords).toEqual({ q: -3, r: -2, s: 5 })
  })

  it('keeps every piece coordinate unchanged when the map grows', () => {
    const pieces = [piece('g2', 2, 2), piece('lwl', 25, 25, { altitude: 9 })]
    const before = structuredClone(pieces)
    const result = fitMapToPieces(rectangleMap(), pieces)

    expect(result.changed).toBe(true)
    expect(pieces).toEqual(before)
    expect(pieces.map(({ pieceCoords }) => pieceCoords)).toEqual(
      before.map(({ pieceCoords }) => pieceCoords),
    )
    expect(
      pieces.every((boardPiece) =>
        doesPieceFitOnMap(boardPiece, mapTableHexes(result.hexMap)),
      ),
    ).toBe(true)
  })

  it('is idempotent', () => {
    const first = fitMapToPieces(rectangleMap(), [piece('g2', 20, 20)])
    const second = fitMapToPieces(first.hexMap, [piece('g2', 20, 20)])

    expect(first.changed).toBe(true)
    expect(second).toEqual({ hexMap: first.hexMap, changed: false })
  })

  it('never mutates its inputs', () => {
    const map = Object.freeze(rectangleMap())
    const pieces = Object.freeze([Object.freeze(piece('g2', 30, 30))])
    const mapBefore = structuredClone(map)
    const piecesBefore = structuredClone(pieces)

    fitMapToPieces(map, pieces)

    expect(map).toEqual(mapBefore)
    expect(pieces).toEqual(piecesBefore)
  })
})

describe('resizeMap control behavior', () => {
  it('adds rectangle length without moving pieces', () => {
    const map = rectangleMap(3, 5)
    const pieces = [piece('g1', 1, 2)]
    const resized = resizeMap(map, pieces, 'length', 1)

    expect(resized.hexMap).toMatchObject({ length: 4, width: 5 })
    expect(resized.boardPieces).toEqual(pieces)
  })

  it('adds rectangle width without moving pieces', () => {
    const map = rectangleMap(3, 5)
    const pieces = [piece('g1', 1, 2)]
    const resized = resizeMap(map, pieces, 'width', 1)

    expect(resized.hexMap).toMatchObject({ length: 3, width: 6 })
    expect(resized.boardPieces).toEqual(pieces)
  })

  it.each([
    ['length', 1, { q: 3, r: 4, s: -7 }],
    ['width', 1, { q: 3, r: 4, s: -7 }],
    ['length', -1, { q: 1, r: 2, s: -3 }],
    ['width', -1, { q: 1, r: 2, s: -3 }],
  ] as const)(
    'resizes a hexagon %s by %s ring and shifts each piece by %j',
    (dimension, delta, expectedCoords) => {
      const map = { ...rectangleMap(4, 4), shape: 'hexagon' }
      const pieces = [piece('g1', 2, 3)]
      const resized = resizeMap(map, pieces, dimension, delta)

      expect(resized.hexMap.length).toBe(4 + delta)
      expect(resized.hexMap.width).toBe(4 + delta)
      expect(resized.boardPieces[0]?.pieceCoords).toEqual(expectedCoords)
    },
  )
})

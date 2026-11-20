import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  convertMapShape,
  trimAndNormalizeMap,
  trimMap,
} from '../data/convertMapShape'
import {
  doesPieceFitOnMap,
  fitMapToPieces,
  getMapTableFootprintCoords,
  mapTableHexes,
} from '../data/fitMapToPieces'
import { getObjectiveMarkerFootprint } from '../data/objectiveMarkers'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { getUnsupportedLaurAddonUIDs } from '../data/laurAddonSupport'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { genBoardHexID } from '../utils/map-utils'
import {
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
} from '../utils/hex-utils'
import twinIronsDockyard from './fixtures/twin-irons-dockyard.json'

const rectangleFixtureData = JSON.parse(
  readFileSync(
    new URL('./fixtures/fluid-cap-under-ladder.json', import.meta.url),
    'utf8',
  ),
) as { hexMap: HexMap; boardPieces: BoardPiece[] }
const hexagonFixtureData = JSON.parse(
  readFileSync(
    new URL('./fixtures/convert-map-shape-hexagon.json', import.meta.url),
    'utf8',
  ),
) as { hexMap: HexMap; boardPieces: BoardPiece[] }
const rectangleFixture = rectangleFixtureData.hexMap
const hexagonFixture = hexagonFixtureData.hexMap

const piece = (
  inventoryID: string,
  q: number,
  r: number,
  options: Partial<BoardPiece> = {},
): BoardPiece => ({
  uid: `${inventoryID}-${q}-${r}`,
  inventoryID,
  altitude: 0,
  rotation: 0 as const,
  pieceCoords: { q, r, s: -q - r },
  ...options,
})

const mixedHexMap: HexMap = {
  ...hexagonFixture,
  mapNotes: 'Keep these details',
  setsUsed: ['J'],
  objectiveMarkers: [
    {
      uid: 'conversion-objective',
      anchor: { q: 9, r: 10, s: -19, altitude: 1 },
      size: 2,
      rotation: 3,
      style: 'black',
      content: { kind: 'number', value: 7 },
      name: 'Keep this marker',
    },
  ],
}

const mixedBoardPiecesWithoutRim = [
  piece(Pieces.grass24, -3, 1),
  piece(Pieces.rock24, -3, 1, { altitude: 1 }),
  piece(Pieces.laurWallSquarePillar, 3, 2),
  piece(Pieces.laurWallLong, 4, 2, { rotation: 0.5 }),
  piece(Pieces.shipWall, 8, 2),
  piece(Pieces.glyphPower, 4, 8),
  piece(Pieces.glyphTreasure, 5, 8),
  piece(Pieces.startZone1, 2, 10),
  piece(Pieces.startZone2, 6, 10),
  piece(Pieces.grass1, 12, -2),
  piece(Pieces.rock1, 12, -2),
]

const fittedMixedHexMap = fitMapToPieces(
  mixedHexMap,
  mixedBoardPiecesWithoutRim,
).hexMap
const fittedMixedRadius =
  Math.max(fittedMixedHexMap.length, fittedMixedHexMap.width) - 1
const [rimHex] = hexUtilsGenHexagonGrid(
  fittedMixedRadius,
  fittedMixedHexMap.originQ ?? 0,
  fittedMixedHexMap.originR ?? 0,
)
if (!rimHex) throw new Error('Expected the mixed fixture to have a table rim')
const mixedBoardPieces = [
  ...mixedBoardPiecesWithoutRim,
  piece(Pieces.battlement, rimHex.q, rimHex.r),
]

function getConvertedMap(
  hexMap: HexMap,
  boardPieces: BoardPiece[],
  targetShape: 'hexagon' | 'rectangle',
  margin = 1,
) {
  const result = convertMapShape(hexMap, boardPieces, targetShape, { margin })
  if (!result.ok) throw new Error(`Map conversion failed: ${result.error}`)
  return result
}

function tableContainsCoords(hexMap: HexMap, coords: CubeCoordinate[]) {
  const table = mapTableHexes(hexMap)
  return coords.every((coord) =>
    table.has(genBoardHexID({ ...coord, altitude: 0 })),
  )
}

function expectNewMapTable(hexMap: HexMap) {
  const coords =
    hexMap.shape === 'hexagon'
      ? hexUtilsGenHexagonGrid(Math.max(hexMap.length, hexMap.width) - 1)
      : hexUtilsGenRectangleGrid(hexMap.width, hexMap.length)
  expect([...mapTableHexes(hexMap)].sort()).toEqual(
    coords
      .map((coord) => genBoardHexID({ ...coord, altitude: 0 }))
      .sort(),
  )
  expect(hexMap.originQ).toBeUndefined()
  expect(hexMap.originR).toBeUndefined()
}

function expectNoEmptyRectangleRowsOrColumns(
  hexMap: HexMap,
  boardPieces: BoardPiece[],
) {
  const coords = getMapTableFootprintCoords(hexMap, boardPieces)
  const rows = new Set(coords.map(({ r }) => r))
  const columns = new Set(
    coords.map(({ q, r }) => q + Math.floor(r / 2)),
  )

  expect(Array.from({ length: hexMap.length }, (_, row) => rows.has(row))).toEqual(
    Array(hexMap.length).fill(true),
  )
  expect(
    Array.from({ length: hexMap.width }, (_, column) =>
      columns.has(column),
    ),
  ).toEqual(Array(hexMap.width).fill(true))
}

function expectMargin(
  hexMap: HexMap,
  coords: CubeCoordinate[],
  margin: number,
) {
  if (hexMap.shape === 'hexagon') {
    const radius = Math.max(hexMap.length, hexMap.width) - 1
    const centerQ =
      (hexMap.originQ ?? 0) +
      (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
    const centerR = (hexMap.originR ?? 0) + radius
    const centerS = -centerQ - centerR
    for (const { q, r, s } of coords) {
      expect(
        Math.max(
          Math.abs(q - centerQ),
          Math.abs(r - centerR),
          Math.abs(s - centerS),
        ),
      ).toBeLessThanOrEqual(radius - margin)
    }
    return
  }

  const minR = hexMap.originR ?? 0
  const minCol = hexMap.originQ ?? 0
  for (const { q, r } of coords) {
    const col = q + Math.floor(r / 2)
    expect(r - minR).toBeGreaterThanOrEqual(margin)
    expect(minR + hexMap.length - 1 - r).toBeGreaterThanOrEqual(margin)
    expect(col - minCol).toBeGreaterThanOrEqual(margin)
    expect(minCol + hexMap.width - 1 - col).toBeGreaterThanOrEqual(margin)
  }
}

describe('convertMapShape', () => {
  it('normalizes middle rectangle content to top-left and default origin', () => {
    const padded = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 20,
      width: 20,
      originQ: 0,
      originR: 0,
    }
    const result = trimAndNormalizeMap(padded, [piece(Pieces.grass1, 7, 7)])
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap.originQ).toBeUndefined()
    expect(result.hexMap.originR).toBeUndefined()
    expect(result.hexMap.length).toBe(1)
    expect(result.hexMap.width).toBe(1)
    expect(result.boardPieces[0].pieceCoords).toEqual({
      q: 0,
      r: 0,
      s: 0,
    })
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('trims an odd-shifted full-width rectangle to every occupied edge', () => {
    const fullWidth = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 6,
      width: 6,
      originQ: 0,
      originR: 0,
    }
    const pieces = Array.from({ length: 5 * fullWidth.width }, (_, index) => {
      const row = Math.floor(index / fullWidth.width) + 1
      const column = index % fullWidth.width
      return piece(
        Pieces.grass1,
        column - Math.floor(row / 2),
        row,
        { uid: `full-width-${index}` },
      )
    })

    const result = trimAndNormalizeMap(fullWidth, pieces)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap.length).toBe(fullWidth.length - 1)
    expect(result.hexMap.width).toBe(fullWidth.width + 1)
    expect(
      Math.min(...result.boardPieces.map(({ pieceCoords }) => pieceCoords.r)),
    ).toBe(0)
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('trims all empty rows on a full-width rectangle with a zigzag width increase', () => {
    const fullWidth = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 15,
      width: 6,
      originQ: 0,
      originR: 0,
    }
    const pieces = Array.from({ length: 7 * fullWidth.width }, (_, index) => {
      const row = Math.floor(index / fullWidth.width) + 3
      const column = index % fullWidth.width
      return piece(
        Pieces.grass1,
        column - Math.floor(row / 2),
        row,
        { uid: `full-width-gap-${index}` },
      )
    })

    const result = trimAndNormalizeMap(fullWidth, pieces)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap.width).toBe(fullWidth.width + 1)
    expect(result.hexMap.length).toBe(7)
    expect(
      Math.min(...result.boardPieces.map(({ pieceCoords }) => pieceCoords.r)),
    ).toBe(0)
    expect(
      Math.max(...result.boardPieces.map(({ pieceCoords }) => pieceCoords.r)),
    ).toBe(6)
    const table = mapTableHexes(result.hexMap)
    expect(
      result.boardPieces.every((boardPiece) =>
        doesPieceFitOnMap(boardPiece, table),
      ),
    ).toBe(true)
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('keeps an over-maximum zigzag result unchanged with a note', () => {
    const fullWidth = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 3,
      width: MAX_RECTANGLE_MAP_DIMENSION,
      originQ: 0,
      originR: 0,
    }
    const pieces = Array.from({ length: 2 * fullWidth.width }, (_, index) => {
      const row = Math.floor(index / fullWidth.width) + 1
      const column = index % fullWidth.width
      return piece(
        Pieces.grass1,
        column - Math.floor(row / 2),
        row,
        { uid: `over-maximum-${index}` },
      )
    })

    const result = trimAndNormalizeMap(fullWidth, pieces)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap).toBe(fullWidth)
    expect(result.note).toBe('too-wide')
  })

  it('reports when an empty map has no pieces to trim', () => {
    const result = trimAndNormalizeMap(
      {
        ...rectangleFixture,
        shape: 'rectangle',
        length: 10,
        width: 10,
      },
      [],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.note).toBe('empty')
  })

  it('puts a non-full-width odd top row at row 0', () => {
    const padded = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 20,
      width: 20,
      originQ: 0,
      originR: 0,
    }
    const result = trimAndNormalizeMap(padded, [
      piece(Pieces.grass1, 7, 7),
      piece(Pieces.grass1, 8, 8),
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    const table = mapTableHexes(result.hexMap)
    for (const boardPiece of result.boardPieces) {
      expect(doesPieceFitOnMap(boardPiece, table)).toBe(true)
    }
    expect(
      Math.min(...result.boardPieces.map(({ pieceCoords }) => pieceCoords.r)),
    ).toBe(0)
    expect(result.hexMap.width).toBeLessThanOrEqual(padded.width)
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('trims padded rectangles and hexagons to their footprint', () => {
    const rectangle = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 10,
      width: 12,
      originQ: 0,
      originR: 0,
    }
    const rectangleResult = trimAndNormalizeMap(rectangle, [
      piece(Pieces.grass1, 2, 2),
    ])
    expect(rectangleResult.ok).toBe(true)
    if (!rectangleResult.ok) throw new Error(rectangleResult.error)
    expect(rectangleResult.hexMap.length).toBeLessThan(rectangle.length)
    expect(rectangleResult.hexMap.width).toBeLessThan(rectangle.width)
    expectNoEmptyRectangleRowsOrColumns(
      rectangleResult.hexMap,
      rectangleResult.boardPieces,
    )

    const hexagon = {
      ...hexagonFixture,
      shape: 'hexagon' as const,
      length: 10,
      width: 10,
      originQ: 0,
      originR: 0,
    }
    const hexagonResult = trimMap(hexagon, [piece(Pieces.grass1, 2, 2)])
    expect(hexagonResult.ok).toBe(true)
    if (!hexagonResult.ok) throw new Error(hexagonResult.error)
    expect(hexagonResult.hexMap.length).toBeLessThan(hexagon.length)
    expect(hexagonResult.hexMap.width).toBeLessThan(hexagon.width)
  })

  it('does not change an already-trimmed map', () => {
    const trimmed = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 1,
      width: 1,
      originQ: undefined,
      originR: undefined,
    }
    const result = trimAndNormalizeMap(trimmed, [piece(Pieces.grass1, 0, 0)])
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap.length).toBe(trimmed.length)
    expect(result.hexMap.width).toBe(trimmed.width)
    expect(result.hexMap).toBe(trimmed)
    expect(result.note).toBe('already-trimmed')
    expect(result.hexMap.originQ ?? 0).toBe(0)
    expect(result.hexMap.originR ?? 0).toBe(0)
    expect(result.boardPieces[0].pieceCoords).toEqual({
      q: 0,
      r: 0,
      s: 0,
    })
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('trims the dockyard fixture from padded bounds to zero conflicts', () => {
    const fixture = twinIronsDockyard as {
      hexMap: HexMap
      boardPieces: BoardPiece[]
    }
    const padded = {
      ...fixture.hexMap,
      length: 20,
      width: 26,
      originQ: 0,
      originR: 0,
    }
    const result = trimAndNormalizeMap(padded, fixture.boardPieces)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.hexMap.length).toBeLessThanOrEqual(13)
    expect(result.hexMap.width).toBeLessThanOrEqual(19)
    expect(computeConflictedPieceUIDs(result.boardPieces)).toEqual([])
    expectNoEmptyRectangleRowsOrColumns(result.hexMap, result.boardPieces)
  })

  it('keeps markers, start zones, and rim pieces inside the trim', () => {
    const markerHexMap = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 10,
      width: 10,
      originQ: 0,
      originR: 0,
      objectiveMarkers: [
        {
          uid: 'edge-marker',
          anchor: { q: 9, r: 9, s: -18, altitude: 1 },
          size: 2 as const,
          rotation: 0 as const,
          style: 'black' as const,
          content: { kind: 'number' as const, value: 1 },
        },
      ],
    }
    const markerResult = trimAndNormalizeMap(markerHexMap, [])
    expect(markerResult.ok).toBe(true)
    if (!markerResult.ok) throw new Error(markerResult.error)
    expect(markerResult.hexMap.objectiveMarkers?.[0].anchor).toMatchObject({
      q: 0,
      r: 0,
      s: 0,
    })
    expect(
      tableContainsCoords(
        markerResult.hexMap,
        getMapTableFootprintCoords(markerResult.hexMap, []),
      ),
    ).toBe(true)
    expectNoEmptyRectangleRowsOrColumns(markerResult.hexMap, [])

    const startZoneMap = {
      ...rectangleFixture,
      shape: 'rectangle' as const,
      length: 10,
      width: 10,
      originQ: 0,
      originR: 0,
    }
    const startResult = trimAndNormalizeMap(startZoneMap, [
      piece(Pieces.startZone1, 9, 9),
    ])
    expect(startResult.ok).toBe(true)
    if (!startResult.ok) throw new Error(startResult.error)
    expect(
      tableContainsCoords(
        startResult.hexMap,
        getMapTableFootprintCoords(startResult.hexMap, startResult.boardPieces),
      ),
    ).toBe(true)
    expectNoEmptyRectangleRowsOrColumns(
      startResult.hexMap,
      startResult.boardPieces,
    )

    const rimResult = trimAndNormalizeMap(
      {
        ...hexagonFixture,
        shape: 'hexagon' as const,
        length: 7,
        width: 7,
      },
      [piece(Pieces.battlement, 6, 0)],
    )
    expect(rimResult.ok).toBe(true)
  })
  it('preserves piece identities and map details while normalizing coordinates', () => {
    const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
    const rectangleConversion = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
    )
    const rectangle = buildupJsonFileMap(
      rectangleConversion.boardPieces,
      rectangleConversion.hexMap,
    )
    const hexagonConversion = getConvertedMap(
      rectangle.hexMap,
      rectangle.boardPieces,
      'hexagon',
    )
    const hexagon = buildupJsonFileMap(
      hexagonConversion.boardPieces,
      hexagonConversion.hexMap,
    )

    expect(rectangle.boardPieces.map(({ uid }) => uid).sort()).toEqual(
      original.boardPieces.map(({ uid }) => uid).sort(),
    )
    expect(hexagon.boardPieces.map(({ uid }) => uid).sort()).toEqual(
      original.boardPieces.map(({ uid }) => uid).sort(),
    )
    const battlement = hexagon.boardPieces.find(
      ({ inventoryID }) => inventoryID === Pieces.battlement,
    )
    if (!battlement) throw new Error('Expected the rim battlement')
    const radius = hexagon.hexMap.length - 1
    const centerQ =
      (hexagon.hexMap.originQ ?? 0) +
      (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
    const centerR = (hexagon.hexMap.originR ?? 0) + radius
    const centerS = -centerQ - centerR
    expect(
      Math.max(
        Math.abs(battlement.pieceCoords.q - centerQ),
        Math.abs(battlement.pieceCoords.r - centerR),
        Math.abs(battlement.pieceCoords.s - centerS),
      ),
    ).toBeLessThanOrEqual(radius - 1)
    expect(hexagon.hexMap).toMatchObject({
      id: original.hexMap.id,
      name: original.hexMap.name,
      author: original.hexMap.author,
      mapNotes: original.hexMap.mapNotes,
      setsUsed: original.hexMap.setsUsed,
      version: 1,
    })
    expectNewMapTable(rectangle.hexMap)
    expectNewMapTable(hexagon.hexMap)
    expect(
      tableContainsCoords(
        hexagon.hexMap,
        getMapTableFootprintCoords(hexagon.hexMap, hexagon.boardPieces),
      ),
    ).toBe(true)
  })

  it.each(['hexagon', 'rectangle'] as const)(
    'covers all footprints with margin on a %s table',
    (targetShape) => {
      const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
      const converted = getConvertedMap(
        original.hexMap,
        original.boardPieces,
        targetShape,
      )
      expect(
        converted.boardPieces.every((boardPiece) =>
          doesPieceFitOnMap(boardPiece, mapTableHexes(converted.hexMap)),
        ),
      ).toBe(true)
      const convertedFootprints = getMapTableFootprintCoords(
        converted.hexMap,
        converted.boardPieces,
      )
      expect(tableContainsCoords(converted.hexMap, convertedFootprints)).toBe(
        true,
      )
      expectMargin(converted.hexMap, convertedFootprints, 1)
      expectNewMapTable(converted.hexMap)
    },
  )

  it.each([
    {
      label: 'even-sized',
      boardPieces: [piece(Pieces.grass1, 8, 10)],
      size: 2,
    },
    {
      label: 'odd-sized',
      boardPieces: [
        piece(Pieces.grass1, 8, 10),
        piece(Pieces.grass1, 10, 10),
      ],
      size: 3,
    },
  ])(
    'normalizes an off-center rectangle to a new $label hexagon',
    ({ boardPieces, size }) => {
      const sourceMap = {
        ...rectangleFixture,
        shape: 'rectangle' as const,
        length: 20,
        width: 20,
        originQ: 0,
        originR: 0,
      }
      const converted = getConvertedMap(sourceMap, boardPieces, 'hexagon')
      const footprints = getMapTableFootprintCoords(
        converted.hexMap,
        converted.boardPieces,
      )

      expect(converted.hexMap.length).toBe(size)
      expectNewMapTable(converted.hexMap)
      expect(
        converted.boardPieces.every((boardPiece) =>
          doesPieceFitOnMap(boardPiece, mapTableHexes(converted.hexMap)),
        ),
      ).toBe(true)
      expectMargin(converted.hexMap, footprints, 1)
    },
  )

  it('normalizes a hexagon to a new rectangle with a one-hex margin', () => {
    const converted = getConvertedMap(
      mixedHexMap,
      mixedBoardPieces,
      'rectangle',
    )
    const footprints = getMapTableFootprintCoords(
      converted.hexMap,
      converted.boardPieces,
    )

    expectNewMapTable(converted.hexMap)
    expect(Math.min(...footprints.map(({ r }) => r))).toBe(1)
    expect(
      Math.min(
        ...footprints.map(({ q, r }) => q + Math.floor(r / 2)),
      ),
    ).toBe(1)
    expect(
      converted.boardPieces.every((boardPiece) =>
        doesPieceFitOnMap(boardPiece, mapTableHexes(converted.hexMap)),
      ),
    ).toBe(true)
    expect(
      tableContainsCoords(converted.hexMap, footprints),
    ).toBe(true)
  })

  it.each(['hexagon', 'rectangle'] as const)(
    'fits a %s table tightly when margin is zero',
    (targetShape) => {
      const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
      const converted = getConvertedMap(
        original.hexMap,
        original.boardPieces,
        targetShape,
        0,
      )
      const convertedFootprints = getMapTableFootprintCoords(
        converted.hexMap,
        converted.boardPieces,
      )
      expectMargin(converted.hexMap, convertedFootprints, 0)
      if (targetShape === 'hexagon') {
        const radius = converted.hexMap.length - 1
        const smallerMap = {
          ...converted.hexMap,
          width: radius,
          length: radius,
        }
        expect(tableContainsCoords(smallerMap, convertedFootprints)).toBe(false)
      } else {
        const smallerWidth = {
          ...converted.hexMap,
          width: converted.hexMap.width - 1,
        }
        const smallerLength = {
          ...converted.hexMap,
          length: converted.hexMap.length - 1,
        }
        expect(tableContainsCoords(smallerWidth, convertedFootprints)).toBe(
          false,
        )
        expect(tableContainsCoords(smallerLength, convertedFootprints)).toBe(
          false,
        )
      }
    },
  )

  it('preserves piece identities and derived conflict/support state', () => {
    const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
    const conversion = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
    )
    const converted = buildupJsonFileMap(
      conversion.boardPieces,
      conversion.hexMap,
    )
    const originalConflicts = computeConflictedPieceUIDs(original.boardPieces)
    const convertedConflicts = computeConflictedPieceUIDs(converted.boardPieces)
    const originalUnsupported = getUnsupportedLaurAddonUIDs({
      boardPieces: original.boardPieces,
    })
    const convertedUnsupported = getUnsupportedLaurAddonUIDs({
      boardPieces: converted.boardPieces,
    })

    expect(converted.boardPieces.map(({ uid }) => uid).sort()).toEqual(
      original.boardPieces.map(({ uid }) => uid).sort(),
    )
    expectNewMapTable(converted.hexMap)
    expect(originalConflicts.length).toBeGreaterThan(0)
    expect(convertedConflicts).toEqual(originalConflicts)
    expect(originalUnsupported.length).toBeGreaterThan(0)
    expect(convertedUnsupported).toEqual(originalUnsupported)
  })

  it('covers an existing rectangle fixture when converting to hexagon', () => {
    const original = buildupJsonFileMap(
      rectangleFixtureData.boardPieces,
      rectangleFixture,
    )
    const converted = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'hexagon',
      0,
    )

    expect(
      tableContainsCoords(
        converted.hexMap,
        getMapTableFootprintCoords(
          converted.hexMap,
          converted.boardPieces,
        ),
      ),
    ).toBe(true)
    expectNewMapTable(converted.hexMap)
  })

  it('converts a fully covered 40 by 40 rectangle to hexagon and back', () => {
    const requiredSizes: number[] = []
    for (const originR of [0, 1]) {
      const fullRectangle: HexMap = {
        ...rectangleFixture,
        shape: 'rectangle',
        width: 40,
        length: 40,
        originQ: 0,
        originR,
      }
      const coveredPieces = Array.from({ length: 40 * 40 }, (_, index) => {
        const row = originR + Math.floor(index / 40)
        const col = index % 40
        const q = col - Math.floor(row / 2)
        return piece(Pieces.grass1, q, row, {
          uid: `full-rectangle-${originR}-${index}`,
        })
      })
      const toHexagon = convertMapShape(
        fullRectangle,
        coveredPieces,
        'hexagon',
        { margin: 0 },
      )

      expect(toHexagon.ok).toBe(true)
      if (!toHexagon.ok) throw new Error(toHexagon.error)
      requiredSizes.push(toHexagon.hexMap.width)
      if (originR !== 0) continue

      const backToRectangle = convertMapShape(
        toHexagon.hexMap,
        toHexagon.boardPieces,
        'rectangle',
        { margin: 0 },
      )

      expect(backToRectangle.ok).toBe(true)
      if (!backToRectangle.ok) throw new Error(backToRectangle.error)
      expect(backToRectangle.hexMap).toMatchObject({
        width: 40,
        length: 40,
      })
      expect(
        buildupJsonFileMap(
          backToRectangle.boardPieces,
          backToRectangle.hexMap,
        ).boardPieces.map(({ uid }) => uid),
      ).toEqual(coveredPieces.map(({ uid }) => uid))
      expect(backToRectangle.hexMap.shape).toBe('rectangle')
      expectNewMapTable(backToRectangle.hexMap)
    }

    expect(requiredSizes).toEqual([32, 32])
    expect(MAX_HEXAGON_MAP_DIMENSION).toBe(Math.max(...requiredSizes))
  }, 30_000)

  it('covers an existing hexagon fixture when converting to rectangle', () => {
    const original = buildupJsonFileMap(
      hexagonFixtureData.boardPieces,
      hexagonFixture,
    )
    const converted = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
      0,
    )

    expect(
      tableContainsCoords(
        converted.hexMap,
        getMapTableFootprintCoords(
          converted.hexMap,
          converted.boardPieces,
        ),
      ),
    ).toBe(true)
    expectNewMapTable(converted.hexMap)
  })

  it('uses the Create New Map defaults for empty tables', () => {
    const toRectangle = convertMapShape(hexagonFixture, [], 'rectangle')
    const toHexagon = convertMapShape(rectangleFixture, [], 'hexagon')

    expect(toRectangle.ok).toBe(true)
    if (!toRectangle.ok) throw new Error(toRectangle.error)
    expect(toRectangle.hexMap.originQ).toBeUndefined()
    expect(toRectangle.hexMap.originR).toBeUndefined()
    expect(toHexagon.ok).toBe(true)
    if (!toHexagon.ok) throw new Error(toHexagon.error)
    expect(toHexagon.hexMap.originQ).toBeUndefined()
    expect(toHexagon.hexMap.originR).toBeUndefined()
    expect(toRectangle).toMatchObject({
      ok: true,
      hexMap: {
        shape: 'rectangle',
        width: 20,
        length: 20,
      },
    })
    expect(toHexagon).toMatchObject({
      ok: true,
      hexMap: {
        shape: 'hexagon',
        width: 10,
        length: 10,
      },
    })
  })

  it('marks converted hexagons current so legacy loading does not grow them', () => {
    const legacyMap = { ...hexagonFixture, version: 0 }
    const rectangle = getConvertedMap(legacyMap, [], 'rectangle')
    const hexagon = getConvertedMap(rectangle.hexMap, [], 'hexagon')
    const rebuilt = buildupJsonFileMap(hexagon.boardPieces, hexagon.hexMap)

    expect(hexagon.hexMap).toMatchObject({
      version: 1,
      width: 10,
      length: 10,
    })
    expect(rebuilt.hexMap).toMatchObject({
      version: 1,
      width: 10,
      length: 10,
    })
  })

  it('returns an error when the pieces exceed the target shape limits', () => {
    const spreadPieces = [
      piece(Pieces.grass1, -60, 0),
      piece(Pieces.grass1, 60, 0),
    ]

    expect(
      convertMapShape(hexagonFixture, spreadPieces, 'rectangle', {
        margin: 0,
      }),
    ).toEqual({ ok: false, error: 'too-large' })
    expect(
      convertMapShape(rectangleFixture, spreadPieces, 'hexagon', {
        margin: 0,
      }),
    ).toEqual({ ok: false, error: 'too-large' })
  })

  it('rejects invalid margins', () => {
    expect(
      convertMapShape(hexagonFixture, [], 'rectangle', { margin: -1 }),
    ).toEqual({ ok: false, error: 'invalid-margin' })
    expect(
      convertMapShape(hexagonFixture, [], 'rectangle', { margin: 0.5 }),
    ).toEqual({ ok: false, error: 'invalid-margin' })
  })

  it('includes objective marker footprints in the target table', () => {
    const marker = mixedHexMap.objectiveMarkers?.[0]
    if (!marker) throw new Error('Expected the fixture objective marker')

    const original = buildupJsonFileMap([], {
      ...hexagonFixture,
      objectiveMarkers: [marker],
    })
    const converted = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
    )
    const convertedMarker = converted.hexMap.objectiveMarkers?.[0]
    if (!convertedMarker) throw new Error('Expected the converted marker')
    const markerFootprints = getObjectiveMarkerFootprint(convertedMarker)

    expect(tableContainsCoords(converted.hexMap, markerFootprints)).toBe(true)
    expectNewMapTable(converted.hexMap)
  })
})

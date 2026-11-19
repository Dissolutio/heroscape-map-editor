import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import { convertMapShape } from '../data/convertMapShape'
import {
  doesPieceFitOnMap,
  fitMapToPieces,
  getMapTableFootprintCoords,
  mapTableHexes,
} from '../data/fitMapToPieces'
import { getObjectiveMarkerFootprint } from '../data/objectiveMarkers'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import { getUnsupportedLaurAddonUIDs } from '../data/laurAddonSupport'
import type { BoardPiece, CubeCoordinate, HexMap, MapState } from '../types'
import { Pieces } from '../types'
import { MAX_HEXAGON_MAP_DIMENSION } from '../utils/constants'
import { genBoardHexID } from '../utils/map-utils'
import { hexUtilsGenHexagonGrid } from '../utils/hex-utils'

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
  rotation: 0,
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
  return result.hexMap
}

function tableContainsCoords(hexMap: HexMap, coords: CubeCoordinate[]) {
  const table = mapTableHexes(hexMap)
  return coords.every((coord) =>
    table.has(genBoardHexID({ ...coord, altitude: 0 })),
  )
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

function pieceHexes(map: MapState) {
  return Object.values(map.boardHexes)
    .filter((hex) => hex.boardPieceUID)
    .map(({ id, terrain, altitude, boardPieceUID }) => ({
      id,
      terrain,
      altitude,
      boardPieceUID,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

describe('convertMapShape', () => {
  it('round-trips a mixed hexagon map without changing its pieces or details', () => {
    const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
    const rectangle = buildupJsonFileMap(
      original.boardPieces,
      getConvertedMap(original.hexMap, original.boardPieces, 'rectangle'),
    )
    const hexagon = buildupJsonFileMap(
      rectangle.boardPieces,
      getConvertedMap(rectangle.hexMap, rectangle.boardPieces, 'hexagon'),
    )

    expect(rectangle.boardPieces).toEqual(original.boardPieces)
    expect(hexagon.boardPieces).toEqual(original.boardPieces)
    const battlement = original.boardPieces.find(
      ({ inventoryID }) => inventoryID === Pieces.battlement,
    )
    if (!battlement) throw new Error('Expected the rim battlement')
    const radius = original.hexMap.length - 1
    const centerQ =
      (original.hexMap.originQ ?? 0) +
      (radius % 2 === 0 ? radius / 2 : Math.floor(radius / 2 + 0.5))
    const centerR = (original.hexMap.originR ?? 0) + radius
    const centerS = -centerQ - centerR
    expect(
      Math.max(
        Math.abs(battlement.pieceCoords.q - centerQ),
        Math.abs(battlement.pieceCoords.r - centerR),
        Math.abs(battlement.pieceCoords.s - centerS),
      ),
    ).toBe(radius)
    expect(hexagon.hexMap).toMatchObject({
      id: original.hexMap.id,
      name: original.hexMap.name,
      author: original.hexMap.author,
      mapNotes: original.hexMap.mapNotes,
      setsUsed: original.hexMap.setsUsed,
      objectiveMarkers: original.hexMap.objectiveMarkers,
      version: 1,
    })
  })

  it.each(['hexagon', 'rectangle'] as const)(
    'covers all footprints with margin on a %s table',
    (targetShape) => {
      const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
      const convertedMap = getConvertedMap(
        original.hexMap,
        original.boardPieces,
        targetShape,
      )
      const footprints = getMapTableFootprintCoords(
        original.hexMap,
        original.boardPieces,
      )

      expect(
        original.boardPieces.every((boardPiece) =>
          doesPieceFitOnMap(boardPiece, mapTableHexes(convertedMap)),
        ),
      ).toBe(true)
      expect(tableContainsCoords(convertedMap, footprints)).toBe(true)
      expectMargin(convertedMap, footprints, 1)
    },
  )

  it.each(['hexagon', 'rectangle'] as const)(
    'fits a %s table tightly when margin is zero',
    (targetShape) => {
      const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
      const convertedMap = getConvertedMap(
        original.hexMap,
        original.boardPieces,
        targetShape,
        0,
      )
      const footprints = getMapTableFootprintCoords(
        original.hexMap,
        original.boardPieces,
      )

      expectMargin(convertedMap, footprints, 0)
      if (targetShape === 'hexagon') {
        const radius = convertedMap.length - 1
        const smallerMap = {
          ...convertedMap,
          width: radius,
          length: radius,
        }
        expect(tableContainsCoords(smallerMap, footprints)).toBe(false)
      } else {
        const smallerWidth = { ...convertedMap, width: convertedMap.width - 1 }
        const smallerLength = {
          ...convertedMap,
          length: convertedMap.length - 1,
        }
        expect(tableContainsCoords(smallerWidth, footprints)).toBe(false)
        expect(tableContainsCoords(smallerLength, footprints)).toBe(false)
      }
    },
  )

  it('keeps piece hexes and derived conflict/support state equivalent', () => {
    const original = buildupJsonFileMap(mixedBoardPieces, mixedHexMap)
    const converted = buildupJsonFileMap(
      original.boardPieces,
      getConvertedMap(original.hexMap, original.boardPieces, 'rectangle'),
    )
    const originalConflicts = computeConflictedPieceUIDs(original.boardPieces)
    const convertedConflicts = computeConflictedPieceUIDs(converted.boardPieces)
    const originalUnsupported = getUnsupportedLaurAddonUIDs({
      boardPieces: original.boardPieces,
    })
    const convertedUnsupported = getUnsupportedLaurAddonUIDs({
      boardPieces: converted.boardPieces,
    })

    expect(pieceHexes(converted)).toEqual(pieceHexes(original))
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
    const convertedMap = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'hexagon',
      0,
    )

    expect(
      tableContainsCoords(
        convertedMap,
        getMapTableFootprintCoords(original.hexMap, original.boardPieces),
      ),
    ).toBe(true)
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
      const toHexagon = convertMapShape(fullRectangle, coveredPieces, 'hexagon')

      expect(toHexagon.ok).toBe(true)
      if (!toHexagon.ok) throw new Error(toHexagon.error)
      requiredSizes.push(toHexagon.hexMap.width)
      if (originR !== 0) continue

      const backToRectangle = convertMapShape(
        toHexagon.hexMap,
        coveredPieces,
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
        buildupJsonFileMap(coveredPieces, backToRectangle.hexMap).boardPieces,
      ).toEqual(coveredPieces)
      expect(backToRectangle.hexMap.shape).toBe('rectangle')
    }

    expect(requiredSizes).toEqual([32, 32])
    expect(MAX_HEXAGON_MAP_DIMENSION).toBe(Math.max(...requiredSizes))
  }, 30_000)

  it('covers an existing hexagon fixture when converting to rectangle', () => {
    const original = buildupJsonFileMap(
      hexagonFixtureData.boardPieces,
      hexagonFixture,
    )
    const convertedMap = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
      0,
    )

    expect(
      tableContainsCoords(
        convertedMap,
        getMapTableFootprintCoords(original.hexMap, original.boardPieces),
      ),
    ).toBe(true)
  })

  it('uses the Create New Map defaults for empty tables', () => {
    const toRectangle = convertMapShape(hexagonFixture, [], 'rectangle')
    const toHexagon = convertMapShape(rectangleFixture, [], 'hexagon')

    expect(toRectangle).toMatchObject({
      ok: true,
      hexMap: {
        shape: 'rectangle',
        width: 20,
        length: 20,
        originQ: 0,
        originR: 0,
      },
    })
    expect(toHexagon).toMatchObject({
      ok: true,
      hexMap: {
        shape: 'hexagon',
        width: 10,
        length: 10,
        originQ: 0,
        originR: 0,
      },
    })
  })

  it('marks converted hexagons current so legacy loading does not grow them', () => {
    const legacyMap = { ...hexagonFixture, version: 0 }
    const rectangle = getConvertedMap(legacyMap, [], 'rectangle')
    const hexagon = getConvertedMap(rectangle, [], 'hexagon')
    const rebuilt = buildupJsonFileMap([], hexagon)

    expect(hexagon).toMatchObject({
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
    const convertedMap = getConvertedMap(
      original.hexMap,
      original.boardPieces,
      'rectangle',
      0,
    )
    const markerFootprints = getObjectiveMarkerFootprint(marker)

    expect(tableContainsCoords(convertedMap, markerFootprints)).toBe(true)
  })
})

import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import { hexUtilsAdd } from '../utils/hex-utils'
import {
  DEFAULT_NEW_HEXAGON_MAP_SIZE,
  DEFAULT_NEW_RECTANGLE_MAP_LENGTH,
  DEFAULT_NEW_RECTANGLE_MAP_WIDTH,
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import {
  getHexagonTableFit,
  getMapTableFootprintCoords,
  mapTableHexes,
} from './fitMapToPieces'

export type MapShape = 'hexagon' | 'rectangle'

export type ConvertMapShapeResult =
  | { ok: true; hexMap: HexMap; boardPieces: BoardPiece[] }
  | { ok: false; error: 'invalid-margin' | 'too-large' }

export function convertMapShape(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
  targetShape: MapShape,
  options: { margin?: number } = {},
): ConvertMapShapeResult {
  const margin = options.margin ?? 1
  if (!Number.isInteger(margin) || margin < 0) {
    return { ok: false, error: 'invalid-margin' }
  }

  const footprintCoords = getMapTableFootprintCoords(hexMap, boardPieces)
  if (!footprintCoords.length) {
    return {
      ok: true,
      hexMap: withoutOrigin({
        ...hexMap,
        shape: targetShape,
        length:
          targetShape === 'hexagon'
            ? DEFAULT_NEW_HEXAGON_MAP_SIZE
            : DEFAULT_NEW_RECTANGLE_MAP_LENGTH,
        width:
          targetShape === 'hexagon'
            ? DEFAULT_NEW_HEXAGON_MAP_SIZE
            : DEFAULT_NEW_RECTANGLE_MAP_WIDTH,
        originQ: 0,
        originR: 0,
        version: 1,
      }),
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
    }
  }

  const normalized = normalizeMapContent(
    hexMap,
    boardPieces,
    targetShape,
    margin,
  )
  if (!normalized) return { ok: false, error: 'too-large' }
  if (
    targetShape === 'rectangle' &&
    (normalized.hexMap.length > MAX_RECTANGLE_MAP_DIMENSION ||
      normalized.hexMap.width > MAX_RECTANGLE_MAP_DIMENSION)
  ) {
    return { ok: false, error: 'too-large' }
  }
  return { ok: true, ...normalized }
}

type TrimMapResult =
  | { ok: true; hexMap: HexMap }
  | { ok: false; error: 'invalid-margin' | 'too-large' }

export function trimMap(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): TrimMapResult {
  const result = trimAndNormalizeMap(hexMap, boardPieces)
  return result.ok
    ? { ok: true, hexMap: result.hexMap }
    : { ok: false, error: result.error }
}

export type TrimAndNormalizeResult =
  | {
      ok: true
      hexMap: HexMap
      boardPieces: BoardPiece[]
      note?: 'empty' | 'already-trimmed' | 'too-wide' | 'too-long'
    }
  | { ok: false; error: 'too-large' }

function translateCoordinate(
  coordinate: CubeCoordinate,
  offset: CubeCoordinate,
): CubeCoordinate {
  const translated = hexUtilsAdd(coordinate, offset)
  return {
    ...translated,
    s: translated.s === 0 ? 0 : translated.s,
  }
}

export function normalizeLegacyMapOrigin(
  hexMap: HexMap,
  boardPieces: BoardPiece[],
): { hexMap: HexMap; boardPieces: BoardPiece[] } {
  const originQ = hexMap.originQ ?? 0
  const originR = hexMap.originR ?? 0
  if (originQ === 0 && originR === 0) return { hexMap, boardPieces }

  const offset =
    hexMap.shape === 'hexagon'
      ? { q: -originQ, r: -originR, s: originQ + originR }
      : {
          q: originR / 2 - originQ,
          r: -originR,
          s: originQ + originR / 2,
        }

  if (hexMap.shape === 'rectangle') {
    if (!Number.isInteger(originR / 2)) return { hexMap, boardPieces }
    const tableHexes = mapTableHexes(withoutOrigin(hexMap))
    const footprintCoords = getMapTableFootprintCoords(hexMap, boardPieces)
    if (
      !footprintCoords.every((coords) =>
        tableHexes.has(
          genBoardHexID({
            ...translateCoordinate(coords, offset),
            altitude: 0,
          }),
        ),
      )
    ) {
      return { hexMap, boardPieces }
    }
  }

  const normalizedHexMap = withoutOrigin({
    ...hexMap,
    ...(hexMap.objectiveMarkers
      ? {
          objectiveMarkers: hexMap.objectiveMarkers.map((marker) => ({
            ...marker,
            anchor: {
              ...translateCoordinate(marker.anchor, offset),
              altitude: marker.anchor.altitude,
            },
          })),
        }
      : {}),
  })
  return {
    hexMap: normalizedHexMap,
    boardPieces: boardPieces.map((piece) => ({
      ...piece,
      pieceCoords: translateCoordinate(piece.pieceCoords, offset),
    })),
  }
}

function haveSameCoordinates(
  firstPieces: readonly BoardPiece[],
  secondPieces: readonly BoardPiece[],
  firstMarkers: NonNullable<HexMap['objectiveMarkers']>,
  secondMarkers: NonNullable<HexMap['objectiveMarkers']>,
) {
  return (
    firstPieces.length === secondPieces.length &&
    firstPieces.every(
      (piece, index) =>
        piece.pieceCoords.q === secondPieces[index]?.pieceCoords.q &&
        piece.pieceCoords.r === secondPieces[index]?.pieceCoords.r &&
        piece.pieceCoords.s === secondPieces[index]?.pieceCoords.s,
    ) &&
    firstMarkers.length === secondMarkers.length &&
    firstMarkers.every(
      (marker, index) =>
        marker.anchor.q === secondMarkers[index]?.anchor.q &&
        marker.anchor.r === secondMarkers[index]?.anchor.r &&
        marker.anchor.s === secondMarkers[index]?.anchor.s &&
        marker.anchor.altitude === secondMarkers[index]?.anchor.altitude,
    )
  )
}

function withoutOrigin(hexMap: HexMap): HexMap {
  const { originQ: _originQ, originR: _originR, ...normalized } = hexMap
  return normalized
}

function normalizeMapContent(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
  targetShape: MapShape,
  margin: number,
): { hexMap: HexMap; boardPieces: BoardPiece[] } | null {
  const originalMarkers = hexMap.objectiveMarkers ?? []
  const footprintCoords = getMapTableFootprintCoords(hexMap, boardPieces)
  if (!footprintCoords.length) return null

  if (targetShape === 'rectangle') {
    const minR = Math.min(...footprintCoords.map(({ r }) => r))
    const rowOffset = margin - minR
    const shiftedPieces = boardPieces.map((piece) => ({
      ...piece,
      pieceCoords: translateCoordinate(piece.pieceCoords, {
        q: 0,
        r: rowOffset,
        s: -rowOffset,
      }),
    }))
    const shiftedMarkers = originalMarkers.map((marker) => ({
      ...marker,
      anchor: {
        ...translateCoordinate(marker.anchor, {
          q: 0,
          r: rowOffset,
          s: -rowOffset,
        }),
        altitude: marker.anchor.altitude,
      },
    }))
    const shiftedMap = { ...hexMap, objectiveMarkers: shiftedMarkers }
    const shiftedCoords = getMapTableFootprintCoords(shiftedMap, shiftedPieces)
    const minColumn = Math.min(
      ...shiftedCoords.map(({ q, r }) => q + Math.floor(r / 2)),
    )
    const columnOffset = margin - minColumn
    const normalizedPieces = shiftedPieces.map((piece) => ({
      ...piece,
      pieceCoords: translateCoordinate(piece.pieceCoords, {
        q: columnOffset,
        r: 0,
        s: -columnOffset,
      }),
    }))
    const normalizedMarkers = shiftedMarkers.map((marker) => ({
      ...marker,
      anchor: {
        ...translateCoordinate(marker.anchor, {
          q: columnOffset,
          r: 0,
          s: -columnOffset,
        }),
        altitude: marker.anchor.altitude,
      },
    }))
    const normalizedMap = {
      ...hexMap,
      ...(originalMarkers.length
        ? { objectiveMarkers: normalizedMarkers }
        : {}),
    }
    const normalizedCoords = getMapTableFootprintCoords(
      normalizedMap,
      normalizedPieces,
    )
    const maxR = Math.max(...normalizedCoords.map(({ r }) => r))
    const maxColumn = Math.max(
      ...normalizedCoords.map(({ q, r }) => q + Math.floor(r / 2)),
    )
    return {
      hexMap: withoutOrigin({
        ...normalizedMap,
        shape: targetShape,
        length: maxR + margin + 1,
        width: maxColumn + margin + 1,
        originQ: 0,
        originR: 0,
        version: 1,
      }),
      boardPieces: normalizedPieces,
    }
  }

  const fit = getHexagonTableFit(
    footprintCoords,
    0,
    margin,
    MAX_HEXAGON_MAP_DIMENSION - 1,
  )
  if (!fit) return null
  const offset = {
    q: -fit.originQ,
    r: -fit.originR,
    s: fit.originQ + fit.originR,
  }
  const normalizedPieces = boardPieces.map((piece) => ({
    ...piece,
    pieceCoords: translateCoordinate(piece.pieceCoords, offset),
  }))
  const normalizedMarkers = originalMarkers.map((marker) => ({
    ...marker,
    anchor: {
      ...translateCoordinate(marker.anchor, offset),
      altitude: marker.anchor.altitude,
    },
  }))
  return {
    hexMap: withoutOrigin({
      ...hexMap,
      shape: targetShape,
      length: fit.radius + 1,
      width: fit.radius + 1,
      originQ: 0,
      originR: 0,
      ...(originalMarkers.length
        ? { objectiveMarkers: normalizedMarkers }
        : {}),
      version: 1,
    }),
    boardPieces: normalizedPieces,
  }
}

export function trimAndNormalizeMap(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): TrimAndNormalizeResult {
  const footprintCoords = getMapTableFootprintCoords(hexMap, boardPieces)
  if (!footprintCoords.length) {
    return {
      ok: true,
      hexMap:
        hexMap.originQ === undefined && hexMap.originR === undefined
          ? hexMap
          : withoutOrigin(hexMap),
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: boardPieces.length === 0 ? 'empty' : 'already-trimmed',
    }
  }

  const normalized = normalizeMapContent(
    hexMap,
    boardPieces,
    hexMap.shape === 'hexagon' ? 'hexagon' : 'rectangle',
    0,
  )
  if (!normalized) return { ok: false, error: 'too-large' }
  const { hexMap: normalizedHexMap, boardPieces: normalizedPieces } = normalized

  if (hexMap.shape === 'rectangle' && normalizedHexMap.length > hexMap.length) {
    return {
      ok: true,
      hexMap,
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: 'too-long',
    }
  }
  if (
    hexMap.shape === 'rectangle' &&
    normalizedHexMap.width > MAX_RECTANGLE_MAP_DIMENSION
  ) {
    return {
      ok: true,
      hexMap,
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: 'too-wide',
    }
  }
  if (
    hexMap.shape === 'hexagon' &&
    (normalizedHexMap.length > hexMap.length ||
      normalizedHexMap.width > hexMap.width)
  ) {
    return {
      ok: true,
      hexMap,
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: 'already-trimmed',
    }
  }
  if (
    normalizedHexMap.length === hexMap.length &&
    normalizedHexMap.width === hexMap.width &&
    (hexMap.shape === 'hexagon' ||
      ((hexMap.originQ ?? 0) === 0 && (hexMap.originR ?? 0) === 0)) &&
    haveSameCoordinates(
      boardPieces,
      normalizedPieces,
      hexMap.objectiveMarkers ?? [],
      normalizedHexMap.objectiveMarkers ?? [],
    )
  ) {
    return {
      ok: true,
      hexMap,
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: boardPieces.length === 0 ? 'empty' : 'already-trimmed',
    }
  }
  return {
    ok: true,
    hexMap: normalizedHexMap,
    boardPieces: normalizedPieces,
    ...(boardPieces.length === 0 ? { note: 'empty' as const } : {}),
  }
}

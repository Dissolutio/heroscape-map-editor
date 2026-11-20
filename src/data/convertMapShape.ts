import type { BoardPiece, HexMap } from '../types'
import type { CubeCoordinate } from '../types'
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
  getRectangleTableFit,
  mapTableHexes,
} from './fitMapToPieces'

export type MapShape = 'hexagon' | 'rectangle'

export type ConvertMapShapeResult =
  | { ok: true; hexMap: HexMap }
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
  let length: number
  let width: number
  let originQ: number
  let originR: number

  if (!footprintCoords.length) {
    if (targetShape === 'hexagon') {
      length = DEFAULT_NEW_HEXAGON_MAP_SIZE
      width = DEFAULT_NEW_HEXAGON_MAP_SIZE
    } else {
      length = DEFAULT_NEW_RECTANGLE_MAP_LENGTH
      width = DEFAULT_NEW_RECTANGLE_MAP_WIDTH
    }
    originQ = 0
    originR = 0
  } else if (targetShape === 'hexagon') {
    const fit = getHexagonTableFit(
      footprintCoords,
      0,
      margin,
      MAX_HEXAGON_MAP_DIMENSION - 1,
    )
    if (!fit) return { ok: false, error: 'too-large' }
    length = fit.radius + 1
    width = fit.radius + 1
    originQ = fit.originQ
    originR = fit.originR
    if (length > MAX_HEXAGON_MAP_DIMENSION) {
      return { ok: false, error: 'too-large' }
    }
  } else {
    const fit = getRectangleTableFit(footprintCoords, { margin })
    if (!fit) return { ok: false, error: 'too-large' }
    length = fit.length
    width = fit.width
    originQ = fit.originQ
    originR = fit.originR
    if (
      length > MAX_RECTANGLE_MAP_DIMENSION ||
      width > MAX_RECTANGLE_MAP_DIMENSION
    ) {
      return { ok: false, error: 'too-large' }
    }
  }

  return {
    ok: true,
    hexMap: {
      ...hexMap,
      shape: targetShape,
      length,
      width,
      originQ,
      originR,
      version: 1,
    },
  }
}

export function trimMap(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): ConvertMapShapeResult {
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
  return hexUtilsAdd(coordinate, offset)
}

function withoutOrigin(hexMap: HexMap): HexMap {
  const { originQ: _originQ, originR: _originR, ...normalized } = hexMap
  return normalized
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

export function trimAndNormalizeMap(
  hexMap: HexMap,
  boardPieces: readonly BoardPiece[],
): TrimAndNormalizeResult {
  if (hexMap.shape === 'rectangle') {
    const originalMarkers = hexMap.objectiveMarkers ?? []
    const originalCoords = getMapTableFootprintCoords(hexMap, boardPieces)
    if (!originalCoords.length) {
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

    const minOriginalR = Math.min(...originalCoords.map(({ r }) => r))
    // Shift the top-left content to 0,0,0 with no empty rows or columns;
    // odd-row zigzag shifts may add one column.
    const rowOffset = -minOriginalR
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
    const shiftedHexMap = { ...hexMap, objectiveMarkers: shiftedMarkers }
    const shiftedCoords = getMapTableFootprintCoords(
      shiftedHexMap,
      shiftedPieces,
    )
    if (!shiftedCoords.length) return { ok: false, error: 'too-large' }
    const minColumn = Math.min(
      ...shiftedCoords.map(({ q, r }) => q + Math.floor(r / 2)),
    )
    const columnOffset = -minColumn
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
    const normalizedHexMap = {
      ...hexMap,
      ...(originalMarkers.length
        ? { objectiveMarkers: normalizedMarkers }
        : {}),
    }
    const normalizedCoords = getMapTableFootprintCoords(
      normalizedHexMap,
      normalizedPieces,
    )
    const maxR = Math.max(...normalizedCoords.map(({ r }) => r))
    const maxCol = Math.max(
      ...normalizedCoords.map(({ q, r }) => q + Math.floor(r / 2)),
    )
    const length = maxR + 1
    const width = maxCol + 1
    if (length > hexMap.length) {
      return {
        ok: true,
        hexMap,
        boardPieces: boardPieces.map((p) => ({ ...p })),
        note: 'too-long',
      }
    }
    if (width > MAX_RECTANGLE_MAP_DIMENSION) {
      return {
        ok: true,
        hexMap,
        boardPieces: boardPieces.map((piece) => ({ ...piece })),
        note: 'too-wide',
      }
    }
    if (
      length === hexMap.length &&
      width === hexMap.width &&
      (hexMap.originQ ?? 0) === 0 &&
      (hexMap.originR ?? 0) === 0 &&
      haveSameCoordinates(
        boardPieces,
        normalizedPieces,
        originalMarkers,
        normalizedMarkers,
      )
    ) {
      return {
        ok: true,
        hexMap,
        boardPieces: boardPieces.map((piece) => ({ ...piece })),
        note: boardPieces.length === 0 ? 'empty' : 'already-trimmed',
      }
    }
    const candidateHexMap = withoutOrigin({
      ...normalizedHexMap,
      length,
      width,
      originQ: 0,
      originR: 0,
      version: 1,
    })
    return {
      ok: true,
      hexMap: candidateHexMap,
      boardPieces: normalizedPieces,
      ...(boardPieces.length === 0 ? { note: 'empty' as const } : {}),
    }
  }

  const footprintCoords = getMapTableFootprintCoords(hexMap, boardPieces)
  if (!footprintCoords.length) {
    return {
      ok: true,
      hexMap: withoutOrigin(hexMap),
      boardPieces: boardPieces.map((piece) => ({ ...piece })),
      note: boardPieces.length === 0 ? 'empty' : 'already-trimmed',
    }
  }
  const fit = getHexagonTableFit(
    footprintCoords,
    0,
    0,
    MAX_HEXAGON_MAP_DIMENSION - 1,
  )
  if (!fit) return { ok: false, error: 'too-large' }
  const size = fit.radius + 1
  const offset = {
    q: -fit.originQ,
    r: -fit.originR,
    s: fit.originQ + fit.originR,
  }
  const translatedPieces = boardPieces.map((piece) => ({
    ...piece,
    pieceCoords: translateCoordinate(piece.pieceCoords, offset),
  }))
  const translatedMarkers = (hexMap.objectiveMarkers ?? []).map((marker) => ({
    ...marker,
    anchor: {
      ...translateCoordinate(marker.anchor, offset),
      altitude: marker.anchor.altitude,
    },
  }))
  const normalizedHexMap = withoutOrigin({
    ...hexMap,
    length: size,
    width: size,
    originQ: 0,
    originR: 0,
    ...(translatedMarkers.length
      ? { objectiveMarkers: translatedMarkers }
      : {}),
    version: 1,
  })
  if (size > hexMap.length || size > hexMap.width) {
    return {
      ok: true,
      hexMap,
      boardPieces: boardPieces.map((p) => ({ ...p })),
      note: boardPieces.length === 0 ? 'empty' : 'already-trimmed',
    }
  }
  if (
    size === hexMap.length &&
    size === hexMap.width &&
    haveSameCoordinates(
      boardPieces,
      translatedPieces,
      hexMap.objectiveMarkers ?? [],
      translatedMarkers,
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
    boardPieces: translatedPieces,
    ...(boardPieces.length === 0 ? { note: 'empty' as const } : {}),
  }
}

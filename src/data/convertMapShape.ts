import type { BoardPiece, HexMap } from '../types'
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

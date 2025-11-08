import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from './constants'
import { generateHexagon, generateRectangle } from './hex-gen'

export function makeRectangleMapEmptyHexes(
  width?: number,
  length?: number
) {
  return generateRectangle(Math.min(length ?? 15, MAX_RECTANGLE_MAP_DIMENSION),
    Math.min(width ?? 15, MAX_RECTANGLE_MAP_DIMENSION))
}
export function makeHexagonMapEmptyHexes(size?: number) {
  return generateHexagon(Math.min(size ?? 12, MAX_HEXAGON_MAP_DIMENSION))
}
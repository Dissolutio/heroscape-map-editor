import {
  HEXGRID_HEX_RADIUS,
} from './constants'
import {
  CubeCoordinate,
} from '../types'

export const hexUtilsAdd = (
  a: CubeCoordinate,
  b: CubeCoordinate
): CubeCoordinate => {
  return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s }
}
const hexUtilsSubtract = (
  a: CubeCoordinate,
  b: CubeCoordinate
): CubeCoordinate => {
  return { q: a.q - b.q, r: a.r - b.r, s: a.s - b.s }
}
export const cubeToPixel = (hex: CubeCoordinate) => {
  const x =
    HEXGRID_HEX_RADIUS * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r)
  const y = HEXGRID_HEX_RADIUS * ((3 / 2) * hex.r)
  return { x: x, y: y }
}
export function hexUtilsOddRToCube(x: number, y: number) {
  const q = x - (y - (y % 2)) / 2
  return { q, r: y, s: -q - y } // NOTE: Here I discovered JavaScript's negative zero: (-0 - 0)=>(-0) But at least: (-0).toString() => "0"
}
function hexUtilsRotateVector(
  v: CubeCoordinate,
  rotation: number
): CubeCoordinate {
  switch (rotation % 6) {
    case 1:
      return {
        q: -v.r,
        r: -v.s,
        s: -v.q,
      }
    case 2:
      return {
        q: v.s,
        r: v.q,
        s: v.r,
      }
    case 3:
      return {
        q: -v.q,
        r: -v.r,
        s: -v.s,
      }
    case 4:
      return {
        q: v.r,
        r: v.s,
        s: v.q,
      }
    case 5:
      return {
        q: -v.s,
        r: -v.q,
        s: -v.r,
      }
    case 0:
    default:
      return v
  }
}
/* hexUtilsRotate: not this does not update the IDS of boardHexes */
export function hexUtilsRotate<T extends CubeCoordinate>(
  h: T,
  origin: T,
  rotation: number
): T {
  const vector = hexUtilsSubtract(h, origin)
  const rotatedVector = hexUtilsRotateVector(vector, rotation)
  return {
    ...h,
    ...hexUtilsAdd(rotatedVector, origin),
  }
}
export function hexUtilsGenHexagonGrid(mapRadius: number): CubeCoordinate[] {
  const hexas: CubeCoordinate[] = []
  for (let q = -mapRadius; q <= mapRadius; q++) {
    const r1 = Math.max(-mapRadius, -q - mapRadius)
    const r2 = Math.min(mapRadius, -q + mapRadius)
    for (let r = r1; r <= r2; r++) {
      hexas.push({ q, r, s: -q - r })
    }
  }
  return hexas
}
export function hexUtilsGenRectangleGrid(
  mapWidth: number,
  mapHeight: number
): CubeCoordinate[] {
  const hexas: CubeCoordinate[] = []
  for (let r = 0; r < mapHeight; r++) {
    const offset = Math.floor(r / 2) // or r>>1
    for (let q = -offset; q < mapWidth - offset; q++) {
      hexas.push({ q, r, s: -q - r })
    }
  }
  return hexas
}
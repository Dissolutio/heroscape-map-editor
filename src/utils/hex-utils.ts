import type { BoardHex, CubeCoordinate } from '../types'
import {
  CUBE_EAST,
  CUBE_NE,
  CUBE_NW,
  CUBE_SE,
  CUBE_SW,
  CUBE_WEST,
  HEXGRID_HEX_RADIUS,
  ORIGIN_000,
} from './constants'

export const hexUtilsEquals = (
  a: CubeCoordinate,
  b: CubeCoordinate,
): boolean => {
  return a.q === b.q && a.r === b.r && a.s === b.s
}
export const hexUtilsAdd = (
  a: CubeCoordinate,
  b: CubeCoordinate,
): CubeCoordinate => {
  return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s }
}
const hexUtilsSubtract = (
  a: CubeCoordinate,
  b: CubeCoordinate,
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
export function hexUtilsCubeToOddR(hex: CubeCoordinate) {
  // https://www.redblobgames.com/grids/hexagons/#conversions-offset
  const col = hex.q + (hex.r - (hex.r & 1)) / 2
  const row = hex.r
  return { x: col, y: row }
}
function hexUtilsRotateVector(
  v: CubeCoordinate,
  rotation: number,
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
    default:
      return v
  }
}
export function hexUtilsRotateAroundOrigin_000(
  h: CubeCoordinate,
  rotation: number,
): CubeCoordinate {
  // origin could be passed in, but we only rotate around 0,0,0 for now (the tile-templates are built at/around 0,0,0)
  const vector = hexUtilsSubtract(h, ORIGIN_000)
  const rotatedVector = hexUtilsRotateVector(vector, rotation)
  return {
    ...h,
    ...hexUtilsAdd(rotatedVector, ORIGIN_000),
  }
}
export function hexUtilsGenHexagonGrid(mapRadius: number): CubeCoordinate[] {
  const hexas: CubeCoordinate[] = []

  // Calculate the offset to shift the hexagon down and to the right
  const offsetQ =
    mapRadius % 2 === 0 ? mapRadius / 2 : Math.floor(mapRadius / 2 + 0.5) // Shift right
  const offsetR = mapRadius // Shift down

  for (let q = -mapRadius; q <= mapRadius; q++) {
    const r1 = Math.max(-mapRadius, -q - mapRadius)
    const r2 = Math.min(mapRadius, -q + mapRadius)
    for (let r = r1; r <= r2; r++) {
      // Apply the offset to q and r
      hexas.push({
        q: q + offsetQ,
        r: r + offsetR,
        s: -(q + offsetQ) - (r + offsetR),
      })
    }
  }
  return hexas
}
export function hexUtilsGenRectangleGrid(
  mapWidth: number,
  mapHeight: number,
): CubeCoordinate[] {
  const hexas: CubeCoordinate[] = []
  for (let r = 0; r < mapWidth; r++) {
    const offset = Math.floor(r / 2) // or r>>1
    for (let q = -offset; q < mapHeight - offset; q++) {
      hexas.push({ q, r, s: -q - r })
    }
  }
  return hexas
}
export const HEX_DIRECTIONS: { [rotation: number]: CubeCoordinate } = {
  0: CUBE_EAST,
  1: CUBE_SE,
  2: CUBE_SW,
  3: CUBE_WEST,
  4: CUBE_NW,
  5: CUBE_NE,
}

const CUBE_FAR_NORTH = hexUtilsAdd(CUBE_NE, CUBE_NW)
const CUBE_FAR_NE = hexUtilsAdd(CUBE_NE, CUBE_EAST)
const CUBE_FAR_SE = hexUtilsAdd(CUBE_SE, CUBE_EAST)
const CUBE_FAR_SOUTH = hexUtilsAdd(CUBE_SE, CUBE_SW)
const CUBE_FAR_SW = hexUtilsAdd(CUBE_SW, CUBE_WEST)
const CUBE_FAR_NW = hexUtilsAdd(CUBE_NW, CUBE_WEST)
const radialDirections: { [rotation: number]: CubeCoordinate } = {
  0.5: CUBE_FAR_SE,
  1.5: CUBE_FAR_SOUTH,
  2.5: CUBE_FAR_SW,
  3.5: CUBE_FAR_NW,
  4.5: CUBE_FAR_NORTH,
  5.5: CUBE_FAR_NE,
}
/* For most calculation, we go hex-center to hex-center, 
drawing a line from our hex-center through the midpoint of a side.
This is an apothem, not a radius. A radial line goes to an edge, bordering
2 hexes and then beyond to a far hex's center.
Some things, like laur longwall/ruin addons, use this radial line.

No clue if my terminology is geometer approved.
 */
// const radialNearNeighbors: Dictionary<[CubeCoordinate, CubeCoordinate]> = {
//   '0.5': [CUBE_EAST, CUBE_SE],
//   '1.5': [CUBE_SE, CUBE_SW],
//   '2.5': [CUBE_SW, CUBE_WEST],
//   '3.5': [CUBE_WEST, CUBE_NW],
//   '4.5': [CUBE_NW, CUBE_NE],
//   '5.5': [CUBE_NE, CUBE_EAST],
// }
export const hexUtilsGetRadialNearNeighborsForRotation = (
  rotation: number,
): [CubeCoordinate, CubeCoordinate] => {
  return [
    HEX_DIRECTIONS[(rotation - 0.5) % 6],
    HEX_DIRECTIONS[(rotation + 0.5) % 6],
  ]
}
export const hexUtilsGetRadialFarNeighborForRotation = (
  rotation: number,
): CubeCoordinate => {
  const rot = rotation % 6
  return radialDirections[rot]
}
export const hexUtilsGetNeighborForRotation = (
  rotation: number,
): CubeCoordinate => {
  const rot = rotation % 6
  return HEX_DIRECTIONS[rot]
}

export function hexUtilsGetShipBuildableCoords(
  origin: CubeCoordinate,
  rotation: number,
): {
  forward: CubeCoordinate
  aft: CubeCoordinate
} {
  const normalizedRotation = ((rotation % 6) + 6) % 6
  const forwardDirection = hexUtilsGetNeighborForRotation(
    (normalizedRotation + 5) % 6,
  )
  const aftStepDirection = hexUtilsGetNeighborForRotation(normalizedRotation)
  const forward = hexUtilsAdd(origin, forwardDirection)
  const aft = hexUtilsAdd(forward, aftStepDirection)
  return { forward, aft }
}
export function sinDegrees(degrees: number) {
  const radians = degrees * (Math.PI / 180)
  return Math.sin(radians)
}
export function cosDegrees(degrees: number) {
  const radians = degrees * (Math.PI / 180)
  return Math.cos(radians)
}

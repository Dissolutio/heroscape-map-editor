import { type BoardHexes, type CubeCoordinate, HexTerrain } from '../types'
import { hexUtilsGenHexagonGrid, hexUtilsGenRectangleGrid } from './hex-utils'
import { genBoardHexID } from './map-utils'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from './constants'

export function makeRectangleMapEmptyHexes(
  length: number,
  width: number,
): BoardHexes {
  const l = Math.min(length ?? 15, MAX_RECTANGLE_MAP_DIMENSION)
  const w = Math.min(width ?? 15, MAX_RECTANGLE_MAP_DIMENSION)
  return hexesToEmptyBoardHexes(hexUtilsGenRectangleGrid(l, w))
}

export function makeHexagonMapEmptyHexes(size?: number) {
  const mapSize = Math.min(size ?? 12, MAX_HEXAGON_MAP_DIMENSION)
  return hexesToEmptyBoardHexes(hexUtilsGenHexagonGrid(mapSize))
}

function hexesToEmptyBoardHexes(hexgridHexes: CubeCoordinate[]): BoardHexes {
  return hexgridHexes.reduce(
    (prev: BoardHexes, curr: CubeCoordinate): BoardHexes => {
      const id = genBoardHexID({ ...curr, altitude: 0 })
      const boardHex = {
        ...curr,
        id,
        terrain: HexTerrain.empty,
        altitude: 0,
        pieceID: '',
        inventoryID: '',
        pieceRotation: 0,
        isCap: true,
      }
      return {
        // biome-ignore lint/performance/noAccumulatingSpread: <lazy>
        ...prev,
        [boardHex.id]: boardHex,
      }
    },
    {},
  )
}

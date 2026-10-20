import { type BoardHexes, type CubeCoordinate, HexTerrain } from '../types'
import { hexUtilsGenHexagonGrid, hexUtilsGenRectangleGrid } from './hex-utils'
import { genBoardHexID } from './map-utils'

export const generateHexagon = (
  mapSize: number,
  originQ = 0,
  originR = 0,
): BoardHexes => {
  const boardHexes = hexesToEmptyBoardHexes(
    hexUtilsGenHexagonGrid(mapSize, originQ, originR),
  )
  return boardHexes
}

export const generateRectangle = (
  mapWidth: number,
  mapHeight: number,
  originQ = 0,
  originR = 0,
): BoardHexes => {
  return hexesToEmptyBoardHexes(
    hexUtilsGenRectangleGrid(mapWidth, mapHeight, originQ, originR),
  )
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

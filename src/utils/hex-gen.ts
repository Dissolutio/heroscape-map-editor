import { type BoardHexes, type CubeCoordinate, HexTerrain } from '../types'
import { hexUtilsGenHexagonGrid, hexUtilsGenRectangleGrid } from './hex-utils'
import { genBoardHexID } from './map-utils'

export const generateHexagon = (mapSize: number): BoardHexes => {
  const boardHexes = hexesToEmptyBoardHexes(hexUtilsGenHexagonGrid(mapSize))
  return boardHexes
}

export const generateRectangle = (
  mapWidth: number,
  mapHeight: number,
): BoardHexes => {
  return hexesToEmptyBoardHexes(hexUtilsGenRectangleGrid(mapWidth, mapHeight))
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

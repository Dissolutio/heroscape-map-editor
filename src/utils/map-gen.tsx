import { BoardHexes, MapState } from "../types"
import { MAX_HEXAGON_MAP_DIMENSION, MAX_RECTANGLE_MAP_DIMENSION } from "./constants"
import { genRandomMapName } from "./genRandomMapName"
import { generateHexagon, generateRectangle } from "./hex-gen"

type RectangleScenarioOptions = {
    mapWidth?: number
    mapLength?: number
    mapName?: string
}

export const rectangleScenario = makeRectangleScenario({
    mapLength: 4,
    mapWidth: 4,
})
export function makeRectangleScenario(options?: RectangleScenarioOptions): MapState {
    const mapHeight = Math.min(options?.mapLength ?? 15, MAX_RECTANGLE_MAP_DIMENSION)
    const mapWidth = Math.min(options?.mapWidth ?? 15, MAX_RECTANGLE_MAP_DIMENSION)
    const hexMap = {
        id: generateTimestampID(),
        name: options?.mapName ?? genRandomMapName(),
        shape: 'rectangle',
        width: mapWidth,
        height: mapHeight,
    }

    const boardHexes: BoardHexes = generateRectangle(mapHeight, mapWidth)
    return {
        boardHexes,
        hexMap,
        boardPieces: {},
    }
}
type HexagonScenarioOptions = {
    size?: number
    mapName?: string
}
export const hexagonScenario = makeHexagonScenario({
    size: 15,
})
export function makeHexagonScenario(options?: HexagonScenarioOptions): MapState {
    const size = Math.min(options?.size ?? 12, MAX_HEXAGON_MAP_DIMENSION)
    const hexMap = {
        id: generateTimestampID(),
        name: options?.mapName ?? genRandomMapName(),
        shape: 'hexagon',
        width: size,
        height: size,
    }

    const boardHexes: BoardHexes = generateHexagon(size)
    return {
        boardHexes,
        hexMap,
        boardPieces: {},
    }
}

function generateTimestampID(): string {
    return new Date().getTime().toString()
}

import { Vector3 } from "three"
import { BoardHexes, CubeCoordinate } from "../types"
import { HEXGRID_HEX_APOTHEM, HEXGRID_HEX_HEIGHT, HEXGRID_HEX_RADIUS, HEXGRID_SPACING, HEXGRID_HEXCAP_HEIGHT } from "./constants"
import { cubeToPixel } from "./hex-utils"

type MapDimensions = {
    width: number
    height: number
    apex: number
}

export const getBoardHexesRectangularMapDimensions = (
    boardHexes: BoardHexes
): MapDimensions => {

    // Gets the top-most, bottom-most, left-most, and right-most hexes, then calculates the difference for the map width and height
    const qPlusSMax = Math.max(
        ...Object.keys(boardHexes).map(
            (hexID) => boardHexes[hexID].q + boardHexes[hexID].s
        )
    )
    const qPlusSMin = Math.min(
        ...Object.keys(boardHexes).map(
            (hexID) => boardHexes[hexID].q + boardHexes[hexID].s
        )
    )
    const sMinusQMax = Math.max(
        ...Object.keys(boardHexes).map(
            (hexID) => boardHexes[hexID].s - boardHexes[hexID].q
        )
    )
    const sMinusQMin = Math.min(
        ...Object.keys(boardHexes).map(
            (hexID) => boardHexes[hexID].s - boardHexes[hexID].q
        )
    )
    const hexHeight = qPlusSMax - qPlusSMin
    const height = (hexHeight * 1.5 + 2 * HEXGRID_HEX_RADIUS) * HEXGRID_SPACING
    const hexWidth = sMinusQMax - sMinusQMin
    const width =
        (hexWidth + 2) * HEXGRID_HEX_APOTHEM * HEXGRID_SPACING
    const apex = Math.max(...Object.values(boardHexes).map((hex) => hex.altitude)) * HEXGRID_HEX_HEIGHT
    return { height, width, apex }
}
export const getBoardHex3DCoords = (hex: CubeCoordinate & { altitude: number }) => {
    const altitude = hex?.altitude ?? 0
    const x = cubeToPixel(hex).x * HEXGRID_SPACING
    const y = altitude * HEXGRID_HEX_HEIGHT
    const z = cubeToPixel(hex).y * HEXGRID_SPACING
    const yBaseCap = y - HEXGRID_HEX_HEIGHT
    const yWithBase = yBaseCap + HEXGRID_HEXCAP_HEIGHT / 2
    const yBase = yBaseCap + HEXGRID_HEXCAP_HEIGHT / 2
    return {
        x,
        y,
        z,
        yBaseCap,
        yWithBase,
        yBase
    }
}
const halfASideLength = HEXGRID_HEX_RADIUS / 2
const threeQuarterSideLength = HEXGRID_HEX_RADIUS * 3 / 4
export const hexPointsFromCenter = {
    topRight: new Vector3(HEXGRID_HEX_APOTHEM, 0, (halfASideLength)), // top-right
    bottomRight: new Vector3(HEXGRID_HEX_APOTHEM, 0, -(halfASideLength)), // bottom-right
    bottom: new Vector3(0, 0, -HEXGRID_HEX_RADIUS), // bottom
    bottomLeft: new Vector3(-HEXGRID_HEX_APOTHEM, 0, -(halfASideLength)), // bottom-left
    topLeft: new Vector3(-HEXGRID_HEX_APOTHEM, 0, (halfASideLength)), // top-left
    top: new Vector3(0, 0, HEXGRID_HEX_RADIUS), // top
}
export const hexSidesFromCenter = {
    left: new Vector3(-HEXGRID_HEX_APOTHEM, 0, 0),
    topLeft: new Vector3(-HEXGRID_HEX_APOTHEM / 2, 0, -(threeQuarterSideLength)),
    topRight: new Vector3(HEXGRID_HEX_APOTHEM / 2, 0, -(threeQuarterSideLength)),
    right: new Vector3(HEXGRID_HEX_APOTHEM, 0, 0),
    bottomRight: new Vector3(HEXGRID_HEX_APOTHEM / 2, 0, threeQuarterSideLength),
    bottomLeft: new Vector3(-HEXGRID_HEX_APOTHEM / 2, 0, threeQuarterSideLength),
}
export function genPieceID(qraID: string, pieceID: string, rotation: number) {
    return `${qraID},${rotation},${pieceID}`
}
export function genBoardHexID(hex: CubeCoordinate & { altitude: number }) {
    /* Hex world global coords (q,r,altitude) => (x,y,z)
    1. In cube coords, "s" in (qrs) is redundant for cartesian (xy) calculation
    2. Only one hex can exist per global coordinate
    */
    return `${hex.altitude},${hex.q},${hex.r}`
}
import { Point } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'

export function getHexagonSvgPolygonPoints(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const leftX = 0
  const rightX = apothem * 2
  const topX = apothem
  const topY = 0
  const bottomY = 2 * radius
  const bottomSideY = 1.5 * radius
  const topSideY = 0.5 * radius
  const corners: Point[] = [
    { x: rightX, y: bottomSideY }, //  bottom-right
    { x: topX, y: bottomY }, // bottom
    { x: leftX, y: bottomSideY }, // bottom-left
    { x: leftX, y: topSideY }, // top-left
    { x: topX, y: topY }, // top
    { x: rightX, y: topSideY }, // top-right
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get2HexSvgPolygonPoints(hexRadius: number, borderWidth: number) {
  const apothem = (Math.sqrt(3) * hexRadius) / 2
  const hexWidth = 2 * apothem
  const hexHeight = 2 * hexRadius
  const leftX = 0
  const rightX = apothem * 2
  const topX = apothem
  const topY = 0
  const bottomY = topY + hexHeight
  const bottomSideY = 1.5 * hexRadius
  const topSideY = 0.5 * hexRadius


  const corners: Point[] = [
    /* 
    OUTER
     /\/\
    |    |
     \/\/
    */
    { x: topX, y: topY }, //  top of hex1
    { x: rightX, y: topSideY }, // top-right hex1
    { x: topX + hexWidth, y: topY }, //  top of hex2
    { x: rightX * 2, y: topSideY }, //  top-right of hex2
    { x: rightX * 2, y: bottomSideY }, //  bottom-right of hex2
    { x: topX + hexWidth, y: bottomY }, //  bottom of hex2
    { x: rightX, y: bottomSideY }, // bottom-right hex1
    { x: topX, y: bottomY }, // bottom hex1
    { x: leftX, y: bottomSideY }, // bottom-left hex1
    { x: leftX, y: topSideY }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')


  const radiusInner = hexRadius - borderWidth
  const apothemInner = (Math.sqrt(3) * hexRadius) / 2
  const cornersInner: Point[] = [
    /* 
    INNER
    /\/\
   |    |
    \/\/
    */
    { x: topX, y: topY + borderWidth }, //  top of hex1
    { x: rightX - borderWidth, y: borderWidth + radiusInner / 2 }, // top-right hex1
    { x: topX + hexWidth, y: topY }, //  top of hex2
    { x: rightX * 2, y: topSideY }, //  top-right of hex2
    { x: rightX * 2, y: bottomSideY }, //  bottom-right of hex2
    { x: topX + hexWidth, y: bottomY }, //  bottom of hex2
    { x: rightX, y: bottomSideY }, // bottom-right hex1
    { x: topX, y: bottomY }, // bottom hex1
    { x: leftX, y: bottomSideY }, // bottom-left hex1
    { x: leftX, y: topSideY }, // top-left hex1
  ]
  const hexWidthInner = 2 * apothem
  const hexHeightInner = 2 * hexRadius
  const pointsInner = cornersInner.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners, pointsInner, cornersInner }
}
export function get3HexSvgPolygonPoints(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem
  const hexHeight = 2 * radius
  const leftX = 0
  const rightX = apothem * 2
  const topX = apothem
  const topY = 0
  const bottomY = topY + hexHeight
  const bottomSideY = 1.5 * radius
  const topSideY = 0.5 * radius

  const corners: Point[] = [
    /* 
     /\/\
    |    |
     \  /
     |  |
      \/
    */
    { x: topX, y: topY }, //  top of hex1
    { x: rightX, y: topSideY }, // top-right hex1
    { x: topX + hexWidth, y: topY }, //  top of hex2
    { x: rightX * 2, y: topSideY }, //  top-right of hex2
    { x: rightX * 2, y: bottomSideY }, //  bottom-right of hex2
    { x: topX + hexWidth, y: bottomY }, //  bottom of hex2
    // { x: topX + hexWidth, y: bottomY }, //  top-right of hex3
    { x: topX + hexWidth, y: bottomY + SVG_HEX_RADIUS }, //  bottom-right of hex3
    { x: rightX, y: bottomY + 1.5 * SVG_HEX_RADIUS }, //  bottom of hex3
    { x: topX, y: bottomY + SVG_HEX_RADIUS }, //  bottom-left of hex3
    { x: topX, y: bottomY }, //  top-left of hex3
    { x: topX, y: bottomY }, //  bottom of hex1
    { x: leftX, y: bottomSideY }, //  bottom-left of hex1
    { x: leftX, y: topSideY }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
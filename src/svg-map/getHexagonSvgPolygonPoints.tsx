import { Point } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'

// export function getHexagonSvgPolygonPoints(
//   radius: number,
//   // angle: number, 0 makes flat top, pi/6 makes pointy top
// ) {
//   const corners: Point[] = []
//   const initialAngle = Math.PI / 6
//   for (let i = 0; i < 6; i++) {
//     const x = radius * Math.cos((2 * Math.PI * i) / 6 + initialAngle)
//     const y = radius * Math.sin((2 * Math.PI * i) / 6 + initialAngle)
//     const point = { x: SVG_HEX_APOTHEM + x, y: SVG_HEX_RADIUS + y }
//     // const point = { x: x, y: y }
//     corners.push(point)
//   }
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }

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
export function get2HexSvgPolygonPoints(radius: number) {
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
  return { points, corners }
}

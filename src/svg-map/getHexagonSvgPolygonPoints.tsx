import type { Point } from '../types'

// export function getHexagonSvgPolygonPoints(radius: number) {
//   const apothem = (Math.sqrt(3) * radius) / 2
//   const leftX = 0
//   const rightX = apothem * 2
//   const topX = apothem
//   const topY = 0
//   const bottomY = 2 * radius
//   const bottomSideY = 1.5 * radius
//   const topSideY = 0.5 * radius
//   const corners: Point[] = [
//     { x: rightX, y: bottomSideY }, //  bottom-right
//     { x: topX, y: bottomY }, // bottom
//     { x: leftX, y: bottomSideY }, // bottom-left
//     { x: leftX, y: topSideY }, // top-left
//     { x: topX, y: topY }, // top
//     { x: rightX, y: topSideY }, // top-right
//   ]
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }
// export function getHexagonSvgPolygonPointsAt00(radius: number) {
//   const apothem = (Math.sqrt(3) * radius) / 2
//   const leftX = -apothem
//   const rightX = apothem
//   const topX = 0
//   const topY = -radius
//   const bottomY = radius
//   const bottomSideY = 0.5 * radius
//   const topSideY = -0.5 * radius
//   const corners: Point[] = [
//     { x: topX, y: topY }, // top
//     { x: rightX, y: topSideY }, // top-right
//     { x: rightX, y: bottomSideY }, //  bottom-right
//     { x: topX, y: bottomY }, // bottom
//     { x: leftX, y: bottomSideY }, // bottom-left
//     { x: leftX, y: topSideY }, // top-left
//   ]
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }
export function getHexagonSvgPolygonPointsAt00(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  const topX = 0
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  // using pen and paper geometry, find your way around the multi-hex (TODO: this could be programmatic)
  const corners: Point[] = [
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right
    { x: rightXInner, y: bottomSideYInner }, //  bottom-right 
    { x: topX, y: bottomYInner }, // bottom
    { x: leftXInner, y: bottomSideYInner }, // bottom-left
    { x: leftXInner, y: topSideYInner }, // top-left
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get2HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  // using pen and paper geometry, find your way around the multi-hex (TODO: this could be programmatic)
  const corners: Point[] = [
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    // { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE (TODO: Adding this in between point makes the interior angles sharp and more resembles Virtualscape)

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: hexWidth, y: bottomYInner }, // bottom hex2
    { x: hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex2

    // { x: rightXOuter, y: bottomSideYOuter - halfBorder }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: rightXInner, y: bottomSideYInner }, // bottom-right hex1
    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get3HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
     /\/\
    |    |
     \  /
     |  |
      \/
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: hexWidth, y: bottomYInner }, // bottom hex2

    { x: rightXOuter + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3
    { x: rightXOuter + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: rightXOuter, y: 1.5 * radius + radiusInner }, // bottom hex3
    { x: rightXOuter - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex3
    { x: rightXOuter - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex3

    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get3HexStraightSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢
    1 2 3
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

    { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3 
    { x: 2 * hexWidth, y: topYInner }, //  top hex3
    { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3
    { x: 2 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex3
    { x: 2 * hexWidth, y: bottomYInner }, // bottom hex3
    { x: 2 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex3

    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: hexWidth, y: bottomYInner }, // bottom hex2
    { x: hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex2

    { x: rightXInner, y: bottomSideYInner }, // bottom-right hex1
    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get5HexStraightSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢ ⬢ ⬢
    1 2 3 4 5
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

    { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3
    { x: 2 * hexWidth, y: topYInner }, //  top hex3
    { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3

    { x: 3 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex4
    { x: 3 * hexWidth, y: topYInner }, //  top hex4
    { x: 3 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex4

    { x: 4 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex5
    { x: 4 * hexWidth, y: topYInner }, //  top hex5
    { x: 4 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex5
    { x: 4 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex5
    { x: 4 * hexWidth, y: bottomYInner }, // bottom hex5
    { x: 4 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex5

    { x: 3 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex4
    { x: 3 * hexWidth, y: bottomYInner }, // bottom hex4
    { x: 3 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex4

    { x: 2 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex3
    { x: 2 * hexWidth, y: bottomYInner }, // bottom hex3
    { x: 2 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex3

    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: hexWidth, y: bottomYInner }, // bottom hex2
    { x: hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex2

    { x: rightXInner, y: bottomSideYInner }, // bottom-right hex1
    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get4HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
     /\/\
    |    |
     \   \
     |    |
      \/\/
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2

    { x: 1.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex3
    { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex3

    { x: rightXOuter + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex4
    { x: rightXOuter, y: 1.5 * radius + radiusInner }, // bottom hex4
    { x: rightXOuter - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4
    { x: rightXOuter - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex4

    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get6HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢
   ⬢ ⬢ ⬢
    1 2 3
   6 5 4
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

    { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3 
    { x: 2 * hexWidth, y: topYInner }, //  top hex3
    { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3
    { x: 2 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex3
    { x: 2 * hexWidth, y: bottomYInner }, // bottom hex3

    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex4
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex4
    { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4

    { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex5
    { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex5
    { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex5

    { x: -0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex6
    { x: -0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex6
    { x: -0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6
    { x: -0.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: -0.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex6

    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getMarvel6HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
     /\/\
    |    |
     \   \/\/\
     |        |
      \/\/\/\/
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2

    { x: 1.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3

    { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex4
    { x: 2.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex4
    { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex4

    { x: 3.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex5
    { x: 3.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex5
    { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex5
    { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex5
    { x: 3.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex5
    { x: 3.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex5

    { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex4
    { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex4
    { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4

    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex3
    { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex3

    // { x: rightXOuter + apothemInner + halfBorder, y: radius + radiusInner }, // bottom-left hex3, bottom-right hex6 TWEENSIE

    { x: rightXOuter + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, //bottom-right hex6
    { x: rightXOuter, y: 1.5 * radius + radiusInner }, // bottom hex6
    { x: rightXOuter - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6
    { x: rightXOuter - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get7HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
     1 2
    6 ⬢ 3
     5 4  
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2

    { x: 1.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex3

    { x: hexWidth + apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-right hex4
    { x: hexWidth + apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex4
    { x: hexWidth, y: 3 * radius + radiusInner }, // bottom hex4
    { x: hexWidth - apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex4

    { x: apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex5
    { x: topX, y: 3 * radius + radiusInner }, // bottom hex5
    { x: -apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex5
    { x: -apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-left hex5

    { x: leftXOuter, y: 1.5 * radius + radiusInner }, // bottom hex6
    { x: leftXOuter - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6
    { x: leftXOuter - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: leftXOuter, y: 1.5 * radius - radiusInner }, // top hex6

    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get24HexSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 24-hex
     1 2
    17 ⬢ 3
     16 ⬢ 4
    15 ⬢ ⬢ 5  6
     14 ⬢ ⬢ ⬢  7
    13 12 11 10 9 8
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1


    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2
    { x: hexWidth + apothemInner, y: topSideYInner + radiusInner }, // bottom-right hex2

    { x: 1.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3

    { x: 2 * hexWidth, y: 3 * radius - radiusInner }, // top hex4
    { x: 2 * hexWidth + apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-right hex4
    { x: 2 * hexWidth + apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex4

    { x: 2.5 * hexWidth, y: 4.5 * radius - radiusInner }, // top hex5
    { x: 2.5 * hexWidth + apothemInner, y: 4.5 * radius - 0.5 * radiusInner }, // top-right hex5

    { x: 3.5 * hexWidth - apothemInner, y: 4.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: 3.5 * hexWidth, y: 4.5 * radius - radiusInner }, // top hex6
    { x: 3.5 * hexWidth + apothemInner, y: 4.5 * radius - 0.5 * radiusInner }, // top-right hex6
    { x: 3.5 * hexWidth + apothemInner, y: 4.5 * radius + 0.5 * radiusInner }, // bottom-right hex6

    { x: 4 * hexWidth, y: 6 * radius - radiusInner }, // top hex7
    { x: 4 * hexWidth + apothemInner, y: 6 * radius - 0.5 * radiusInner }, // top-right hex7
    { x: 4 * hexWidth + apothemInner, y: 6 * radius + 0.5 * radiusInner }, // bottom-right hex7

    { x: 4.5 * hexWidth, y: 7.5 * radius - radiusInner }, // top hex8
    { x: 4.5 * hexWidth + apothemInner, y: 7.5 * radius - 0.5 * radiusInner }, // top-right hex8
    // BEGIN STRAIGHT BOTTOM: 1,2,3...1,2,3... only X changes
    { x: 4.5 * hexWidth + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex8
    { x: 4.5 * hexWidth, y: 7.5 * radius + radiusInner }, // bottom hex8
    { x: 4.5 * hexWidth - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex8

    { x: 3.5 * hexWidth + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex9
    { x: 3.5 * hexWidth, y: 7.5 * radius + radiusInner }, // bottom hex9
    { x: 3.5 * hexWidth - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex9

    { x: 2.5 * hexWidth + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex10
    { x: 2.5 * hexWidth, y: 7.5 * radius + radiusInner }, // bottom hex10
    { x: 2.5 * hexWidth - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex10

    { x: 1.5 * hexWidth + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex11
    { x: 1.5 * hexWidth, y: 7.5 * radius + radiusInner }, // bottom hex11
    { x: 1.5 * hexWidth - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex11

    { x: rightXOuter + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex12
    { x: rightXOuter, y: 7.5 * radius + radiusInner }, // bottom hex12
    { x: rightXOuter - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex12

    { x: leftXOuter + apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-right hex13
    { x: leftXOuter, y: 7.5 * radius + radiusInner }, // bottom hex13
    { x: leftXOuter - apothemInner, y: 7.5 * radius + 0.5 * radiusInner }, // bottom-left hex13
    // END OF STRAIGHT BOTTOM

    { x: leftXOuter - apothemInner, y: 7.5 * radius - 0.5 * radiusInner }, // top-left hex13
    { x: leftXOuter, y: 7.5 * radius - radiusInner }, // top hex13

    { x: -apothemInner, y: 6 * radius + 0.5 * radiusInner }, // bottom-left hex14
    { x: -apothemInner, y: 6 * radius - 0.5 * radiusInner }, // top-left hex14

    { x: leftXOuter, y: 4.5 * radius + radiusInner }, // bottom hex15
    { x: leftXOuter - apothemInner, y: 4.5 * radius + 0.5 * radiusInner }, // bottom-left hex15
    { x: leftXOuter - apothemInner, y: 4.5 * radius - 0.5 * radiusInner }, // top-left hex15

    { x: -apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex16
    { x: -apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-left hex16

    { x: leftXOuter, y: 1.5 * radius + radiusInner }, // bottom hex17
    { x: leftXOuter - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex17
    { x: leftXOuter - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex17
    { x: leftXOuter, y: 1.5 * radius - radiusInner }, // top hex17

    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get7HexWallWalkSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢ ⬢
     ⬢ ⬢ ⬢
    1 2 3 4
   7 6 5 4
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

    { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3
    { x: 2 * hexWidth, y: topYInner }, //  top hex3
    { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3

    { x: 3 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex4
    { x: 3 * hexWidth, y: topYInner }, //  top hex4
    { x: 3 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex4
    { x: 3 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex4
    { x: 3 * hexWidth, y: bottomYInner }, // bottom hex4

    { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex5
    { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex5
    { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex5
    { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex5

    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex6
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex6
    { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6

    { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex7
    { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex7
    { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex7
    { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex7

    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get9HexWallWalkSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
  const topX = 0
  // Outer hexagon
  const topYOuter = -radius
  const leftXOuter = -apothem
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const hexWidthInner = 2 * apothemInner
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢ ⬢ ⬢
     ⬢ ⬢ ⬢ ⬢
    1 2 3 4 5
     9 8 7 6
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1

    { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2 
    { x: hexWidth, y: topYInner }, //  top hex2
    { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

    { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3
    { x: 2 * hexWidth, y: topYInner }, //  top hex3
    { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3

    { x: 3 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex4
    { x: 3 * hexWidth, y: topYInner }, //  top hex4
    { x: 3 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex4

    { x: 4 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex5
    { x: 4 * hexWidth, y: topYInner }, //  top hex5
    { x: 4 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex5
    { x: 4 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex5
    { x: 4 * hexWidth, y: bottomYInner }, // bottom hex5

    { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex6
    { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex6
    { x: 3.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex6
    { x: 3.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6

    { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex7
    { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex7
    { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex7

    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex8
    { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex8
    { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex8

    { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex9
    { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex9
    { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex9
    { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex9

    { x: topX, y: bottomYInner }, // bottom hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
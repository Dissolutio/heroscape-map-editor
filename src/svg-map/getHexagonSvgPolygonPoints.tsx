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
export function getHexagonSvgPolygonPointsAt00(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const leftX = -apothem
  const rightX = apothem
  const topX = 0
  const topY = -radius
  const bottomY = radius
  const bottomSideY = 0.5 * radius
  const topSideY = -0.5 * radius
  const corners: Point[] = [
    { x: topX, y: topY }, // top
    { x: rightX, y: topSideY }, // top-right
    { x: rightX, y: bottomSideY }, //  bottom-right
    { x: topX, y: bottomY }, // bottom
    { x: leftX, y: bottomSideY }, // bottom-left
    { x: leftX, y: topSideY }, // top-left
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
    { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE
    { x: rightXOuter + apothem, y: topYInner }, //  top hex2
    { x: rightXOuter + apothem + apothemInner, y: topSideYInner }, // top-right hex2
    { x: rightXOuter + apothem + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: rightXOuter + apothem, y: bottomYInner }, // bottom hex2
    { x: rightXOuter, y: bottomSideYOuter - halfBorder }, // bottom-left hex2, bottom-right hex1 TWEENSIE
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
    { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE
    { x: rightXOuter + apothem, y: topYInner }, //  top hex2
    { x: rightXOuter + apothem + apothemInner, y: topSideYInner }, // top-right hex2
    { x: rightXOuter + apothem + apothemInner, y: bottomSideYInner }, // bottom-right hex2
    { x: rightXOuter + apothem, y: bottomYInner }, // bottom hex2
    { x: rightXOuter + apothemInner, y: radius }, // top-right hex3
    { x: rightXOuter + apothemInner, y: radius + radiusInner }, // bottom-right hex3
    { x: rightXOuter, y: radius + 1.5 * radiusInner }, // bottom hex3
    { x: rightXOuter - apothemInner, y: radius + radiusInner }, // bottom-left hex3
    { x: rightXOuter - apothemInner, y: radius }, // top-left hex3
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
    { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE
    { x: rightXOuter + apothem, y: topYInner }, //  top hex2
    { x: rightXOuter + apothem + apothemInner, y: topSideYInner }, // top-right hex2
    {
      x: rightXOuter + apothem + apothemInner,
      y: bottomSideYInner + halfBorder,
    }, // bottom-right hex2, top hex3 TWEENSIE
    { x: rightXOuter + hexWidth + apothemInner, y: radius }, // top-right hex3
    { x: rightXOuter + hexWidth + apothemInner, y: radius + radiusInner }, // bottom-right hex3
    { x: rightXOuter + hexWidth, y: 2.5 * radius - halfBorder }, // bottom hex3
    { x: rightXOuter + apothemInner + halfBorder, y: radius + radiusInner }, // bottom-left hex3, bottom-right hex4 TWEENSIE
    { x: rightXOuter, y: radius + 1.5 * radiusInner }, // bottom hex4
    { x: rightXOuter - apothemInner, y: radius + radiusInner }, // bottom-left hex4
    { x: rightXOuter - apothemInner, y: radius }, // top-left hex4, bottom hex1 TWEENSIE
    { x: topX, y: bottomYInner }, // bottom hex1
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
    { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE
    { x: rightXOuter + apothem, y: topYInner }, //  top hex2
    { x: rightXOuter + apothem + apothemInner, y: topSideYInner }, // top-right hex2
    { x: rightXOuter + apothem + apothemInner, y: bottomSideYInner + halfBorder }, // bottom-right hex2, top hex3 TWEENSIE
    { x: rightXOuter + hexWidth + apothemInner, y: radius }, // top-right hex3
    { x: rightXOuter + 2 * hexWidth - apothemInner, y: radius }, // top-left hex4
    { x: rightXOuter + 2 * hexWidth, y: radius - 0.5 * radiusInner }, // top hex4
    { x: rightXOuter + 2 * hexWidth + apothemInner, y: radius }, // top-right hex4

    { x: rightXOuter + 3 * hexWidth - apothemInner, y: radius }, // top-left hex5
    { x: rightXOuter + 3 * hexWidth, y: radius - 0.5 * radiusInner }, // top hex5
    { x: rightXOuter + 3 * hexWidth + apothemInner, y: radius }, // top-right hex5

    { x: rightXOuter + 3 * hexWidth + apothemInner, y: radius + radiusInner }, // bottom-right hex5
    { x: rightXOuter + 3 * hexWidth, y: radius + 1.5 * radiusInner }, // bottom hex5
    { x: rightXOuter + 3 * hexWidth - apothemInner, y: radius + radiusInner }, // bottom-left hex5

    { x: rightXOuter + 2 * hexWidth + apothemInner, y: radius + radiusInner }, // bottom-right hex4
    { x: rightXOuter + 2 * hexWidth, y: radius + 1.5 * radiusInner }, // bottom hex4
    { x: rightXOuter + 2 * hexWidth - apothemInner, y: radius + radiusInner }, // bottom-left hex4
    // bottom-right hex4
    // bottom hex4
    // bottom-left hex4
    // bottom-right hex6
    // bottom hex6
    // bottom-left hex6
    // bottom-right hex7
    // bottom hex7
    // bottom-left hex7
    // top-left hex7
    // top hex7

    // bottom-left hex1

    { x: rightXOuter + hexWidth + apothemInner, y: radius + radiusInner }, // bottom-right hex3
    { x: rightXOuter + hexWidth, y: 2.5 * radius - halfBorder }, // bottom hex3
    { x: rightXOuter + apothemInner + halfBorder, y: radius + radiusInner }, // bottom-left hex3, bottom-right hex6 TWEENSIE
    { x: rightXOuter, y: radius + 1.5 * radiusInner }, // bottom hex6
    { x: rightXOuter - apothemInner, y: radius + radiusInner }, // bottom-left hex6
    { x: rightXOuter - apothemInner, y: radius }, // top-left hex6, bottom hex1 TWEENSIE
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
     /\  /\
    |      |
   /        \
   |        |
   |   7    |
   \       /
     \/ \/
    */
    { x: topX, y: topYInner }, // top hex1
    { x: rightXOuter, y: topSideYOuter + halfBorder }, // top-right hex1, top-left hex2 TWEENSIE
    { x: rightXOuter + apothem, y: topYInner }, //  top hex2
    { x: rightXOuter + apothem + apothemInner, y: topSideYInner }, // top-right hex2
    {
      x: rightXOuter + apothem + apothemInner,
      y: bottomSideYInner + halfBorder,
    }, // bottom-right hex2, top hex3 TWEENSIE
    { x: rightXOuter + hexWidth + apothemInner, y: radius }, // top-right hex3
    { x: rightXOuter + hexWidth + apothemInner, y: radius + radiusInner }, // bottom-right hex3
    { x: rightXOuter + hexWidth, y: 2.5 * radius - halfBorder }, // bottom hex3

    { x: hexWidth + apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-right hex4
    { x: hexWidth + apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex4
    { x: hexWidth, y: 3 * radius + radiusInner }, // bottom hex4
    { x: hexWidth - apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex4
    { x: apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex5
    { x: topX, y: 3 * radius + radiusInner }, // bottom hex5
    { x: -apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex5
    { x: -apothemInner, y: 3 * radius - 0.5 * radiusInner }, // top-left hex5
    { x: leftXOuter, y: 2.5 * radius }, // bottom hex6
    { x: leftXOuter - apothemInner, y: radius + radiusInner }, // bottom-left hex6
    { x: leftXOuter - apothemInner, y: radius }, // top-left hex6
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}

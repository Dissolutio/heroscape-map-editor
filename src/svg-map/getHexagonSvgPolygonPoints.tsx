import type { Point } from '../types'
import { cosDegrees, sinDegrees } from '../utils/hex-utils'

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
export function getRoadWallSvgPolygonPoints(
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
    /* 
     ______
    |      |
    \/\/\/\/

     */
    { x: leftXInner, y: bottomSideYInner - radius / 4 }, // top-left rectangle in hex1
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: topX, y: bottomYInner }, // bottom hex1
    { x: rightXInner, y: bottomSideYInner }, // bottom-right hex1

    { x: hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex2
    { x: hexWidth, y: bottomYInner }, // bottom hex2
    { x: hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex2

    { x: 2 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex3
    { x: 2 * hexWidth, y: bottomYInner }, // bottom hex3
    { x: 2 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex3

    { x: 3 * hexWidth - apothemInner, y: bottomSideYInner }, // bottom-left hex4
    { x: 3 * hexWidth, y: bottomYInner }, // bottom hex4
    { x: 3 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex4
    { x: 3 * hexWidth + apothemInner, y: bottomSideYInner - radius / 4 }, // top-right rectangle in hex4
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getBattlementSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = apothem * 2
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    { x: rightXInner, y: topSideYInner }, // top-right inner trapezoid
    { x: rightXInner - radiusInner / 4, y: topSideYInner + radiusInner / 8 }, // top-left inner trapezoid
    { x: rightXInner - radiusInner / 4, y: bottomSideYInner - radiusInner / 8 }, // bottom-left inner trapezoid
    { x: rightXInner, y: bottomSideYInner }, // bottom-right inner trapezoid
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getLadderSvgPolygonPoints(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = apothem * 2
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    { x: rightXInner, y: topSideYInner }, // top-right outer rectangle
    { x: rightXInner, y: bottomSideYInner }, // bottom-right outer rectangle
    { x: rightXInner - radiusInner / 2, y: bottomSideYInner }, // bottom-left outer rectangle
    { x: rightXInner - radiusInner / 2, y: topSideYInner }, // top-left outer rectangle
    { x: rightXInner, y: topSideYInner }, // top-right outer rectangle

    // Counter clockwise inner cutout
    { x: rightXInner, y: topSideYInner + 0.15 * radius }, // top-right outer handle
    { x: rightXInner - 0.4 * radius, y: topSideYInner + 0.15 * radius }, // top-left outer handle
    { x: rightXInner - 0.4 * radius, y: bottomSideYInner - 0.15 * radius }, // bottom-left outer handle
    { x: rightXInner, y: bottomSideYInner - 0.15 * radius }, // bottom-right outer handle

    { x: rightXInner, y: bottomSideYInner - 0.3 * radius }, // bottom-right inner handle
    { x: rightXInner - 0.3 * radius, y: bottomSideYInner - 0.3 * radius }, // bottom-left inner handle
    { x: rightXInner - 0.3 * radius, y: topSideYInner + 0.3 * radius }, // top-left inner handle
    { x: rightXInner, y: topSideYInner + 0.3 * radius }, // top-right inner handle
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getCastleCornerShapeSvgPolygonPoints(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = apothem * 2
  const topSideYOuter = -0.5 * radius
  const topYOuter = -radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.4 * radiusInner
  const sin30 = sinDegrees(30)
  const cos30 = cosDegrees(30)
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const x1_1 = -apothemInner + (wallInset * cos30)
  const y1_1 = topSideYInner - (wallInset * sin30)
  const x1_2 = -apothemInner + (wallInset * cos30)
  const y1_2 = bottomSideYInner + (wallInset * sin30)
  const x2_1 = 0 - (wallInset * cos30)
  const y2_1 = topYInner + (wallInset * sin30)
  const x2_2 = 0 - (wallInset * cos30)
  const y2_2 = bottomYInner - (wallInset * sin30)
  /*   
  2 shapes, the left side is smaller, concave, the little spoon, and the right side, the convex shape, the big spoon.
  d= distance inset of wall from hex boundary extremes

  _\\d\_
  \     \
  /     /
  \   _/
  /d//

   */
  const corners: Point[] = [

    { x: x1_1, y: y1_1 }, // top-left inset perimeter1-CCW
    { x: x1_1 + (wallLength * cos60), y: y1_1 + (wallLength * sin60) }, // inset perimeter1-CCW intrudes into hexagon
    { x: -apothemInner + borderWidth, y: 0 }, // midpoint left side
    { x: x1_2 + (wallLength * cos60), y: y1_2 - (wallLength * sin60) }, // inset perimeter2-CW intrudes into hexagon
    { x: x1_2, y: y1_2 }, // bottom-left inset perimeter2-CW
    // AROUND THE OUTSIDE FOR FILL:
    { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]

  const corners2: Point[] = [
    { x: x2_1, y: y2_1 }, // inset perimeter1-CW
    { x: x2_1 + (wallLength * cos60), y: y2_1 + (wallLength * sin60) }, // inset perimeter1-CW intrudes into hexagon
    { x: (apothemInner / 2) - (borderWidth * cos60), y: -3 / 4 * radiusInner + (borderWidth * sin60) }, // midpoint top-right side
    { x: (apothemInner) - borderWidth, y: 0 }, // midpoint right side
    { x: (apothemInner / 2) - (borderWidth * cos60), y: 3 / 4 * radiusInner - (borderWidth * sin60) }, // midpoint bottom-right side
    { x: x2_2 + (wallLength * cos60), y: y2_2 - (wallLength * sin60) }, // inset perimeter2-CCW intrudes into hexagon
    { x: x2_2, y: y2_2 }, // inset perimeter2-CCW

    // AROUND THE OUTSIDE FOR FILL:
    { x: 0, y: bottomYInner }, // bottom hex1
    { x: rightXInner, y: bottomSideYInner }, // bottom-right hex1
    { x: rightXInner, y: topSideYInner }, // top-right hex1
    { x: 0, y: topYInner }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  const points2 = corners2.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners, points2 }
}
export function getCastleStraightShapeSvgPolygonPoints(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = apothem * 2
  const topSideYOuter = -0.5 * radius
  const topYOuter = -radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.4 * radiusInner
  const sin30 = sinDegrees(30)
  const cos30 = cosDegrees(30)
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const x1_1 = -apothemInner
  const y1_1 = topSideYInner + wallInset
  const x1_2 = apothemInner
  const y1_2 = topSideYInner + wallInset
  /* 
  2 shapes, top and bottom:
  d= distance inset of wall from hex boundary extremes
        _
      _/ \_
    
  d|  _   _
   |   \_/  
  
  */
  const corners: Point[] = [
    { x: x1_1, y: y1_1 }, // left side inset perimeter1-CW
    { x: x1_1 + wallLength, y: y1_1 }, // left side inset perimeter1-CW intrudes into hexagon
    { x: -(apothemInner / 2) + (borderWidth * cos60), y: -3 / 4 * radiusInner + (borderWidth * sin60) }, // midpoint top-left side
    { x: (apothemInner / 2) - (borderWidth * cos60), y: -3 / 4 * radiusInner + (borderWidth * sin60) }, // midpoint top-right side
    { x: x1_2 - wallLength, y: y1_2 }, // right side inset perimeter2-CCW intrudes into hexagon
    { x: x1_2, y: y1_2 }, // right side inset perimeter2-CCW
    // AROUND THE OUTSIDE FOR FILL:
    { x: rightXInner, y: topSideYInner }, // top-right hex1
    { x: 0, y: topYInner }, // top hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const x2_1 = -apothemInner
  const y2_1 = topSideYInner + wallInset
  const x2_2 = apothemInner
  const y2_2 = topSideYInner + wallInset

  const corners2: Point[] = [
    { x: x1_1, y: y1_1 }, // left side inset perimeter1-CW
    { x: x1_1 + wallLength, y: y1_1 }, // left side inset perimeter1-CW intrudes into hexagon
    { x: -(apothemInner / 2) + (borderWidth * cos60), y: -3 / 4 * radiusInner + (borderWidth * sin60) }, // midpoint top-left side
    { x: (apothemInner / 2) - (borderWidth * cos60), y: -3 / 4 * radiusInner + (borderWidth * sin60) }, // midpoint top-right side
    { x: x1_2 - wallLength, y: y1_2 }, // right side inset perimeter2-CCW intrudes into hexagon
    { x: x1_2, y: y1_2 }, // right side inset perimeter2-CCW
    // AROUND THE OUTSIDE FOR FILL:
    { x: rightXInner, y: topSideYInner }, // top-right hex1
    { x: 0, y: topYInner }, // top hex1
    { x: leftXInner, y: topSideYInner }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  const points2 = corners2.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners, points2 }
}
export function getLaurShortWallSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  // Outer
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  const corners: Point[] = [
    // MORE FLUSH OPTIONS BUT LOOKS LIKE 2-HEX LAND
    // { x: rightXOuter - borderWidth, y: topSideYOuter + (borderWidth / Math.sqrt(2)) }, // top-left of rectangle
    // { x: apothem + borderWidth, y: topSideYOuter + (borderWidth / Math.sqrt(2)) }, // top-right of rectangle
    // { x: apothem + borderWidth, y: bottomSideYOuter - (borderWidth / Math.sqrt(2)) }, //  bottom-right of rectangle
    // { x: rightXOuter - borderWidth, y: bottomSideYOuter - (borderWidth / Math.sqrt(2)) }, // bottom-left of rectangle
    // THIS DOES NOT LOOK LIKE RENEGADE, BUT IS MORE LEGIBLE AND DIFFERENTIATED FROM 2-HEX LAND
    { x: rightXOuter - borderWidth, y: topSideYOuter + radius / 3 }, // top-left of rectangle
    { x: apothem + borderWidth, y: topSideYOuter + radius / 3 }, // top-right of rectangle
    { x: apothem + borderWidth, y: bottomSideYOuter - radius / 3 }, //  bottom-right of rectangle
    { x: rightXOuter - borderWidth, y: bottomSideYOuter - radius / 3 }, // bottom-left of rectangle
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getLaurLongWallSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  // Outer
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius

  const corners: Point[] = [
    { x: radius - (borderWidth || radius / 10), y: borderWidth || radius / 10 }, // top-left of rectangle
    {
      x:
        radius -
        (borderWidth || radius / 10) +
        radius +
        2 * (borderWidth || radius / 10),
      y: borderWidth || radius / 10,
    }, // top-right of rectangle
    {
      x:
        radius -
        (borderWidth || radius / 10) +
        radius +
        2 * (borderWidth || radius / 10),
      y: -(borderWidth || radius / 10),
    }, //  bottom-right of rectangle
    {
      x: radius - (borderWidth || radius / 10),
      y: -(borderWidth || radius / 10),
    }, // bottom-left of rectangle
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getLaurWallRuinSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem
  // Outer
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius
  // Inner hexagon
  const corners: Point[] = [
    { x: rightXOuter, y: topSideYOuter / 5 }, // top-left of rectangle
    { x: hexWidth - apothem / 2, y: topSideYOuter / 5 }, // top-right of rectangle
    { x: hexWidth - apothem / 2, y: bottomSideYOuter / 5 }, // bottom-right of rectangle
    { x: rightXOuter, y: bottomSideYOuter / 5 }, // bottom-left of rectangle
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getRuins2SvgPolygonPoints(radius: number, borderWidth: number) {
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
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    |    
     \/\/
    */
    { x: leftXOuter, y: topSideYInner }, // top-left hex1
    { x: leftXOuter, y: bottomSideYOuter }, // bottom-left hex1
    { x: 0, y: radius }, //  bottom hex1
    { x: rightXOuter, y: bottomSideYOuter }, //  bottom-right hex1

    { x: hexWidth, y: radius }, //  bottom hex2
    { x: hexWidth + apothem, y: bottomSideYOuter }, //  bottom-right hex2
  ]
  const path = `M ${corners[0].x},${corners[0].y} 
  L ${corners[1].x},${corners[1].y}
  L ${corners[2].x},${corners[2].y}
  L ${corners[3].x},${corners[3].y}
  L ${corners[4].x},${corners[4].y}
  L ${corners[5].x},${corners[5].y}
  `
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners, path }
}
export function getRuins3SvgPolygonPoints(radius: number, borderWidth: number) {
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
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    /* 
    |    
     \/\/
    */
    { x: leftXOuter, y: topSideYInner }, // top-left hex1
    { x: leftXOuter, y: bottomSideYOuter }, // bottom-left hex1
    { x: 0, y: radius }, //  bottom hex1
    { x: rightXOuter, y: bottomSideYOuter }, //  bottom-right hex1

    { x: hexWidth, y: radius }, //  bottom hex2
    { x: hexWidth + apothem, y: bottomSideYOuter }, //  bottom-right hex2
    { x: 2 * hexWidth, y: radius }, //  bottom hex3
    { x: 2 * hexWidth + apothem, y: bottomSideYOuter }, //  bottom-right hex3
  ]
  const path = `M ${corners[0].x},${corners[0].y} 
  L ${corners[1].x},${corners[1].y}
  L ${corners[2].x},${corners[2].y}
  L ${corners[3].x},${corners[3].y}
  L ${corners[4].x},${corners[4].y}
  L ${corners[5].x},${corners[5].y}
  L ${corners[6].x},${corners[6].y}
  L ${corners[7].x},${corners[7].y}
  `
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners, path }
}
export function getHexagonSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
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

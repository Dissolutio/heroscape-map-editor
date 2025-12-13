import type { Point } from '../types'
import { SVG_BORDER_WIDTH } from '../utils/constants'
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
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const bottomYInner = radiusInner
  const bottomSideYInner = 0.5 * radiusInner

  // using pen and paper geometry, find your way around the multi-hex (TODO: DRY: this could be programmatic)
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
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
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
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
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
export function getCastleArchShapeSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem
  const bottomSideYOuter = 0.5 * radius
  const bottomYOuter = radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.3 * radiusInner
  const sin30 = sinDegrees(30)
  const cos30 = cosDegrees(30)
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const insetAtMidpoints = borderWidth
  const x1_1 = 0 - wallInset * cos30
  const y1_1 = bottomYOuter - wallInset * sin30
  const x1_2 = -apothem + wallInset * cos30
  const y1_2 = bottomSideYOuter + wallInset * sin30
  const x2_1 = 2 * hexWidth + wallInset * cos30
  const y2_1 = y1_1
  const x2_2 = 2 * hexWidth + apothem - wallInset * cos30
  const y2_2 = y1_2

  /*   
  2 shapes, the left side is smaller, concave, the little spoon, and the right side, the convex shape, the big spoon.
  d= distance inset of wall from hex boundary extremes

  /^\____/^\
 |   ____   |
  \ /    \ /
  //      \\

   */
  const corners: Point[] = [
    {
      x: apothem / 2 - insetAtMidpoints * cos60,
      y: (3 / 4) * radius - insetAtMidpoints * sin60,
    }, // midpoint bottom-right side

    { x: x1_1 + wallLength * cos60, y: y1_1 - wallLength * sin60 }, // inset perimeter1-CCW intrudes into hexagon
    { x: x1_1, y: y1_1 }, // inset perimeter1-CCW

    { x: x1_2, y: y1_2 }, // bottom-left inset perimeter1-CW
    { x: x1_2 + wallLength * cos60, y: y1_2 - wallLength * sin60 }, // inset perimeter1-CW intrudes into hexagon

    { x: -apothem + insetAtMidpoints, y: 0 }, // midpoint left side
    {
      x: -(apothem / 2) + borderWidth * cos60,
      y: (-3 / 4) * radius + 1.15 * borderWidth,
    }, // midpoint top-left side

    {
      x: 2 * hexWidth + apothem / 2 - insetAtMidpoints * cos60,
      y: (-3 / 4) * radius + 1.15 * borderWidth,
    }, // midpoint top-right side far-hex
    { x: 2 * hexWidth + apothem - insetAtMidpoints, y: 0 }, // midpoint right side far-hex

    { x: x2_2 - wallLength * cos60, y: y2_2 - wallLength * sin60 }, // inset perimeter2-CW intrudes into hexagon
    { x: x2_2, y: y2_2 }, // bottom-left inset perimeter2-CW

    { x: x2_1, y: y2_1 }, // inset perimeter2-CCW
    { x: x2_1 - wallLength * cos60, y: y2_1 - wallLength * sin60 }, // inset perimeter2-CW intrudes into hexagon

    {
      x: 2 * hexWidth - apothem / 2 + borderWidth * cos60,
      y: (3 / 4) * radius - borderWidth * sin60,
    }, // midpoint bottom-left side far-hex
  ]

  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getCastleCornerShapeSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const topSideYOuter = -0.5 * radius
  const topYOuter = -radius
  const bottomSideYOuter = 0.5 * radius
  const bottomYOuter = radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.3 * radiusInner
  const sin30 = sinDegrees(30)
  const cos30 = cosDegrees(30)
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const insetAtMidpoints = borderWidth
  // The inset points for little spoon top to bottom and then big spoon top to bottom
  const x1_1 = -apothem + wallInset * cos30
  const y1_1 = topSideYOuter - wallInset * sin30
  const x1_2 = -apothem + wallInset * cos30
  const y1_2 = bottomSideYOuter + wallInset * sin30
  const x2_1 = 0 - wallInset * cos30
  const y2_1 = topYOuter + wallInset * sin30
  const x2_2 = 0 - wallInset * cos30
  const y2_2 = bottomYOuter - wallInset * sin30

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
    { x: -apothem + insetAtMidpoints, y: 0 }, // midpoint left side
    { x: x1_1 + wallLength * cos60, y: y1_1 + wallLength * sin60 }, // inset perimeter1-CCW intrudes into hexagon
    { x: x1_1, y: y1_1 }, // top-left inset perimeter1-CCW
    { x: x2_1, y: y2_1 }, // inset perimeter1-CW
    { x: x2_1 + wallLength * cos60, y: y2_1 + wallLength * sin60 }, // inset perimeter1-CW intrudes into hexagon

    {
      x: apothem / 2 - insetAtMidpoints * cos60,
      y: (-3 / 4) * radius + insetAtMidpoints * sin60,
    }, // midpoint top-right side
    { x: apothem - insetAtMidpoints, y: 0 }, // midpoint right side
    {
      x: apothem / 2 - insetAtMidpoints * cos60,
      y: (3 / 4) * radius - insetAtMidpoints * sin60,
    }, // midpoint bottom-right side

    { x: x2_2 + wallLength * cos60, y: y2_2 - wallLength * sin60 }, // inset perimeter2-CCW intrudes into hexagon
    { x: x2_2, y: y2_2 }, // inset perimeter2-CCW
    { x: x1_2, y: y1_2 }, // bottom-left inset perimeter2-CW
    { x: x1_2 + wallLength * cos60, y: y1_2 - wallLength * sin60 }, // inset perimeter2-CW intrudes into hexagon
  ]

  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getCastleEndShapeSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const insetAtMidpoints = borderWidth
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.3 * radiusInner
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const x1 = -apothem
  const y1 = topSideYOuter + wallInset
  const x2 = -apothem
  const y2 = bottomSideYOuter - wallInset
  /* 
  2 shapes, top and bottom:
  d= distance inset of wall from hex boundary extremes
        _
      _/ \
  d|  _   |
   |   \_/  
  
  */
  const corners: Point[] = [
    { x: x1, y: y1 }, // left side inset perimeter1-CW
    { x: x1 + wallLength, y: y1 }, // left side inset perimeter1-CW intrudes into hexagon

    {
      x: -(apothem / 2) + borderWidth * cos60,
      y: (-3 / 4) * radius + borderWidth * sin60,
    }, // midpoint top-left side
    {
      x: apothem / 2 - borderWidth * cos60,
      y: (-3 / 4) * radius + borderWidth * sin60,
    }, // midpoint top-right side
    { x: apothem - insetAtMidpoints, y: 0 }, // midpoint right side
    {
      x: apothem / 2 - borderWidth * cos60,
      y: (3 / 4) * radius - borderWidth * sin60,
    }, // midpoint bottom-right side
    {
      x: -(apothem / 2) + borderWidth * cos60,
      y: (3 / 4) * radius - borderWidth * sin60,
    }, // midpoint bottom-left side

    { x: x2 + wallLength, y: y2 }, // right side inset perimeter2-CW intrudes into hexagon
    { x: x2, y: y2 }, // left side inset perimeter1-CW intrudes into hexagon
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getCastleStraightShapeSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const halfBorder = borderWidth / 2
  const apothem = (Math.sqrt(3) * radius) / 2
  const topSideYOuter = -0.5 * radius
  const bottomSideYOuter = 0.5 * radius
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const insetAtMidpoints = borderWidth
  const wallInset = 0.2 * radiusInner
  const wallLength = 0.3 * radiusInner
  const sin60 = sinDegrees(60)
  const cos60 = cosDegrees(60)
  const x1_1 = -apothem
  const y1_1 = topSideYOuter + wallInset
  const x1_2 = apothem
  const y1_2 = topSideYOuter + wallInset
  const x2_1 = -apothem
  const y2_1 = bottomSideYOuter - wallInset
  const x2_2 = apothem
  const y2_2 = bottomSideYOuter - wallInset
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

    {
      x: -(apothem / 2) + insetAtMidpoints * cos60,
      y: (-3 / 4) * radius + insetAtMidpoints * sin60,
    }, // midpoint top-left side
    {
      x: apothem / 2 - insetAtMidpoints * cos60,
      y: (-3 / 4) * radius + insetAtMidpoints * sin60,
    }, // midpoint top-right side

    { x: x1_2 - wallLength, y: y1_2 }, // right side inset perimeter2-CCW intrudes into hexagon
    { x: x1_2, y: y1_2 }, // right side inset perimeter2-CCW

    { x: x2_2, y: y2_2 }, // right side inset perimeter2-CW
    { x: x2_2 - wallLength, y: y2_2 }, // right side inset perimeter2-CW intrudes into hexagon

    {
      x: apothem / 2 - insetAtMidpoints * cos60,
      y: (3 / 4) * radius - insetAtMidpoints * sin60,
    }, // midpoint bottom-right side
    {
      x: -(apothem / 2) + insetAtMidpoints * cos60,
      y: (3 / 4) * radius - insetAtMidpoints * sin60,
    }, // midpoint bottom-left side

    { x: x2_1 + wallLength, y: y2_1 }, // right side inset perimeter2-CW intrudes into hexagon
    { x: x2_1, y: y2_1 }, // left side inset perimeter1-CW intrudes into hexagon
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
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
  // borderWidth: number,
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
  // Outer hexagon
  const leftXOuter = -apothem
  const rightXOuter = apothem
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
  // Outer hexagon
  const leftXOuter = -apothem
  const rightXOuter = apothem
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
export function getMarvelRuinsShapeSvgPath(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem
  // Outer hexagon
  const rightXOuter = apothem
  const topSideYOuter = -0.5 * radius

  const corners: Point[] = [
    /* 
    
    |____

    */
    { x: -hexWidth + rightXOuter, y: topSideYOuter }, // top-right hex1

    { x: -hexWidth + apothem, y: 1.5 * radius }, // center hex3

    { x: 6 * apothem, y: 1.5 * radius }, // right side hex6
  ]
  const path = `M ${corners[0].x},${corners[0].y} 
  L ${corners[1].x},${corners[1].y}
  L ${corners[2].x},${corners[2].y}
  `
  return { path }
}
export function getLaurPillarShape(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const bottomSideYInner = 0.5 * radiusInner
  const topSideYInner = -0.5 * radiusInner

  const inset = 0.5 * radiusInner // the current laur pillar is definitely about 1/2 radius square
  const cos30 = cosDegrees(30)
  const cos60 = cosDegrees(60)
  const sin60 = sinDegrees(60)
  const corners: Point[] = [
    { x: -inset * cos30, y: topSideYInner }, // top-left
    { x: inset * cos30, y: topSideYInner }, // top-right
    { x: inset * cos30, y: bottomSideYInner }, // bottom-right
    { x: -inset * cos30, y: bottomSideYInner }, // bottom-left
  ]
  const triangle: Point[] = [
    // { x: -inset * cos30, y: -inset * sin30 }, // top-left
    // { x: inset * cos30, y: -inset * sin30 }, // top-right
    // { x: 0, y: inset }, // bottom
    { x: inset * cos60, y: -inset * sin60 }, // top-right
    { x: inset * cos60, y: inset * sin60 }, // bottom-right
    { x: -inset, y: 0 }, // mid-left
  ]
  const squarePoints = corners.map((point) => `${point.x},${point.y}`).join(' ')
  const trianglePoints = triangle
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  return {
    squarePoints,
    trianglePoints: trianglePoints,
  }
}
export function getJungleTriangleShape(radius: number, borderWidth: number) {
  const halfBorder = borderWidth / 2
  // Inner hexagon
  const radiusInner = radius - halfBorder
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  const rightXInner = apothemInner
  const leftXInner = -apothemInner
  const topYInner = -radiusInner
  const topSideYInner = -0.5 * radiusInner

  const corners: Point[] = [
    { x: 0, y: topYInner }, // top
    { x: rightXInner, y: topSideYInner }, // top-right
    { x: leftXInner, y: topSideYInner }, // top-left
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return {
    points,
  }
}
export function getHexagonSvgPolygonPointsAt00(radius: number) {
  // Outer hexagon
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    { x: 0, y: -radius }, // top hex1
    { x: apothem, y: -0.5 * radius }, // top-right
    { x: apothem, y: 0.5 * radius }, //  bottom-right
    { x: 0, y: radius }, // bottom
    { x: -apothem, y: 0.5 * radius }, // bottom-left
    { x: -apothem, y: -0.5 * radius }, // top-left
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function getInnerHexagonSvgPolygonPoints(radius: number) {
  const radiusInner = radius - SVG_BORDER_WIDTH
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    { x: 0, y: -radiusInner }, // top hex1
    { x: apothemInner, y: -0.5 * radiusInner }, // top-right
    { x: apothemInner, y: 0.5 * radiusInner }, //  bottom-right
    { x: 0, y: radiusInner }, // bottom
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get1HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  // Outer hexagon
  const apothem = (Math.sqrt(3) * radius) / 2

  // Inner hexagon
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  // using pen and paper geometry, find your way around the multi-hex (TODO: DRY: this could be programmatic)
  const corners: Point[] = [
    // OUTER
    { x: 0, y: -radius }, // top hex1
    { x: apothem, y: -0.5 * radius }, // top-right
    { x: apothem, y: 0.5 * radius }, //  bottom-right
    { x: 0, y: radius }, // bottom
    { x: -apothem, y: 0.5 * radius }, // bottom-left
    { x: -apothem, y: -0.5 * radius }, // top-left
    // MID
    { x: 0, y: -radius }, // top hex1
    // INNER
    { x: 0, y: -radiusInner }, // top hex1
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left
    { x: 0, y: radiusInner }, // bottom
    { x: apothemInner, y: 0.5 * radiusInner }, //  bottom-right
    { x: apothemInner, y: -0.5 * radiusInner }, // top-right
    // END
    { x: 0, y: -radiusInner }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get2HexSvgPolygonPointsAt00(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 2 * apothem + apothem, y: -0.5 * radius }, // top-right hex2
    { x: 2 * apothem + apothem, y: 0.5 * radius }, // bottom-right hex2
    { x: 2 * apothem, y: radius }, // bottom hex2

    { x: apothem, y: 0.5 * radius }, // bottom-left hex2, bottom-right hex1

    { x: 0, y: radius }, // bottom hex1
    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get2HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2
  // using pen and paper geometry, find your way around the multi-hex (TODO: DRY: this could be programmatic)
  const corners: Point[] = [
    // OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 2 * apothem + apothem, y: -0.5 * radius }, // top-right hex2
    { x: 2 * apothem + apothem, y: 0.5 * radius }, // bottom-right hex2
    { x: 2 * apothem, y: radius }, // bottom hex2

    { x: apothem, y: 0.5 * radius }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: 0, y: radius }, // bottom hex1
    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
    //MID
    { x: 0, y: -radius }, // top hex1
    // INNER
    { x: 0, y: -radiusInner }, // top hex1

    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left hex1
    { x: 0, y: radiusInner }, // bottom hex1

    { x: apothem, y: 0.5 * radius - borderWidth }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: 2 * apothem, y: radiusInner }, // bottom hex2
    { x: 2 * apothem + apothemInner, y: 0.5 * radiusInner }, // bottom-right hex2
    { x: 2 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex2
    { x: 2 * apothem, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE
    // END
    { x: 0, y: -radiusInner }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get3HexSvgPolygonPointsAt00(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    /* 
     /\/\
    |1  2|
     \  /
     | 3|
      \/
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 2 * apothem + apothem, y: -0.5 * radius }, // top-right hex2
    { x: 2 * apothem + apothem, y: 0.5 * radius }, // bottom-right hex2

    {
      x: apothem + apothem,
      y: 1.5 * radius - 0.5 * radius,
    }, // bottom hex2, top-right hex3 TWEENSIE

    { x: apothem + apothem, y: 1.5 * radius + 0.5 * radius }, // bottom-right hex3
    { x: apothem, y: 1.5 * radius + radius }, // bottom hex3
    { x: apothem - apothem, y: 1.5 * radius + 0.5 * radius }, // bottom-left hex3

    {
      x: apothem - apothem,
      y: 1.5 * radius - 0.5 * radius,
    }, // top-left hex3, bottom hex1 TWEENSIE

    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get3HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
     /\/\
    |1  2|
     \  /
     | 3|
      \/
    */
    // OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2
    { x: 3 * apothem, y: 0.5 * radius }, // bottom-right hex2

    { x: 2 * apothem, y: radius }, // bottom hex2, top-right hex3

    { x: 2 * apothem, y: 2 * radius }, // bottom-right hex3
    { x: apothem, y: 2.5 * radius }, // bottom hex3
    { x: 0, y: 2 * radius }, // bottom-left hex3

    { x: 0, y: radius }, // top-left hex3, bottom hex1

    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
    // MID
    { x: 0, y: -radius }, // top hex1
    // INNER
    { x: 0, y: -radius + borderWidth }, // top hex1

    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left hex1

    { x: apothem - apothemInner, y: radius - 0.5 * borderWidth }, // bottom hex1, top-left hex3 TWEENSIE

    { x: apothem - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex3
    { x: apothem, y: 2.5 * radius - borderWidth }, // bottom hex3
    { x: apothem + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3

    { x: apothem + apothemInner, y: radius - 0.5 * borderWidth }, // bottom hex2, top-right hex3 TWEENSIE

    { x: 2 * apothem + apothemInner, y: 0.5 * radiusInner }, // bottom-right hex2
    { x: 2 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex2
    { x: 2 * apothem, y: -radius + borderWidth }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE
    // END
    { x: 0, y: -radius + borderWidth }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get3HexStraightSvgPolygonPointsAt00(
  radius: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2

  // Outer hexagon
  // Inner hexagon

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢
    1 2 3
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 2 * apothem + apothem, y: -0.5 * radius }, // top-right hex2

    { x: 4 * apothem - apothem, y: -0.5 * radius }, // top-left hex3
    { x: 4 * apothem, y: -radius }, //  top hex3
    { x: 5 * apothem, y: -0.5 * radius }, // top-right hex3
    { x: 5 * apothem, y: 0.5 * radius }, // bottom-right hex3
    { x: 4 * apothem, y: radius }, // bottom hex3

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-left hex3, bottom-right hex2 TWEENSIE

    { x: 2 * apothem, y: radius }, // bottom hex2

    { x: apothem, y: 0.5 * radius }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: 0, y: radius }, // bottom hex1
    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get5HexStraightSvgPolygonPointsAt00(
  radius: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢ ⬢ ⬢
    1 2 3 4 5
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: 2 * apothem, y: -radius }, //  top hex2

    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2, top-left hex3

    { x: 4 * apothem, y: -radius }, //  top hex3

    { x: 5 * apothem, y: -0.5 * radius }, // top-right hex3, top-left hex4

    { x: 6 * apothem, y: -radius }, //  top hex4

    { x: 7 * apothem, y: -0.5 * radius }, // top-right hex4, top-left hex5

    { x: 8 * apothem, y: -radius }, //  top hex5
    { x: 9 * apothem, y: -0.5 * radius }, // top-right hex5
    { x: 9 * apothem, y: 0.5 * radius }, // bottom-right hex5
    { x: 8 * apothem, y: radius }, // bottom hex5

    { x: 7 * apothem, y: 0.5 * radius }, // bottom-left hex5, bottom-right hex4

    { x: 6 * apothem, y: radius }, // bottom hex4

    { x: 5 * apothem, y: 0.5 * radius }, // bottom-left hex4, bottom-right hex3

    { x: 4 * apothem, y: radius }, // bottom hex3

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-left hex3, bottom-right hex2

    { x: 2 * apothem, y: radius }, // bottom hex2

    { x: apothem, y: 0.5 * radius }, // bottom-left hex2, bottom-right hex1

    { x: 0, y: radius }, // bottom hex1
    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get5HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢ ⬢ ⬢
    1 2 3 4 5
    */
    // OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2

    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2, top-left hex3 TWEENSIE

    { x: 4 * apothem, y: -radius }, //  top hex3

    { x: 5 * apothem, y: -0.5 * radius }, // top-right hex3, top-left hex4 TWEENSIE

    { x: 6 * apothem, y: -radius }, //  top hex4

    { x: 7 * apothem, y: -0.5 * radius }, // top-right hex4, top-left hex5 TWEENSIE

    { x: 8 * apothem, y: -radius }, //  top hex5
    { x: 9 * apothem, y: -0.5 * radius }, // top-right hex5
    { x: 9 * apothem, y: 0.5 * radius }, // bottom-right hex5
    { x: 8 * apothem, y: radius }, // bottom hex5

    { x: 7 * apothem, y: 0.5 * radius }, // bottom-left hex5, bottom-right hex4 TWEENSIE

    { x: 6 * apothem, y: radius }, // bottom hex4

    { x: 5 * apothem, y: 0.5 * radius }, // bottom-left hex4, bottom-right hex3 TWEENSIE

    { x: 4 * apothem, y: radius }, // bottom hex3

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-left hex3, bottom-right hex2 TWEENSIE

    { x: 2 * apothem, y: radius }, // bottom hex2

    { x: apothem, y: 0.5 * radius }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: 0, y: radius }, // bottom hex1
    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
    // MID
    { x: 0, y: -radius }, // top hex1
    { x: 0, y: -radius + borderWidth }, // top hex1
    // INNER
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left hex1
    { x: 0, y: radiusInner }, // bottom hex1

    { x: apothem, y: 0.5 * radius - borderWidth }, // bottom-left hex2, bottom-right hex1 TWEENSIE

    { x: 2 * apothem, y: radiusInner }, // bottom hex2

    { x: 3 * apothem, y: 0.5 * radius - borderWidth }, // bottom-left hex3, bottom-right hex2 TWEENSIE

    { x: 4 * apothem, y: radiusInner }, // bottom hex3

    { x: 5 * apothem, y: 0.5 * radius - borderWidth }, // bottom-left hex4, bottom-right hex3 TWEENSIE

    { x: 6 * apothem, y: radiusInner }, // bottom hex4

    { x: 7 * apothem, y: 0.5 * radius - borderWidth }, // bottom-left hex5, bottom-right hex4 TWEENSIE

    { x: 8 * apothem, y: radiusInner }, // bottom hex5
    { x: 8 * apothem + apothemInner, y: 0.5 * radiusInner }, // bottom-right hex5
    { x: 8 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex5
    { x: 8 * apothem, y: -radiusInner }, //  top hex5

    { x: 7 * apothem, y: -0.5 * radius + borderWidth }, // top-right hex4, top-left hex5 TWEENSIE

    { x: 6 * apothem, y: -radiusInner }, //  top hex4

    { x: 5 * apothem, y: -0.5 * radius + borderWidth }, // top-right hex3, top-left hex4 TWEENSIE

    { x: 4 * apothem, y: -radiusInner }, //  top hex3

    { x: 3 * apothem, y: -0.5 * radius + borderWidth }, // top-right hex2, top-left hex3 TWEENSIE

    { x: 2 * apothem, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE

    // END
    { x: 0, y: -radius + borderWidth }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get4HexSvgPolygonPointsAt00(
  radius: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    /* 
    /\/\
    |    |
     \   \
     |    |
      \/\/
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-right hex2, top hex3

    { x: 4 * apothem, y: radius }, // top-right hex3
    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex3
    { x: 3 * apothem, y: 1.5 * radius + radius }, // bottom hex3

    { x: 2 * apothem, y: 2 * radius }, // bottom-left hex3, bottom-right hex4

    { x: apothem, y: 2.5 * radius }, // bottom hex4
    { x: 0, y: 2 * radius }, // bottom-left hex4

    { x: 0, y: radius }, // top-left hex4, bottom hex1

    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get4HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const radiusInner = radius - SVG_BORDER_WIDTH
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
    /\/\
    |    |
     \   \
     |    |
      \/\/
    */
    //  OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-right hex2, top hex3 TWEENSIE

    { x: 4 * apothem, y: radius }, // top-right hex3
    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex3
    { x: 3 * apothem, y: 1.5 * radius + radius }, // bottom hex3

    { x: 2 * apothem, y: 2 * radius }, // bottom-left hex3, bottom-right hex4 TWEENSIE

    { x: apothem, y: 2.5 * radius }, // bottom hex4
    { x: 0, y: 2 * radius }, // bottom-left hex4

    { x: 0, y: radius }, // top-left hex4, bottom hex1 TWEENSIE

    { x: -apothem, y: 0.5 * radius }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
    // MID
    { x: 0, y: -radius }, // top hex1
    { x: 0, y: -radius + borderWidth }, // top hex1
    // INNER
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1
    { x: -apothemInner, y: 0.5 * radiusInner }, // bottom-left hex1

    { x: apothem - apothemInner, y: 1.5 * radius - 0.5 * radiusInner - borderWidth }, // top-left hex4, bottom hex1 TWEENSIE

    { x: apothem - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4
    { x: apothem, y: 1.5 * radius + radiusInner }, // bottom hex4

    { x: 2 * apothem, y: 2 * radius - borderWidth }, // bottom-left hex3, bottom-right hex4 TWEENSIE

    { x: 3 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex3
    { x: 3 * apothem + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: 3 * apothem + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3

    { x: 2 * apothem + apothemInner, y: 0.5 * radiusInner + borderWidth }, // bottom-right hex2, top hex3 TWEENSIE

    { x: 2 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex2
    { x: 2 * apothem, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE
    // END
    { x: 0, y: -radius + borderWidth }, // top hex1
    { x: 0, y: -radius }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get6HexSvgPolygonPointsAt00(
  radius: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢
   ⬢ ⬢ ⬢
    1 2 3
   6 5 4
    */
    { x: 0, y: -radius }, // top hex1
    { x: apothem, y: -0.5 * radius }, // top-right hex1
    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 4 * apothem, y: -radius }, //  top hex3
    { x: 5 * apothem, y: -0.5 * radius }, // top-right hex3
    { x: 5 * apothem, y: 0.5 * radius }, // bottom-right hex3
    { x: 4 * apothem, y: radius }, // bottom hex3

    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex4
    { x: 3 * apothem, y: 2.5 * radius }, // bottom hex4
    { x: 2 * apothem, y: 2 * radius }, // bottom-left hex4

    { x: apothem, y: 2.5 * radius }, // bottom hex5
    { x: 0, y: 2 * radius }, // bottom-left hex5

    { x: -apothem, y: 2.5 * radius }, // bottom hex6
    { x: -2 * apothem, y: 2 * radius }, // bottom-left hex6
    { x: -2 * apothem, y: radius }, // top-left hex6
    { x: -apothem, y: 0.5 * radius }, // top hex6

    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get6HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
    ⬢ ⬢ ⬢
   ⬢ ⬢ ⬢
    1 2 3
   6 5 4
    */
    // OUTER
    { x: 0, y: -radius }, // top hex1
    { x: apothem, y: -0.5 * radius }, // top-right hex1
    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 4 * apothem, y: -radius }, //  top hex3
    { x: 5 * apothem, y: -0.5 * radius }, // top-right hex3
    { x: 5 * apothem, y: 0.5 * radius }, // bottom-right hex3
    { x: 4 * apothem, y: radius }, // bottom hex3

    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex4
    { x: 3 * apothem, y: 2.5 * radius }, // bottom hex4
    { x: 2 * apothem, y: 2 * radius }, // bottom-left hex4

    { x: apothem, y: 2.5 * radius }, // bottom hex5
    { x: 0, y: 2 * radius }, // bottom-left hex5

    { x: -apothem, y: 2.5 * radius }, // bottom hex6
    { x: -2 * apothem, y: 2 * radius }, // bottom-left hex6
    { x: -2 * apothem, y: radius }, // top-left hex6
    { x: -apothem, y: 0.5 * radius }, // top hex6

    { x: -apothem, y: -0.5 * radius }, // top-left hex1
    // MID
    { x: 0, y: -radius }, // top hex1

    // INNER
    { x: 0, y: -radiusInner }, // top hex1
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1

    { x: -apothemInner, y: 0.5 * radiusInner + borderWidth }, // top hex6, bottom-left hex1 TWEENSIE

    { x: -0.5 * 2 * apothem - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: -0.5 * 2 * apothem - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6
    { x: -0.5 * 2 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex6

    { x: 0, y: 1.5 * radius + 0.5 * radiusInner - borderWidth / 2 }, // bottom-left hex5, bottom-right hex6 TWEENSIE

    { x: 0.5 * 2 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex5

    { x: 2 * apothem, y: 1.5 * radius + 0.5 * radiusInner - borderWidth / 2 }, // bottom-left hex4, bottom-right hex5 TWEENSIE

    { x: 3 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex4
    { x: 1.5 * 2 * apothem + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex4

    { x: 1.5 * 2 * apothem + apothemInner, y: 1.5 * radius - 0.5 * radiusInner - borderWidth }, // bottom hex3, top-right hex4 TWEENSIE

    { x: 2 * 2 * apothem + apothemInner, y: 0.5 * radiusInner }, // bottom-right hex3
    { x: 2 * 2 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex3
    { x: 2 * 2 * apothem, y: -radiusInner }, //  top hex3

    { x: 3 * apothem, y: -0.5 * radius + borderWidth }, // top-right hex2, top-left hex3 TWEENSIE

    { x: 2 * apothem, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE
    // END
    { x: 0, y: -radiusInner }, // top hex1

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
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
     /\/\
    |6  1|
     \   \/\/\
     | 5 2 3 4|
      \/\/\/\/
    */
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1
    { x: 0, y: -radiusInner }, // top hex1
    { x: apothemInner, y: -0.5 * radiusInner }, // top-right hex1

    { x: apothemInner, y: 0.5 * radiusInner + halfBorder }, // bottom-right hex1, top hex2

    { x: 2 * apothem, y: 1.5 * radius - 0.5 * radiusInner + halfBorder / 2 }, // top-right hex2, top-left hex3

    { x: 1.5 * 2 * apothem, y: 1.5 * radius - radiusInner }, // top hex3

    { x: 4 * apothem, y: 1.5 * radius - 0.5 * radiusInner + halfBorder / 2 }, // top-right hex3, top-left hex4

    { x: 2.5 * 2 * apothem, y: 1.5 * radius - radiusInner }, // top hex4
    { x: 2.5 * 2 * apothem + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex4
    { x: 2.5 * 2 * apothem + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex4
    { x: 2.5 * 2 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex4

    { x: 4 * apothem, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex4, bottom-right hex3

    { x: 1.5 * 2 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex3

    { x: 2 * apothem, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex3, bottom-right hex2

    { x: 0.5 * 2 * apothem, y: 1.5 * radius + radiusInner }, // bottom hex2

    { x: 0, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex2, bottom-right hex5

    { x: -(2 * apothem) + apothem, y: 1.5 * radius + radiusInner }, // bottom hex5
    {
      x: -(2 * apothem) + apothem - apothemInner,
      y: 1.5 * radius + 0.5 * radiusInner,
    }, // bottom-left hex5

    {
      x: -(2 * apothem) + apothem - apothemInner,
      y: 1.5 * radius - 0.5 * radiusInner - halfBorder,
    }, // top-left hex5, bottom hex6

    { x: -(2 * apothem) + -apothemInner, y: 0.5 * radiusInner }, // bottom-left hex6
    { x: -(2 * apothem) + -apothemInner, y: -0.5 * radiusInner }, // top-left hex6
    { x: -(2 * apothem), y: -radiusInner }, // top hex6

    { x: -apothem, y: -0.5 * radius + halfBorder }, // top-right hex6, top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
// export function getMarvel6HexOutlineSvgPolygonPoints(
//   radius: number,
//   borderWidth: number,
// ) {
//   const apothem = (Math.sqrt(3) * radius) / 2
//   const halfBorder = borderWidth / 2
//   const hexWidth = 2 * apothem
//   // Outer hexagon
//   const rightXOuter = apothem
//   const topSideYOuter = -0.5 * radius
//   // Inner hexagon
//   const radiusInner = radius - halfBorder
//   const apothemInner = (Math.sqrt(3) * radiusInner) / 2
//   const rightXInner = apothemInner
//   const leftXInner = -apothemInner
//   const topYInner = -radiusInner
//   // const bottomYInner = radiusInner
//   const bottomSideYInner = 0.5 * radiusInner
//   const topSideYInner = -0.5 * radiusInner

//   const corners: Point[] = [
//     /* 
//      /\/\
//     |6  1|
//      \   \/\/\
//      | 5 2 3 4|
//       \/\/\/\/
//     */
//     { x: -apothemInner, y: topSideYInner }, // top-left hex1
//     { x: 0, y: topYInner }, // top hex1
//     { x: rightXInner, y: topSideYInner }, // top-right hex1
//     // { x: apothemInner, y: bottomSideYInner }, // bottom-right hex1

//     { x: apothemInner, y: bottomSideYInner + halfBorder }, // bottom-right hex1, top hex2 TWEENSIE

//     // { x: 0.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex2
//     // { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex2

//     { x: 2 * apothem, y: 1.5 * radius - 0.5 * radiusInner + halfBorder / 2 }, // top-right hex2, top-left hex3 TWEENSIE

//     // { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex3
//     { x: 1.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex3
//     // { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3

//     { x: 4 * apothem, y: 1.5 * radius - 0.5 * radiusInner + halfBorder / 2 }, // top-right hex3, top-left hex4 TWEENSIE

//     // { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex4
//     { x: 2.5 * hexWidth, y: 1.5 * radius - radiusInner }, // top hex4
//     { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex4
//     { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex4
//     { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex4
//     // { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex4

//     { x: 4 * apothem, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex4, bottom-right hex3 TWEENSIE

//     // { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
//     { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex3
//     // { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex3

//     { x: 2 * apothem, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex3, bottom-right hex2 TWEENSIE

//     // { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex2
//     { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex2
//     // { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex2

//     { x: 0, y: 1.5 * radius + 0.5 * radiusInner - halfBorder / 2 }, // bottom-left hex2, bottom-right hex5 TWEENSIE

//     // {
//     //   x: -hexWidth + rightXOuter + apothemInner,
//     //   y: 1.5 * radius + 0.5 * radiusInner,
//     // }, //bottom-right hex5
//     { x: -hexWidth + rightXOuter, y: 1.5 * radius + radiusInner }, // bottom hex5
//     {
//       x: -hexWidth + rightXOuter - apothemInner,
//       y: 1.5 * radius + 0.5 * radiusInner,
//     }, // bottom-left hex5
//     // {
//     //   x: -hexWidth + rightXOuter - apothemInner,
//     //   y: 1.5 * radius - 0.5 * radiusInner,
//     // }, // top-left hex5

//     {
//       x: -hexWidth + rightXOuter - apothemInner,
//       y: 1.5 * radius - 0.5 * radiusInner - halfBorder,
//     }, // top-left hex5, bottom hex6 TWEENSIE

//     // { x: -hexWidth, y: bottomYInner }, // bottom hex6
//     { x: -hexWidth + leftXInner, y: bottomSideYInner }, // bottom-left hex6
//     { x: -hexWidth + leftXInner, y: topSideYInner }, // top-left hex6
//     { x: -hexWidth, y: topYInner }, // top hex6
//     // { x: -hexWidth - leftXInner, y: topSideYInner }, // top-right hex6

//     { x: -apothem, y: topSideYOuter + halfBorder }, // top-right hex6, top-left hex1 TWEENSIE
//   ]
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }
export function get7HexSvgPolygonPointsAt00(radius: number) {
  // Outer hexagon
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem

  const corners: Point[] = [
    /* 
     1 2
    6 ⬢ 3
     5 4  
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: hexWidth, y: -radius }, //  top hex2
    { x: 1.5 * hexWidth, y: -0.5 * radius }, // top-right hex2

    { x: 1.5 * hexWidth, y: 0.5 * radius }, // bottom-right hex2, top hex3

    { x: 2 * hexWidth, y: radius }, // top-right hex3
    { x: 2 * hexWidth, y: 2 * radius }, // bottom-right hex3

    {
      x: 1.5 * hexWidth,
      y: 2.5 * radius,
    }, // bottom hex3, top-right hex4

    { x: 1.5 * hexWidth, y: 3.5 * radius }, // bottom-right hex4
    { x: hexWidth, y: 4 * radius }, // bottom hex4

    {
      x: apothem,
      y: 3.5 * radius,
    }, // bottom-left hex4, bottom-right hex5

    { x: 0, y: 4 * radius }, // bottom hex5
    { x: -apothem, y: 3.5 * radius }, // bottom-left hex5

    { x: -apothem, y: 2.5 * radius }, // top-left hex5, bottom hex6

    { x: -hexWidth, y: 2 * radius }, // bottom-left hex6
    { x: -hexWidth, y: 1 * radius }, // top-left hex6

    { x: -apothem, y: 0.5 * radius }, // top hex6, bottom-left hex6

    // { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get7HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const topX = 0
  // Outer hexagon
  const apothem = (Math.sqrt(3) * radius) / 2
  const hexWidth = 2 * apothem

  // Inner hexagon
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 
     1 2
    6 ⬢ 3
     5 4  
    */

    //  OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: hexWidth, y: -radius }, //  top hex2
    { x: 1.5 * hexWidth, y: -0.5 * radius }, // top-right hex2

    { x: 1.5 * hexWidth, y: 0.5 * radius }, // bottom-right hex2, top hex3

    { x: 2 * hexWidth, y: radius }, // top-right hex3
    { x: 2 * hexWidth, y: 2 * radius }, // bottom-right hex3

    {
      x: 1.5 * hexWidth,
      y: 2.5 * radius,
    }, // bottom hex3, top-right hex4

    { x: 1.5 * hexWidth, y: 3.5 * radius }, // bottom-right hex4
    { x: hexWidth, y: 4 * radius }, // bottom hex4

    {
      x: apothem,
      y: 3.5 * radius,
    }, // bottom-left hex4, bottom-right hex5

    { x: 0, y: 4 * radius }, // bottom hex5
    { x: -apothem, y: 3.5 * radius }, // bottom-left hex5

    { x: -apothem, y: 2.5 * radius }, // top-left hex5, bottom hex6

    { x: -hexWidth, y: 2 * radius }, // bottom-left hex6
    { x: -hexWidth, y: 1 * radius }, // top-left hex6

    { x: -apothem, y: 0.5 * radius }, // top hex6, bottom-left hex6

    { x: -apothem, y: -0.5 * radius }, // top-left hex1

    // MIDPOINT
    { x: 0, y: -radius }, // top hex1

    // INNER
    { x: topX, y: -radiusInner }, // top hex1
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1

    { x: -apothemInner, y: 0.5 * radiusInner + borderWidth }, // top hex6, bottom-left hex1 TWEENSIE

    { x: -apothem - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex6
    { x: -apothem - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6

    { x: -apothemInner, y: 3 * radius - 0.5 * radiusInner - borderWidth }, // top-left hex5, bottom hex6 TWEENSIE

    { x: -apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-left hex5
    { x: topX, y: 3 * radius + radiusInner }, // bottom hex5

    { x: apothem, y: 3 * radius + 0.5 * radiusInner - borderWidth / 2 }, // bottom-left hex4, bottom-right hex5 TWEENSIE

    { x: hexWidth, y: 3 * radius + radiusInner }, // bottom hex4
    { x: hexWidth + apothemInner, y: 3 * radius + 0.5 * radiusInner }, // bottom-right hex4

    {
      x: hexWidth + apothemInner,
      y: 3 * radius - 0.5 * radiusInner - borderWidth,
    }, // bottom hex3, top-right hex4 TWEENSIE

    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex3
    { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex3

    { x: hexWidth + apothemInner, y: 0.5 * radiusInner + borderWidth }, // bottom-right hex2, top hex3 TWEENSIE

    { x: hexWidth + apothemInner, y: -0.5 * radiusInner }, // top-right hex2
    { x: hexWidth, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE

    { x: topX, y: -radiusInner }, // top hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get24HexSvgPolygonPointsAt00(radius: number) {
  const apothem = (Math.sqrt(3) * radius) / 2

  const corners: Point[] = [
    /* 24-hex
     1 2
    17 ⬢ 3
     16 ⬢ 4
    15 ⬢ ⬢ 5  6
     14 ⬢ ⬢ ⬢  7
    13 12 11 10 9 8
    */
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-right hex2, top hex3

    { x: 4 * apothem, y: radius }, // top-right hex3

    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex3, top hex4

    { x: 5 * apothem, y: 2.5 * radius }, // top-right hex4

    { x: 5 * apothem, y: 3.5 * radius }, // bottom-right hex4, top hex5

    { x: 6 * apothem, y: 4 * radius }, // top-right hex5, top-left hex6

    { x: 7 * apothem, y: 3.5 * radius }, // top hex6
    { x: 8 * apothem, y: 4 * radius }, // top-right hex6

    { x: 8 * apothem, y: 5 * radius }, // bottom-right hex6, top hex7

    { x: 9 * apothem, y: 5.5 * radius }, // top-right hex7

    { x: 9 * apothem, y: 6.5 * radius }, // bottom-right hex7, top hex8

    { x: 10 * apothem, y: 7 * radius }, // top-right hex8
    // BEGIN STRAIGHT BOTTOM: 1,2,3...1,2,3... only X changes
    { x: 10 * apothem, y: 8 * radius }, // bottom-right hex8
    { x: 9 * apothem, y: 8.5 * radius }, // bottom hex8

    { x: 8 * apothem, y: 8 * radius }, // bottom-left hex8, bottom-right hex9

    { x: 7 * apothem, y: 8.5 * radius }, // bottom hex9

    { x: 6 * apothem, y: 8 * radius }, // bottom-left hex9, bottom-right hex10

    { x: 5 * apothem, y: 8.5 * radius }, // bottom hex10

    { x: 4 * apothem, y: 8 * radius }, // bottom-left hex10, bottom-right hex11

    { x: 3 * apothem, y: 8.5 * radius }, // bottom hex11

    { x: 2 * apothem, y: 8 * radius }, // bottom-left hex11, bottom-right hex12

    { x: apothem, y: 8.5 * radius }, // bottom hex12

    { x: 0, y: 8 * radius }, // bottom-left hex12, bottom-right hex13 

    { x: -apothem, y: 8.5 * radius }, // bottom hex13
    { x: -2 * apothem, y: 8 * radius }, // bottom-left hex13
    { x: -2 * apothem, y: 7 * radius }, // top-left hex13

    { x: -apothem, y: 6.5 * radius }, // top hex13, bottom-left hex14

    { x: -apothem, y: 5.5 * radius }, // top-left hex14, bottom hex15

    { x: -2 * apothem, y: 5 * radius }, // bottom-left hex15
    { x: -2 * apothem, y: 4 * radius }, // top-left hex15

    { x: -apothem, y: 3.5 * radius }, // top hex15, bottom-left hex16

    { x: -apothem, y: 2.5 * radius }, // top-left hex16, bottom hex17

    { x: -2 * apothem, y: 2 * radius }, // bottom-left hex17
    { x: -2 * apothem, y: radius }, // top-left hex17

    { x: -apothem, y: 0.5 * radius }, // top hex17, bottom-left hex1

    { x: -apothem, y: -0.5 * radius }, // top-left hex1
  ]
  const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
  return { points, corners }
}
export function get24HexOutlineSvgPolygonPoints(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  // Inner hexagon
  const radiusInner = radius - borderWidth
  const apothemInner = (Math.sqrt(3) * radiusInner) / 2

  const corners: Point[] = [
    /* 24-hex
     1 2
    17 ⬢ 3
     16 ⬢ 4
    15 ⬢ ⬢ 5  6
     14 ⬢ ⬢ ⬢  7
    13 12 11 10 9 8
    */
    // OUTER
    { x: 0, y: -radius }, // top hex1

    { x: apothem, y: -0.5 * radius }, // top-right hex1, top-left hex2 TWEENSIE

    { x: 2 * apothem, y: -radius }, //  top hex2
    { x: 3 * apothem, y: -0.5 * radius }, // top-right hex2

    { x: 3 * apothem, y: 0.5 * radius }, // bottom-right hex2, top hex3 TWEENSIE

    { x: 4 * apothem, y: radius }, // top-right hex3

    { x: 4 * apothem, y: 2 * radius }, // bottom-right hex3, top hex4 TWEENSIE

    { x: 5 * apothem, y: 2.5 * radius }, // top-right hex4

    { x: 5 * apothem, y: 3.5 * radius }, // bottom-right hex4, top hex5 TWEENSIE

    { x: 6 * apothem, y: 4 * radius }, // top-right hex5, top-left hex6 TWEENSIE

    { x: 7 * apothem, y: 3.5 * radius }, // top hex6
    { x: 8 * apothem, y: 4 * radius }, // top-right hex6

    { x: 8 * apothem, y: 5 * radius }, // bottom-right hex6, top hex7 TWEENSIE

    { x: 9 * apothem, y: 5.5 * radius }, // top-right hex7

    { x: 9 * apothem, y: 6.5 * radius }, // bottom-right hex7, top hex8 TWEENSIE

    { x: 10 * apothem, y: 7 * radius }, // top-right hex8
    { x: 10 * apothem, y: 8 * radius }, // bottom-right hex8
    { x: 9 * apothem, y: 8.5 * radius }, // bottom hex8

    { x: 8 * apothem, y: 8 * radius }, // bottom-left hex8, bottom-right hex9 TWEENSIE

    { x: 7 * apothem, y: 8.5 * radius }, // bottom hex9

    { x: 6 * apothem, y: 8 * radius }, // bottom-left hex9, bottom-right hex10 TWEENSIE

    { x: 5 * apothem, y: 8.5 * radius }, // bottom hex10

    { x: 4 * apothem, y: 8 * radius }, // bottom-left hex10, bottom-right hex11 TWEENSIE

    { x: 3 * apothem, y: 8.5 * radius }, // bottom hex11

    { x: 2 * apothem, y: 8 * radius }, // bottom-left hex11, bottom-right hex12 TWEENSIE

    { x: apothem, y: 8.5 * radius }, // bottom hex12

    { x: 0, y: 8 * radius }, // bottom-left hex12, bottom-right hex13  TWEENSIE

    { x: -apothem, y: 8.5 * radius }, // bottom hex13
    { x: -2 * apothem, y: 8 * radius }, // bottom-left hex13
    { x: -2 * apothem, y: 7 * radius }, // top-left hex13

    { x: -apothem, y: 6.5 * radius }, // top hex13, bottom-left hex14 TWEENSIE

    { x: -apothem, y: 5.5 * radius }, // top-left hex14, bottom hex15 TWEENSIE

    { x: -2 * apothem, y: 5 * radius }, // bottom-left hex15
    { x: -2 * apothem, y: 4 * radius }, // top-left hex15

    { x: -apothem, y: 3.5 * radius }, // top hex15, bottom-left hex16 TWEENSIE

    { x: -apothem, y: 2.5 * radius }, // top-left hex16, bottom hex17 TWEENSIE

    { x: -2 * apothem, y: 2 * radius }, // bottom-left hex17
    { x: -2 * apothem, y: radius }, // top-left hex17

    { x: -apothem, y: 0.5 * radius }, // top hex17, bottom-left hex1 TWEENSIE

    { x: -apothem, y: -0.5 * radius }, // top-left hex1

    // MID
    { x: 0, y: -radius }, // top hex1

    // INNER
    { x: 0, y: -radius + borderWidth }, // top hex1
    { x: -apothemInner, y: -0.5 * radiusInner }, // top-left hex1

    { x: -apothemInner, y: 0.5 * radius + borderWidth / 2 }, // bottom-left hex1, top hex17,  TWEENSIE

    { x: -apothem - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex17
    { x: -apothem - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex17

    { x: -apothemInner, y: 2.5 * radius - borderWidth / 2 }, // bottom hex17, top-left hex16 TWEENSIE

    { x: -apothemInner, y: 3 * radius + radiusInner / 2 + borderWidth }, // top hex15, bottom-left hex16 TWEENSIE

    { x: -apothem - apothemInner, y: 4.5 * radius - 0.5 * radiusInner }, // top-left hex15
    { x: -apothem - apothemInner, y: 4.5 * radius + 0.5 * radiusInner }, // bottom-left hex15

    { x: -apothemInner, y: 6 * radius - 0.5 * radiusInner - borderWidth }, // bottom hex15, top-left hex14 TWEENSIE

    { x: -apothemInner, y: 6 * radius + 0.5 * radiusInner + borderWidth }, // bottom-left hex14, top hex13 TWEENSIE

    { x: -apothem - apothemInner, y: 7.5 * radius - radiusInner / 2 }, // top-left hex13
    { x: -apothem - apothemInner, y: 7.5 * radius + radiusInner / 2 }, // bottom-left hex13
    { x: -apothem, y: 7.5 * radius + radiusInner }, // bottom hex13

    { x: 0, y: 8 * radius - borderWidth }, // bottom-right hex13, bottom-left hex12 TWEENSIE

    { x: apothem, y: 7.5 * radius + radiusInner }, // bottom hex12

    { x: 2 * apothem, y: 8 * radius - borderWidth }, // bottom-right hex12, bottom-left hex11 TWEENSIE

    { x: 3 * apothem, y: 7.5 * radius + radiusInner }, // bottom hex11

    { x: 4 * apothem, y: 8 * radius - borderWidth }, // bottom-right hex11, bottom-left hex10 TWEENSIE

    { x: 5 * apothem, y: 7.5 * radius + radiusInner }, // bottom hex10

    { x: 6 * apothem, y: 8 * radius - borderWidth }, // bottom-right hex10, bottom-left hex9 TWEENSIE

    { x: 7 * apothem, y: 7.5 * radius + radiusInner }, // bottom hex9

    { x: 8 * apothem, y: 8 * radius - borderWidth }, // bottom-right hex9, bottom-left hex8 TWEENSIE

    { x: 9 * apothem, y: 7.5 * radius + radiusInner }, // bottom hex8

    { x: 9 * apothem + apothemInner, y: 7.5 * radius + radiusInner / 2 }, // bottom-right hex8
    { x: 9 * apothem + apothemInner, y: 7.5 * radius - radiusInner / 2 }, // top-right hex8

    {
      x: 8 * apothem + apothemInner,
      y: 6 * radius + radiusInner / 2 + borderWidth,
    }, // top-left hex8, bottom-right hex7 TWEENSIE

    { x: 8 * apothem + apothemInner, y: 6 * radius - radiusInner / 2 }, // top-right hex7

    {
      x: 7 * apothem + apothemInner,
      y: 4.5 * radius + radiusInner / 2 + borderWidth,
    }, // top hex7, bottom-right hex6 TWEENSIE

    { x: 7 * apothem + apothemInner, y: 4.5 * radius - radiusInner / 2 }, // top-right hex6
    { x: 7 * apothem, y: 4.5 * radius - radiusInner }, // top hex6

    { x: 6 * apothem, y: 4 * radius + borderWidth }, // top-left hex6, top-right hex5 TWEENSIE

    {
      x: 4 * apothem + apothemInner,
      y: 3 * radius + radiusInner / 2 + borderWidth,
    }, // top hex5, bottom-right hex4 TWEENSIE

    { x: 4 * apothem + apothemInner, y: 3 * radius - radiusInner / 2 }, // top-right hex4

    {
      x: 3 * apothem + apothemInner,
      y: 1.5 * radius + radiusInner / 2 + borderWidth,
    }, // top hex4, bottom-right hex3 TWEENSIE

    { x: 3 * apothem + apothemInner, y: 1.5 * radius - radiusInner / 2 }, // top-right hex3

    { x: 2 * apothem + apothemInner, y: radiusInner / 2 + borderWidth }, // top hex3, bottom-right hex2 TWEENSIE

    { x: 2 * apothem + apothemInner, y: -0.5 * radiusInner }, // top-right hex2
    { x: 2 * apothem, y: -radiusInner }, //  top hex2

    { x: apothem, y: -0.5 * radius + borderWidth }, // top-right hex1, top-left hex2 TWEENSIE
    // END
    { x: 0, y: -radius + borderWidth }, // top hex1
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
// export function get7HexWallWalkOutlineSvgPolygonPointsAt00(
//   radius: number,
//   borderWidth: number,
// ) {
//   const apothem = (Math.sqrt(3) * radius) / 2
//   const halfBorder = borderWidth / 2
//   const hexWidth = 2 * apothem
//   const topX = 0
//   // Inner hexagon
//   const radiusInner = radius - halfBorder
//   const apothemInner = (Math.sqrt(3) * radiusInner) / 2
//   const rightXInner = apothemInner
//   const leftXInner = -apothemInner
//   const topYInner = -radiusInner
//   const bottomYInner = radiusInner
//   const bottomSideYInner = 0.5 * radiusInner
//   const topSideYInner = -0.5 * radiusInner

//   const corners: Point[] = [
//     /* 
//     ⬢ ⬢ ⬢ ⬢
//      ⬢ ⬢ ⬢
//     1 2 3 4
//    7 6 5 4
//     */
//     { x: topX, y: topYInner }, // top hex1
//     { x: rightXInner, y: topSideYInner }, // top-right hex1

//     { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2
//     { x: hexWidth, y: topYInner }, //  top hex2
//     { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

//     { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3
//     { x: 2 * hexWidth, y: topYInner }, //  top hex3
//     { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3

//     { x: 3 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex4
//     { x: 3 * hexWidth, y: topYInner }, //  top hex4
//     { x: 3 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex4
//     { x: 3 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex4
//     { x: 3 * hexWidth, y: bottomYInner }, // bottom hex4

//     { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex5
//     { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex5
//     { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex5
//     { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex5

//     { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex6
//     { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex6
//     { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6

//     { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex7
//     { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex7
//     { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex7
//     { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex7

//     { x: topX, y: bottomYInner }, // bottom hex1
//     { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
//     { x: leftXInner, y: topSideYInner }, // top-left hex1
//   ]
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }
export function get9HexWallWalkSvgPolygonPointsAt00(
  radius: number,
  borderWidth: number,
) {
  const apothem = (Math.sqrt(3) * radius) / 2
  const halfBorder = borderWidth / 2
  const hexWidth = 2 * apothem
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
// export function get9HexWallWalkOutlineSvgPolygonPointsAt00(
//   radius: number,
//   borderWidth: number,
// ) {
//   const apothem = (Math.sqrt(3) * radius) / 2
//   const halfBorder = borderWidth / 2
//   const hexWidth = 2 * apothem
//   const topX = 0
//   // Inner hexagon
//   const radiusInner = radius - halfBorder
//   const apothemInner = (Math.sqrt(3) * radiusInner) / 2
//   const rightXInner = apothemInner
//   const leftXInner = -apothemInner
//   const topYInner = -radiusInner
//   const bottomYInner = radiusInner
//   const bottomSideYInner = 0.5 * radiusInner
//   const topSideYInner = -0.5 * radiusInner

//   const corners: Point[] = [
//     /* 
//     ⬢ ⬢ ⬢ ⬢ ⬢
//      ⬢ ⬢ ⬢ ⬢
//     1 2 3 4 5
//      9 8 7 6
//     */
//     { x: topX, y: topYInner }, // top hex1
//     { x: rightXInner, y: topSideYInner }, // top-right hex1

//     { x: hexWidth - apothemInner, y: topSideYInner }, // top-left hex2
//     { x: hexWidth, y: topYInner }, //  top hex2
//     { x: hexWidth + apothemInner, y: topSideYInner }, // top-right hex2

//     { x: 2 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex3
//     { x: 2 * hexWidth, y: topYInner }, //  top hex3
//     { x: 2 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex3

//     { x: 3 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex4
//     { x: 3 * hexWidth, y: topYInner }, //  top hex4
//     { x: 3 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex4

//     { x: 4 * hexWidth - apothemInner, y: topSideYInner }, // top-left hex5
//     { x: 4 * hexWidth, y: topYInner }, //  top hex5
//     { x: 4 * hexWidth + apothemInner, y: topSideYInner }, // top-right hex5
//     { x: 4 * hexWidth + apothemInner, y: bottomSideYInner }, // bottom-right hex5
//     { x: 4 * hexWidth, y: bottomYInner }, // bottom hex5

//     { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-right hex6
//     { x: 3.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex6
//     { x: 3.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex6
//     { x: 3.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex6

//     { x: 2.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex7
//     { x: 2.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex7
//     { x: 2.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex7

//     { x: 1.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex8
//     { x: 1.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex8
//     { x: 1.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex8

//     { x: 0.5 * hexWidth + apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-right hex9
//     { x: 0.5 * hexWidth, y: 1.5 * radius + radiusInner }, // bottom hex9
//     { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius + 0.5 * radiusInner }, // bottom-left hex9
//     { x: 0.5 * hexWidth - apothemInner, y: 1.5 * radius - 0.5 * radiusInner }, // top-left hex9

//     { x: topX, y: bottomYInner }, // bottom hex1
//     { x: leftXInner, y: bottomSideYInner }, // bottom-left hex1
//     { x: leftXInner, y: topSideYInner }, // top-left hex1
//   ]
//   const points = corners.map((point) => `${point.x},${point.y}`).join(' ')
//   return { points, corners }
// }

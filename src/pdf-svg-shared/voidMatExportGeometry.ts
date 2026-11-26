import { getVoidMatHexes } from '../data/voidMat'
import { Pieces } from '../types'
import type { BoardPiece, Point } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { getHexagonSvgPolygonPointsAt00 } from './hexPolygonPoints'
import {
  VOID_MAT_OUTLINE_AXIAL,
  voidMatPoint,
} from '../world/models/voidMatGeometry'

export const VOID_MAT_GRID_LINE_WIDTH = SVG_HEX_RADIUS * 0.025

export function getVoidMatExportGeometry(
  mat: Pick<BoardPiece, 'inventoryID' | 'pieceCoords' | 'rotation'>,
  radius = SVG_HEX_RADIUS,
) {
  const origin = hexUtilsHexToPixel(mat.pieceCoords)
  const cellCorners = getHexagonSvgPolygonPointsAt00(radius).corners
  if (mat.inventoryID === Pieces.voidMarker) {
    return { outline: cellCorners, cells: [] }
  }
  const outline = VOID_MAT_OUTLINE_AXIAL.map(([q, r]) => {
    const [x, y] = voidMatPoint(q, r)
    return { x: x * radius, y: y * radius }
  })
  const cells = getVoidMatHexes({ ...mat, rotation: 0 }).map((hex) => {
    const center = hexUtilsHexToPixel(hex)
    return cellCorners.map((corner) => ({
      x: center.x - origin.x + corner.x,
      y: center.y - origin.y + corner.y,
    }))
  })
  return { outline, cells }
}

export const pointsToSvgString = (points: Point[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(' ')

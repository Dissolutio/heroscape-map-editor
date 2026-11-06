import type { PieceKeyEntry } from './pieceKey'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { SVG_HEX_RADIUS } from '../utils/constants'

export const getPieceKeyShapeLayout = (entry: PieceKeyEntry) => {
  const origin = hexUtilsHexToPixel(entry.piece.pieceCoords)
  const angle = -((entry.piece.rotation % 6) * 60)
  const radians = (angle * Math.PI) / 180
  const positions = entry.hexes.map((hex) => {
    const pixel = hexUtilsHexToPixel(hex)
    const dx = pixel.x - origin.x
    const dy = pixel.y - origin.y
    return {
      x: dx * Math.cos(radians) - dy * Math.sin(radians),
      y: dx * Math.sin(radians) + dy * Math.cos(radians),
    }
  })
  const minX = positions.length
    ? Math.min(...positions.map(({ x }) => x)) - SVG_HEX_RADIUS
    : -SVG_HEX_RADIUS
  const maxX = positions.length
    ? Math.max(...positions.map(({ x }) => x)) + SVG_HEX_RADIUS
    : SVG_HEX_RADIUS
  const minY = positions.length
    ? Math.min(...positions.map(({ y }) => y)) - SVG_HEX_RADIUS
    : -SVG_HEX_RADIUS
  const maxY = positions.length
    ? Math.max(...positions.map(({ y }) => y)) + SVG_HEX_RADIUS
    : SVG_HEX_RADIUS

  return {
    origin,
    angle,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}

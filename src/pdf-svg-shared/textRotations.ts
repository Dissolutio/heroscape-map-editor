import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'

export const xTransformForMultiHex3Rotation = [
  SVG_HEX_APOTHEM,
  0,
  -SVG_HEX_APOTHEM,
  -SVG_HEX_APOTHEM,
  0,
  SVG_HEX_APOTHEM,
]
export const yTransformForMultiHex3Rotation = [
  SVG_HEX_RADIUS / 2,
  SVG_HEX_RADIUS,
  SVG_HEX_RADIUS / 2,
  -SVG_HEX_RADIUS / 2,
  -SVG_HEX_RADIUS,
  -SVG_HEX_RADIUS / 2,
]
export const xTransformForMultiHex7Rotation = [
  SVG_HEX_APOTHEM,
  -SVG_HEX_APOTHEM,
  -2 * SVG_HEX_APOTHEM,
  -SVG_HEX_APOTHEM,
  SVG_HEX_APOTHEM,
  2 * SVG_HEX_APOTHEM,
]
export const yTransformForMultiHex7Rotation = [
  SVG_HEX_RADIUS * 1.5,
  SVG_HEX_RADIUS * 1.5,
  0,
  -SVG_HEX_RADIUS * 1.5,
  -SVG_HEX_RADIUS * 1.5,
  0,
]
export const xTransformForMultiHex24Rotation = [
  SVG_HEX_APOTHEM * 3,
  -SVG_HEX_APOTHEM * 3,
  -SVG_HEX_APOTHEM * 6,
  -SVG_HEX_APOTHEM * 3,
  SVG_HEX_APOTHEM * 3,
  SVG_HEX_APOTHEM * 6,
]
export const yTransformForMultiHex24Rotation = [
  SVG_HEX_RADIUS * 4.5,
  SVG_HEX_RADIUS * 4.5,
  0,
  -SVG_HEX_RADIUS * 4.5,
  -SVG_HEX_RADIUS * 4.5,
  0,
]

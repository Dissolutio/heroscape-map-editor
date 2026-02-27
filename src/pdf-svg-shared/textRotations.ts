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

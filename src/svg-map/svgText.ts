import { SVG_HEX_RADIUS, SVG_HEX_APOTHEM } from '../utils/constants'

export const hexTextStyle = {
  fontSize: 0.93 * SVG_HEX_RADIUS,
  fontFamily: 'Inter',
  fontWeight: 600,
}
export const singleHexObstacleHeightTextProps = (heightText: string) => ({
  style: hexTextStyle,
  // x: 0.7 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS
  y: 0.35 * SVG_HEX_RADIUS,
  x:
    heightText.toString().length === 2
      ? -0.55 * SVG_HEX_APOTHEM
      : -0.3 * SVG_HEX_APOTHEM,
})

import { SVG_HEX_RADIUS, SVG_HEX_APOTHEM } from '../utils/constants'

export const hexTextStyle = {
  fontSize: 0.6 * SVG_HEX_RADIUS,
  fontWeight: 'bold',
}
export const singleHexObstacleHeightTextProps = (heightText: string) => ({
  style: hexTextStyle,
  y: 0.2 * SVG_HEX_RADIUS,
  x:
    heightText.toString().length === 2
      ? -0.35 * SVG_HEX_APOTHEM
      : -0.15 * SVG_HEX_APOTHEM,
})

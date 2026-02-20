import { SVG_HEX_RADIUS, SVG_HEX_APOTHEM } from '../utils/constants'

export const hexTextStyle = {
  fontSize: 0.93 * SVG_HEX_RADIUS,
  fontFamily: 'Inter',
  fontWeight: 600,
}
export const singleHexObstacleHeightTextProps = () => ({
  style: hexTextStyle,
  // x: 0.7 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS
  // these properties make the text centered within the hexagon
  // text-anchor="middle" dominant-baseline="central"
  textAnchor: 'middle' as const,
  dominantBaseline: 'central' as const,
})

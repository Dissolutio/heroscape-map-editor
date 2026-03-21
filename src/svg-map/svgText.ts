import { SVG_HEX_RADIUS } from '../utils/constants'

export const hexTextStyle = {
  fontSize: 0.93 * SVG_HEX_RADIUS,
  fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  fontWeight: 600,
}
export const singleHexObstacleHeightTextProps = () => ({
  style: hexTextStyle,
  // Keep centering compatible with non-browser SVG viewers.
  // dominant-baseline is inconsistently implemented outside browsers.
  textAnchor: 'middle' as const,
  dy: '0.35em',
})

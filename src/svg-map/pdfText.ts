import { SVG_HEX_RADIUS } from '../utils/constants'

export const pdfHexTextStyle = {
  fontSize: 0.93 * SVG_HEX_RADIUS,
  fontFamily: 'Inter',
  fontWeight: 600,
}
export const pdfTextProps = () => ({
  style: pdfHexTextStyle,
  // these properties make the text centered within the hexagon
  // text-anchor="middle" dominant-baseline="central"
  textAnchor: 'middle' as const,
  dominantBaseline: 'central' as const,
})

import { BoardHex } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { SvgHexIDText } from './SvgHexIDText'
import { getHexagonSvgPolygonPoints } from './getHexagonSvgPolygonPoints'
import { getSvgHexBorderColor, getSvgHexFillColor } from './getSvgHexColors'

export const SvgMapHex = ({ hex }: { hex: BoardHex }) => {
  const isEmptyHex = hex.terrain === 'empty'
  // handlers
  const pixel = hexUtilsHexToPixel(hex)

  const { points } = getHexagonSvgPolygonPoints(SVG_HEX_RADIUS)
  const color = getSvgHexFillColor(hex)
  const borderColor = getSvgHexBorderColor(hex)

  const borderRotation =
    (+(hex?.interlockRotation ?? 0) + (hex?.pieceRotation ?? 0)) * 60

  return (
    <g
      transform={`translate(${pixel.x}, ${pixel.y})`}
      clipPath="url(#inner-stroke-clip)"
    >
      <polygon points={points} fill={color} stroke={color} />
      {hex.interlockType !== '0' && (
        <polygon
          points={points}
          transform={`rotate(${borderRotation}, 8.660254037844386, 10)`}
          fill="transparent"
          stroke={borderColor}
          strokeWidth={isEmptyHex ? 0.2 : 2}
          strokeLinejoin="round"
          strokeLinecap="butt"
          clipPath={`url(#interlock${hex.interlockType}-clip)`}
        />
      )}
      {/* Hex text */}
      {!isEmptyHex && <SvgHexIDText text={`${hex.altitude}`} textLine2={``} />}
    </g>
  )
}

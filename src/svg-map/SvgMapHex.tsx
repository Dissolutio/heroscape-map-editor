import useBoundStore from '../store/store'
import type { BoardHex } from '../types'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import { SvgHexIDText } from './SvgHexIDText'
import { getHexagonSvgPolygonPoints } from './getHexagonSvgPolygonPoints'
import { getSvgHexBorderColor, getSvgHexFillColor } from './getSvgHexColors'

const OPACITY_SUBLEVEL = 0.3

export const SvgMapHex = ({ hex }: { hex: BoardHex }) => {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = hex.altitude <= viewingLevel
  const isSubLevel = hex.altitude < viewingLevel
  const isEmptyHex = hex.terrain === 'empty'
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
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      <polygon
        points={points}
        fill={color}
        stroke={color}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {hex.interlockType !== '0' && (
        <polygon
          points={points}
          transform={`rotate(${borderRotation}, 8.660254037844386, 10)`}
          fill="transparent"
          stroke={borderColor}
          strokeWidth={isEmptyHex ? 0.2 : 2}
          strokeLinejoin="round"
          strokeLinecap="butt"
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
          clipPath={`url(#interlock${hex.interlockType}-clip)`}
        />
      )}
      {/* Hex text */}
      {!isEmptyHex && <SvgHexIDText text={`${hex.altitude}`} textLine2={``} />}
    </g>
  )
}

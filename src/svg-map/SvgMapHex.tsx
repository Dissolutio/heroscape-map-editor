import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { HexTerrain, Pieces, type BoardHex } from '../types'
import { isFluidTerrainHex, isObstaclePieceID, isSolidTerrainHex } from '../utils/board-utils'
import {
  SVG_BORDER_WIDTH,
  SVG_EMPTYHEX_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { decodePieceID, hexUtilsHexToPixel } from '../utils/map-utils'
import { SvgHexIDText } from './SvgHexIDText'
import { SvgOutcrop3 } from './SvgShapes'
import { getHexagonSvgPolygonPointsAt00 } from './getHexagonSvgPolygonPoints'
import { getSvgHexBorderColor, getSvgHexFillColor } from './getSvgHexColors'

const OPACITY_SUBLEVEL = 0.3

export const SvgMapHex = ({ hex }: { hex: BoardHex }) => {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const pixel = hexUtilsHexToPixel(hex)
  const isSubLevel = hex.altitude < viewingLevel
  const { inventoryID } = decodePieceID(hex.pieceID)
  const isObstaclePiece = isObstaclePieceID(inventoryID)
  const isAuxiliaryNotRenderedIn2D = isObstaclePiece && (hex.isObstacleAuxiliary || hex.isVerticalClearanceHex)
  const isEmptyHex = hex.terrain === HexTerrain.empty
  const isVisible = hex.altitude <= viewingLevel
  const isLandHex =
    isSolidTerrainHex(hex.terrain) || isFluidTerrainHex(hex.terrain)
  const pieceHeightText = piecesSoFar[inventoryID]?.height
  const fillColor = isEmptyHex ? 'white' : getSvgHexFillColor(hex)
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const borderWidth = isEmptyHex ? SVG_EMPTYHEX_BORDER_WIDTH : SVG_BORDER_WIDTH
  const { points } = isEmptyHex ? getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS, SVG_EMPTYHEX_BORDER_WIDTH)
    : getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS, SVG_BORDER_WIDTH)

  // EARLY RETURN: NOT VISIBLE
  if (!isVisible || isAuxiliaryNotRenderedIn2D) {
    return null
  }
  // Outcrop 3s
  if (inventoryID === Pieces.outcrop3 || inventoryID === Pieces.lavaRockOutcrop3 || inventoryID === Pieces.glacier3) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgOutcrop3 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  return (
    <g
      transform={`translate(${pixel.x}, ${pixel.y})`}
      clipPath="url(#inner-stroke-clip)"
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* Hex text */}
      {!isEmptyHex && <SvgHexIDText text={`${hex.altitude}`} textLine2={``} />}
    </g>
  )
}

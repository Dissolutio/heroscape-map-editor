import { Circle, G, Polygon, Text } from '@react-pdf/renderer'
import { piecesSoFar } from '../data/pieces'
import {
  get24HexSvgPolygonPointsAt00,
  get2HexSvgPolygonPointsAt00,
  get3HexStraightSvgPolygonPointsAt00,
  get3HexSvgPolygonPointsAt00,
  get4HexSvgPolygonPointsAt00,
  get5HexStraightSvgPolygonPointsAt00,
  get6HexSvgPolygonPointsAt00,
  get7HexSvgPolygonPointsAt00,
  get7HexWallWalkSvgPolygonPointsAt00,
  get9HexWallWalkSvgPolygonPointsAt00,
  getHexagonSvgPolygonPointsAt00,
  getLaurShortWallSvgPolygonPoints,
  getLaurWallRuinSvgPolygonPoints,
  getMarvel6HexSvgPolygonPointsAt00,
} from '../svg-map/getHexagonSvgPolygonPoints'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
} from '../svg-map/getSvgHexColors'
import { type BoardHex, type DecodedPieceID, HexTerrain } from '../types'
import {
  OPACITY_EMPTY,
  OPACITY_SUBLEVEL,
  SVG_BORDER_WIDTH,
  SVG_EMPTYHEX_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'

const hexTextStyle = {
  fontSize: 0.8 * SVG_HEX_RADIUS,
  fontWeight: 'bold',
}
// const singleHexObstacleHeightTextProps = (heightText: string) => ({
//   style: hexTextStyle,
//   y: 0.3 * SVG_HEX_RADIUS,
//   x:
//     heightText.toString().length === 2
//       ? -0.6 * SVG_HEX_APOTHEM
//       : -0.3 * SVG_HEX_APOTHEM,
// })
// const twoCharNumberAdjust = -0.15 * SVG_HEX_RADIUS

// export const SvgOutcrop3 = ({
//   hex,
//   isSubLevel,
// }: {
//   hex: BoardHex
//   isSubLevel?: boolean
// }) => {
//   const fillColor = getSvgHexFillColor(hex)
//   const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
//   const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
//   return (
//     <g>
//       {isSubLevel && (
//         <polygon
//           transform={`rotate(${pieceRotation})`}
//           points={get3HexSvgPolygonPointsAt00(SVG_HEX_RADIUS, 0).points}
//           fill={'white'}
//         />
//       )}
//       <polygon
//         transform={`rotate(${pieceRotation})`}
//         points={
//           get3HexSvgPolygonPointsAt00(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).points
//         }
//         fill={fillColor}
//         stroke={borderColor}
//         strokeWidth={SVG_BORDER_WIDTH}
//         opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
//       />
//       <text
//         fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
//         // white text needs a little opacity boost
//         opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
//         style={hexTextStyle}
//         x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
//         y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
//       >
//         {'5'}
//       </text>
//       <text
//         fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
//         // white text needs a little opacity boost
//         opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
//         style={hexTextStyle}
//         x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
//         y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
//       >
//         {'9'}
//       </text>
//       <text
//         fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
//         // white text needs a little opacity boost
//         opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
//         style={hexTextStyle}
//         x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
//         y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
//       >
//         {'7'}
//       </text>
//     </g>
//   )
// }

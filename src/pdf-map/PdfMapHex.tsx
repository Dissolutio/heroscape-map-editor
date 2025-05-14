import { G, Path, Polygon, Text } from '@react-pdf/renderer'
import { piecesSoFar } from '../data/pieces'
import {
  get2HexSvgPolygonPointsAt00,
  getHexagonSvgPolygonPointsAt00,
} from '../svg-map/getHexagonSvgPolygonPoints'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
} from '../svg-map/getSvgHexColors'
import { BoardHex, HexTerrain, Pieces } from '../types'
import {
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isObstaclePieceID,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { decodePieceID, hexUtilsHexToPixel } from '../utils/map-utils'
import { svgColors } from '../world/maphex/hexColors'

const SVG_BORDER_WIDTH = 2 // divided by 2
const SVG_EMPTYHEX_BORDER_WIDTH = 0.2 // divided by 2

export const PdfMapHex = ({
  hex,
  viewingLevel,
}: { hex: BoardHex; viewingLevel: number }) => {
  const pixel = hexUtilsHexToPixel(hex)
  const isEmptyHex = hex.terrain === 'empty'
  const { inventoryID } = decodePieceID(hex.pieceID)
  const isObstaclePiece = isObstaclePieceID(inventoryID)
  const isSubLevel = hex.altitude < viewingLevel || (isObstaclePiece && !hex.isObstacleOrigin)
  const isAuxiliaryNotRenderedIn2D = isObstaclePiece && hex.isObstacleAuxiliary
  const isVisible = hex.altitude <= viewingLevel
  const fillColor = isEmptyHex ? 'white' : getSvgHexFillColor(hex)
  const isLandHex =
    isSolidTerrainHex(hex.terrain) || isFluidTerrainHex(hex.terrain)
  const borderColor = getSvgHexBorderColor(hex)
  const borderRotation =
    ((hex?.interlockRotation ?? 0) + (hex?.pieceRotation ?? 0)) % 6
  const pieceHeightText = piecesSoFar[inventoryID]?.height

  // EARLY RETURN: NOT VISIBLE
  if (!isVisible || isAuxiliaryNotRenderedIn2D) {
    return null
  }
  // TREES
  if (isEvergreenTree(hex.terrain)) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1
          hex={hex}
        />
        <Text
          fill="white"
          // opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
          style={{
            fontSize: 9,
            fontWeight: 'bold',
          }}
          y={1.3 * SVG_HEX_RADIUS}
          x={
            pieceHeightText.toString().length === 2
              ? 0.4 * SVG_HEX_APOTHEM
              : 0.7 * SVG_HEX_APOTHEM
          }
        >
          {pieceHeightText}
        </Text>
      </G>
    )
  }
  if (isJungleTerrainHex(hex.terrain)) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1
          hex={hex}
        />
        <Text
          style={{
            fontSize: 9,
            fontWeight: 'bold',
          }}
          // opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
          fill="rgb(35, 31, 32)"
          y={1.3 * SVG_HEX_RADIUS}
          x={
            pieceHeightText.toString().length === 2
              ? 0.4 * SVG_HEX_APOTHEM
              : 0.7 * SVG_HEX_APOTHEM
          }
        >
          {pieceHeightText}
        </Text>
      </G>
    )
  }
  if (inventoryID === Pieces.laurWallPillar ||
    (isLandHex && piecesSoFar[inventoryID].size === 1)
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1
          hex={hex}
        />
      </G>
    )
  }
  // EARLY RETURN: USE MULTIHEX FOR SOME TILES (wip)
  if (
    isLandHex && piecesSoFar?.[inventoryID]?.size === 2 &&
    hex.isObstacleAuxiliary
  ) {
    return null
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.size === 2 &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex2
          hex={hex}
        />
      </G>
    )
  }
  return (
    <G transform={`translate(${pixel.x}, ${pixel.y})`}>
      {/* Hex Fill */}
      {hex?.interlockType !== '6' && (
        <Polygon
          points={isEmptyHex ? getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS - SVG_EMPTYHEX_BORDER_WIDTH / 2).points : getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS - (SVG_BORDER_WIDTH / 2)).points}
          fill={fillColor}
          stroke={isEmptyHex ? 'black' : fillColor}
          strokeWidth={isEmptyHex ? SVG_EMPTYHEX_BORDER_WIDTH : SVG_BORDER_WIDTH}
        />)}
      {/* Snow/Ice Flakes */}
      {(hex.terrain === HexTerrain.snow ||
        hex.terrain === HexTerrain.ice) && (
          <Path
            d="M249.987,184.875c-1.604-1.794-3.973-2.72-6.361-2.463c-2.395,0.246-4.523,1.626-5.727,3.71l-2.145,3.717l-12.848-7.417 l19.41-12.416c3.49-2.232,4.51-6.87,2.277-10.359c-2.232-3.491-6.873-4.506-10.359-2.277l-25.133,16.077L190.476,148l18.85-25.752 l24.609,16.813c1.295,SVGHEX_BORDER_SCALE84,2.768,1.308,4.225,1.308c2.395,0,4.746-1.145,6.199-3.27c2.336-3.42,1.457-8.087-1.963-10.424 l-19.842-13.556l13.201-7.622l2.455,4.252c1.207,2.093,3.35,3.476,5.756,3.714c0.246,0.024,0.494,0.036,0.74,0.036 c2.145,0,4.201-0.92,5.631-2.549l25.274-28.753c2.131-2.424,2.473-5.939,0.848-8.727c-1.625-2.789-4.852-4.223-8.012-3.566 l-37.373,7.794c-2.355,0.491-4.332,2.082-5.314,4.278c-0.982,2.195-0.854,4.729,0.35,6.813l2.146,3.717l-12.848,7.417l-1.047-23.019 c-0.188-4.138-3.695-7.337-7.832-7.151c-4.139,0.188-7.34,3.695-7.152,7.833l1.342,29.478l-31.877,3.467L156.21,81.877 l26.361-13.661c3.678-1.906,5.113-6.433,3.207-10.11c-1.906-3.678-6.702-5.113-10.381-3.208L154.667,65.5V51h4.836 c0.006,0.001,0.014,0.001,0.02,0c4.143,0,7.5-3.324,7.5-7.467c0-1.017-0.203-1.955-0.57-2.838L154.689,5.023 C153.681,1.957,150.823,0,147.595,0c-0.01,0-0.02,0-0.029,0c-3.215,0-6.074,1.918-7.105,4.966l-12.264,36.132 c-0.773,2.289-0.398,4.811,1.012,6.774c1.408,1.964,3.676,3.128,6.094,3.128h4.365v14.91l-21.389-10.407 c-3.734-1.793-8.079-0.222-9.874,3.513c-1.793,3.733-0.153,8.215,3.582,10.009l26.297,12.618l-12.721,28.888l-30.577-3.326 l1.343-29.452c0.189-4.138-3.011-7.645-7.148-7.833c-4.131-0.164-7.643,3.015-7.832,7.151l-1.046,23.019l-12.557-7.25l2.147-3.717 c1.203-2.084,1.332-4.618,0.35-6.813c-0.982-2.196-2.959-3.787-5.314-4.278l-37.373-7.794c-3.156-0.661-6.387,0.776-8.012,3.566 c-1.625,2.788-1.283,6.304,0.848,8.727l25.274,28.753c1.43,1.629,3.486,2.549,5.631,2.549c0.246,0,0.494-0.012,0.74-0.036 c2.406-0.238,4.549-1.621,5.756-3.714l2.455-4.252l12.912,7.455L53.314,126.84c-3.42,2.337-4.299,7.004-1.963,10.424 c1.453,2.126,3.807,3.27,6.201,3.27c1.457,0,2.93-0.424,4.223-1.308l23.832-16.28L103.944,148l-18.131,24.771l-24.34-15.568 c-3.488-2.23-8.125-1.213-10.359,2.277c-2.231,3.489-1.211,8.127,2.277,10.359l19.412,12.416l-12.559,7.25l-2.145-3.717 c-1.203-2.084-3.332-3.464-5.727-3.71c-2.4-0.251-4.76,0.669-6.361,2.463l-25.438,28.47c-2.15,2.407-2.52,5.919-0.918,8.721 c1.354,2.366,3.857,3.776,6.51,3.776c0.488,0,0.981-0.048,1.473-0.146l37.537-7.511c2.369-0.475,4.365-2.061,5.361-4.263 c0.996-2.202,0.871-4.749-0.338-6.842l-2.455-4.252l12.912-7.455l1.818,23.964c0.299,3.938,3.586,6.934,7.471,6.933 c0.191,0,0.383-0.007,0.576-0.021c4.131-0.314,7.225-3.916,6.91-8.046l-2.207-29.101l30.354-3.301l12.617,28.613l-26.143,12.56 c-3.734,1.794-5.307,6.275-3.514,10.009c1.795,3.734,6.005,5.305,9.738,3.513l21.389-10.407V245h-4.365 c-2.418,0-4.686,1.131-6.094,3.095c-1.41,1.964-1.785,4.452-1.012,6.741l12.264,36.198c1.031,3.048,3.889,4.966,7.105,4.966 c0.01,0,0.02,0,0.029,0c3.229,0,6.086-1.957,7.094-5.023l11.938-36.132c0.752-2.285,0.363-4.792-1.047-6.741 s-3.67-3.104-6.076-3.104h-4.836v-14.834l20.73,10.603c1.104,0.571,2.417,0.843,3.581,0.843c2.711,0,5.398-1.477,6.732-4.051 c1.906-3.678,0.504-8.204-3.174-10.11l-26.225-13.6l12.521-28.382l31.65,3.441l-2.209,29.125c-0.313,4.13,2.783,7.732,6.914,8.046 c0.193,0.015,0.385,0.021,0.575,0.021c3.885,0,7.172-2.995,7.471-6.933l1.818-23.963l13.203,7.622l-2.455,4.252 c-1.209,2.093-1.334,4.64-0.338,6.842c0.996,2.201,2.992,3.788,5.361,4.263l37.537,7.511c0.492,0.099,0.984,0.145,1.473,0.145 c2.652,0,5.156-1.41,6.51-3.776c1.602-2.802,1.232-6.313-0.918-8.721L249.987,184.875z"
            fill={
              hex.terrain === HexTerrain.snow
                ? svgColors.snowFlake
                : svgColors.iceFlake
            }
            transform={`translate(${(SVG_HEX_APOTHEM - 2 * SVG_HEX_APOTHEM * 0.03) / 2}, ${(SVG_HEX_RADIUS - 2 * SVG_HEX_RADIUS * 0.03) / 2})scale(0.03)`}
          ></Path>
        )}
    </G>
  )
}

const PdfMultiHex1 = ({
  hex,
}: {
  hex: BoardHex
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = getSvgHexBorderColor(hex)

  return (
    <Polygon
      fill={fillColor}
      stroke={borderColor}
      strokeWidth={SVG_BORDER_WIDTH}
      points={getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS - SVG_BORDER_WIDTH / 2).points}
    // clipPath="url(#inner-stroke-clip)"
    />
  )
}
const PdfMultiHex2 = ({
  hex,
}: {
  hex: BoardHex
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = getSvgHexBorderColor(hex)
  const pieceRotation =
    ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <Polygon
      // transform={`rotate(${pieceRotation})`}
      // transform={`rotate(-60)`}
      points={get2HexSvgPolygonPointsAt00(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).points}
      fill={fillColor}
      stroke={borderColor}
      strokeWidth={SVG_BORDER_WIDTH}
    />
  )
}
import { piecesSoFar } from '../data/pieces'
import {
  generateArrowPath,
  genWoodPlankPath1,
  genWoodPlankPath2,
  genWoodPlankPath3,
  get1HexOutlineSvgPolygonPoints,
  get24HexOutlineSvgPolygonPoints,
  get24HexSvgPolygonPointsAt00,
  get2HexOutlineSvgPolygonPoints,
  get2HexSvgPolygonPointsAt00,
  get3HexOutlineSvgPolygonPoints,
  get3HexStraightSvgPolygonPointsAt00,
  get3HexSvgPolygonPointsAt00,
  get4HexOutlineSvgPolygonPoints,
  get4HexSvgPolygonPointsAt00,
  get5HexOutlineSvgPolygonPoints,
  get5HexStraightSvgPolygonPointsAt00,
  get6HexOutlineSvgPolygonPoints,
  get6HexSvgPolygonPointsAt00,
  get7HexOutlineSvgPolygonPoints,
  get7HexSvgPolygonPointsAt00,
  get7HexWallWalkOutlineSvgPolygonPoints,
  get7HexWallWalkSvgPolygonPointsAt00,
  get9HexWallWalkOutlineSvgPolygonPoints,
  get9HexWallWalkSvgPolygonPointsAt00,
  getBattlementSvgPolygonPoints,
  getCastleArchShapeSvgPolygonPoints,
  getCastleCornerShapeSvgPolygonPoints,
  getCastleEndShapeSvgPolygonPoints,
  getCastleStraightShapeSvgPolygonPoints,
  getFortifiedWallSvgPolygonPoints,
  getHexagonSvgPolygonPointsAt00,
  getJungleTriangleShape,
  getLadderSvgPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
  getLaurPillarShape,
  getLaurShortWallSvgPolygonPoints,
  getLaurWallRuinSvgPolygonPoints,
  getMarvel6HexOutlineSvgPolygonPoints,
  getMarvel6HexSvgPolygonPointsAt00,
  getMarvelRuinsShapeSvgPath,
  getRoadWallSvgPolygonPoints,
  getRuins2SvgPolygonPoints,
  getRuins3SvgPolygonPoints,
  getShipBowSvgPolygonPoints,
  getShipWallSvgPolygonPoints,
} from '../pdf-svg-shared/getHexagonSvgPolygonPoints'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
  getSvgHexSubLevelBorderColor,
  getSvgHexSubLevelFillColor,
} from '../svg-map/getSvgHexColors'
import {
  type BoardHex,
  type DecodedPieceID,
  HexTerrain,
  Pieces,
  Point,
} from '../types'
import {
  HEXGRID_HEX_APOTHEM,
  OPACITY_SUBLEVEL,
  SVG_BORDER_WIDTH,
  SVG_EMPTYHEX_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
  SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
} from '../utils/constants'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'
import { svgHiveBlobD } from './svg-hive'
import { hexTextStyle, singleHexObstacleHeightTextProps } from './svgText'

// export const SvgHelperHex = () => {
//   const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
//   const { points: innerPoints } =
//     getInnerHexagonSvgPolygonPoints(SVG_HEX_RADIUS)
//   return (
//     <>
//       <polygon
//         points={points}
//         fill={'transparent'}
//         stroke="red"
//         strokeWidth={1}
//       />
//       <polygon
//         points={innerPoints}
//         fill={'transparent'}
//         stroke="blue"
//         strokeWidth={1}
//       />
//     </>
//   )
// }
export const SvgEmptyHex = ({
  hex,
}: {
  hex: BoardHex
}) => {
  const fillColor = 'white'
  const borderColor = getSvgHexBorderColor(hex)
  const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get1HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_EMPTYHEX_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgHexDecor = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  return (
    <>
      {hex.terrain === HexTerrain.snow && (
        <SvgSnowSnowflake isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.ice && (
        <SvgIceSnowflake isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.road && (
        <SvgRoadCobblestone isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.wallWalk && (
        <SvgRoadCobblestone isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.toxic && (
        <SvgToxicNuclear isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.toxicWater && (
        <SvgToxicNuclear isToxicWater isSubLevel={isSubLevel} />
      )}
      {hex.terrain === HexTerrain.wood && (
        <g transform={`rotate(${hex.isObstacleAuxiliary ? '180' : '0'})`}>
          <SvgWoodMarkings isSubLevel={isSubLevel} />
        </g>
      )}
    </>
  )
}
const SvgSnowSnowflake = ({
  isSubLevel,
}: {
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? svgSubLevelColors.snowDecor
    : svgColors.snowDecor
  return (
    <>
      <g
        transform={`scale(${0.105 * SVG_HEX_RADIUS}) translate(-28.7, -1074.2)`}
      >
        <path
          d="M32.4588 1076.05L34.0088 1075.13L33.4088 1074.78L31.8588 1075.7L29.3338 1074.24L31.8588 1072.78L33.4088 1073.7L34.0088 1073.35L32.4588 1072.43L34.0755 1071.5L33.7755 1070.98L32.1588 1071.91L32.1421 1070.11L31.5421 1070.46L31.5588 1072.26L29.0338 1073.71V1070.8L30.6005 1069.91V1069.22L29.0338 1070.11V1068.24H28.4255V1070.11L26.8671 1069.22V1069.91L28.4255 1070.8V1073.71L25.9005 1072.26L25.9171 1070.46L25.3171 1070.11L25.3005 1071.91L23.6838 1070.98L23.3838 1071.5L25.0005 1072.43L23.4505 1073.35L24.0505 1073.7L25.6005 1072.78L28.1255 1074.24L25.6005 1075.7L24.0505 1074.78L23.4505 1075.13L25.0005 1076.05L23.3838 1076.98L23.6838 1077.5L25.3005 1076.56L25.3171 1078.36L25.9171 1078.01L25.9005 1076.22L28.4255 1074.76V1077.68L26.8671 1078.56V1079.26L28.4255 1078.37V1080.24H29.0338V1078.37L30.6005 1079.26V1078.56L29.0338 1077.68V1074.76L31.5588 1076.22L31.5421 1078.01L32.1421 1078.36L32.1588 1076.56L33.7755 1077.5L34.0755 1076.98L32.4588 1076.05Z"
          fill={fillColor}
        />
      </g>
    </>
  )
}
const SvgIceSnowflake = ({
  isSubLevel,
}: {
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel ? svgSubLevelColors.iceDecor : svgColors.iceDecor
  return (
    <>
      <g
        transform={`scale(${0.105 * SVG_HEX_RADIUS}) translate(-28.7, -1074.2)`}
      >
        <path
          d="M32.4588 1076.05L34.0088 1075.13L33.4088 1074.78L31.8588 1075.7L29.3338 1074.24L31.8588 1072.78L33.4088 1073.7L34.0088 1073.35L32.4588 1072.43L34.0755 1071.5L33.7755 1070.98L32.1588 1071.91L32.1421 1070.11L31.5421 1070.46L31.5588 1072.26L29.0338 1073.71V1070.8L30.6005 1069.91V1069.22L29.0338 1070.11V1068.24H28.4255V1070.11L26.8671 1069.22V1069.91L28.4255 1070.8V1073.71L25.9005 1072.26L25.9171 1070.46L25.3171 1070.11L25.3005 1071.91L23.6838 1070.98L23.3838 1071.5L25.0005 1072.43L23.4505 1073.35L24.0505 1073.7L25.6005 1072.78L28.1255 1074.24L25.6005 1075.7L24.0505 1074.78L23.4505 1075.13L25.0005 1076.05L23.3838 1076.98L23.6838 1077.5L25.3005 1076.56L25.3171 1078.36L25.9171 1078.01L25.9005 1076.22L28.4255 1074.76V1077.68L26.8671 1078.56V1079.26L28.4255 1078.37V1080.24H29.0338V1078.37L30.6005 1079.26V1078.56L29.0338 1077.68V1074.76L31.5588 1076.22L31.5421 1078.01L32.1421 1078.36L32.1588 1076.56L33.7755 1077.5L34.0755 1076.98L32.4588 1076.05Z"
          fill={fillColor}
        />
      </g>
    </>
  )
}
const SvgRoadCobblestone = ({
  isSubLevel,
}: {
  isSubLevel?: boolean
}) => {
  const roadDecorScale = 11
  const fillColor = isSubLevel
    ? svgSubLevelColors.roadDecor
    : svgColors.roadDecor

  return (
    <>
      <g
        transform={`translate(${roadDecorScale * -28.812}, ${roadDecorScale * -2038.11}) scale(${roadDecorScale})`}
      >
        <path
          d="M26.9734 2037.14C27.6223 2037.12 28.5262 2037.8 28.7889 2038.44C29.0824 2039.18 28.6498 2040.4 28.1399 2040.95C28.0163 2041.07 26.8884 2042.03 26.8035 2042.06C26.6567 2042.1 26.5022 2042.09 26.3477 2042.06C26.0773 2042 25.0884 2041.69 24.8567 2041.56C24.6249 2041.44 24.5399 2041.25 24.4704 2041C24.37 2040.69 24.1614 2039.59 24.2695 2039.31C24.3777 2039.03 25.1502 2038.55 25.3974 2038.28C25.9459 2037.68 25.9923 2037.15 26.9811 2037.14H26.9734Z"
          fill={fillColor}
        />
        <path
          d="M29.4454 2038.67C29.2523 2038.42 28.9046 2037.32 28.9355 2037C28.951 2036.8 29.4995 2035.58 29.6385 2035.5C29.8162 2035.39 30.6737 2035.3 30.9209 2035.3C31.2145 2035.3 31.9948 2035.4 32.242 2035.53C32.5201 2035.66 33.254 2036.67 33.2308 2036.98C33.2231 2037.1 32.5741 2038.47 32.466 2038.64C31.9407 2039.48 31.5312 2039.1 30.7742 2038.99C30.3338 2038.93 29.7853 2039.1 29.4454 2038.67Z"
          fill={fillColor}
        />
        <path
          d="M26.7569 2034.12C27.0273 2034.07 28.1397 2034.06 28.3946 2034.12C28.6882 2034.19 29.0899 2034.79 29.0667 2035.11C29.0281 2035.63 28.4719 2036.8 27.9234 2036.81C27.6685 2036.81 26.9423 2036.76 26.6796 2036.72C25.9998 2036.62 26.2547 2036.23 26.2316 2035.79C26.1929 2035.18 25.9303 2034.27 26.7646 2034.12L26.7569 2034.12Z"
          fill={fillColor}
        />
        <path
          d="M30.6574 2039.38C30.9742 2039.34 32.0248 2039.71 32.2643 2039.94C32.8978 2040.57 32.3956 2041.79 31.6154 2041.86C31.1364 2041.9 30.0781 2041.46 29.6532 2041.19C29.2514 2040.94 29.2128 2040.39 29.4909 2040C29.6454 2039.79 30.418 2039.41 30.6574 2039.38V2039.38Z"
          fill={fillColor}
        />
      </g>
    </>
  )
}
const SvgWoodMarkings = ({
  isSubLevel,
}: {
  isSubLevel?: boolean
}) => {
  // const fillColor = 'black'
  const fillColor = isSubLevel ? svgSubLevelColors.cannon : svgColors.cannon

  return (
    <>
      <path
        d={genWoodPlankPath1(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).path}
        fill={fillColor}
      />
      <path
        d={genWoodPlankPath2(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).path}
        fill={fillColor}
      />
      <path
        d={genWoodPlankPath3(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).path}
        fill={fillColor}
      />
    </>
  )
}
const SvgToxicNuclear = ({
  isSubLevel,
  isToxicWater,
}: {
  isSubLevel?: boolean
  isToxicWater?: boolean
}) => {
  const toxicDecorScale = 11
  const fillColor =
    isToxicWater && isSubLevel
      ? svgSubLevelColors.toxicWaterDecor
      : isToxicWater
        ? svgColors.toxicWaterDecor
        : isSubLevel
          ? svgSubLevelColors.toxicLandDecor
          : svgColors.toxicLandDecor
  return (
    <>
      <g
        transform={`translate(${toxicDecorScale * -28.73}, ${toxicDecorScale * -1556.155}) scale(${toxicDecorScale})`}
      >
        <path
          d="M26.3712 1552.22C25.8891 1552.51 25.4843 1552.86 25.1434 1553.29C24.5812 1553.99 24.2677 1554.84 24.2354 1555.74L24.2305 1555.87H27.3811V1555.84C27.3811 1555.82 27.3846 1555.78 27.3888 1555.74C27.4331 1555.35 27.6517 1555.01 27.9897 1554.8L28.0558 1554.75L28.0354 1554.72C27.5259 1553.87 26.4864 1552.16 26.4801 1552.16C26.4752 1552.16 26.426 1552.19 26.3712 1552.22Z"
          fill={fillColor}
        />
        <path
          d="M30.7949 1552.46C30.5109 1552.93 29.4111 1554.75 29.4083 1554.75C29.4069 1554.75 29.4315 1554.77 29.4624 1554.79C29.7646 1554.98 29.9817 1555.28 30.0513 1555.61C30.0668 1555.69 30.0801 1555.79 30.0801 1555.84V1555.87H33.2308L33.2258 1555.74C33.2097 1555.3 33.1317 1554.89 32.989 1554.49C32.6713 1553.6 32.0592 1552.84 31.2362 1552.31C31.1161 1552.23 30.9924 1552.16 30.9818 1552.16C30.9776 1552.16 30.894 1552.29 30.7949 1552.46Z"
          fill={fillColor}
        />
        <path
          d="M28.6079 1555.02C28.1336 1555.08 27.7885 1555.5 27.8377 1555.95C27.8602 1556.16 27.9445 1556.33 28.0977 1556.47C28.2516 1556.62 28.4294 1556.7 28.648 1556.72C28.901 1556.75 29.1639 1556.66 29.3515 1556.49C29.6811 1556.18 29.7219 1555.7 29.4478 1555.35C29.2545 1555.11 28.9291 1554.98 28.6079 1555.02Z"
          fill={fillColor}
        />
        <path
          d="M27.6989 1557.58C26.4339 1559.67 26.4859 1559.58 26.4964 1559.59C26.5133 1559.6 26.7248 1559.71 26.8436 1559.76C27.3208 1559.97 27.798 1560.1 28.3448 1560.15C28.5198 1560.16 28.9379 1560.16 29.1164 1560.15C29.6534 1560.1 30.1348 1559.98 30.6071 1559.77C30.7083 1559.72 30.9332 1559.61 30.9592 1559.59L30.9746 1559.58L30.217 1558.33C29.8003 1557.64 29.4467 1557.05 29.432 1557.03L29.4053 1556.99L29.3223 1557.02C29.179 1557.09 29.0258 1557.13 28.8627 1557.15C28.6245 1557.18 28.3595 1557.13 28.1374 1557.02L28.0559 1556.99L27.6989 1557.58Z"
          fill={fillColor}
        />
      </g>
    </>
  )
}
export const SvgMultiHex1 = ({
  hex,
  borderWidth = SVG_BORDER_WIDTH,
  isSubLevel,
}: {
  hex: BoardHex
  borderWidth?: number
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get1HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    borderWidth,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHex2 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get2HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get2HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHex3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get3HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get3HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgCastleArchStraight3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  // Has a separate shape for the "border"
  // const borderColor = isSubLevel
  //   ? getSvgHexSubLevelBorderColor(hex)
  //   : getSvgHexBorderColor(hex)
  const { points } = get3HexStraightSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  return (
    <>
      <polygon points={points} fill={fillColor} />
    </>
  )
}
export const SvgMultiHex4 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get4HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get4HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHex5 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get5HexStraightSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get5HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}

export const SvgMultiHex6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHexMarvel6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = getMarvel6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = getMarvel6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHex7 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get7HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get7HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHexWallWalk7 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get7HexWallWalkSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get7HexWallWalkOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHexWallWalk9 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get9HexWallWalkSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get9HexWallWalkOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgMultiHex24 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const { points } = get24HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get24HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <polygon points={points} fill={fillColor} />
      {isSubLevel && <polygon points={outlinePoints} fill={'white'} />}
      <polygon points={outlinePoints} fill={borderColor} />
    </>
  )
}
export const SvgLaurPillar = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const laurSquarePoints = getLaurPillarShape(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  ).squarePoints
  const laurTrianglePoints = getLaurPillarShape(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  ).trianglePoints
  const innerShapePoints =
    hex.inventoryID === Pieces.laurWallTrianglePillar
      ? laurTrianglePoints
      : laurSquarePoints
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      {/* FULL HEX */}
      <SvgMultiHex1
        hex={hex}
        isSubLevel={isSubLevel}
        borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
      />
      <g transform={`rotate(${pieceRotation})`}>
        {/*  LAUR SQUARE/TRIANGLE BELOW */}
        <polygon points={innerShapePoints} fill={borderColor} />
      </g>
    </>
  )
}
export const SvgJungle = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const pieceHeightText = piecesSoFar[hex.inventoryID]?.height
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  const points = getJungleTriangleShape(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).points
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const textColor = isSubLevel
    ? svgSubLevelColors.jungleText
    : svgColors.jungleText
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        {/* JUNGLE ORIENTATION MARKER */}
        <polygon points={points} fill={borderColor} />
      </g>
      <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
        {pieceHeightText}
      </text>
    </>
  )
}
export const SvgHive6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = getSvgHexBorderColor(hex)
  const { points } = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* Inner blob made in Inkscape, so not dynamic yet */}
      {isSubLevel && (
        <path
          d={svgHiveBlobD}
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 2.4}
          transform={`translate(${-2 * SVG_HEX_APOTHEM},${-SVG_HEX_RADIUS})`}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      )}
      <path
        d={svgHiveBlobD}
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2.4}
        transform={`translate(${-2 * SVG_HEX_APOTHEM},${-SVG_HEX_RADIUS})`}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* Little marro bubbles made in Inkscape, so not dynamic yet */}
      {isSubLevel && (
        <ellipse
          fill={'transparent'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 4}
          opacity={1}
          cx="9.4113"
          cy="82.45652"
          rx="16.650465"
          ry="10.742236"
        />
      )}
      <ellipse
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="9.4113"
        cy="82.45652"
        rx="16.650465"
        ry="10.742236"
      />
      {isSubLevel && (
        <ellipse
          fill={'transparent'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 4}
          opacity={1}
          cx="12.63397"
          cy="101.25543"
          rx="14.502019"
          ry="8.5937881"
        />
      )}
      <ellipse
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="12.63397"
        cy="101.25543"
        rx="14.502019"
        ry="8.5937881"
      />
      {isSubLevel && (
        <ellipse
          fill={'transparent'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 2.8}
          opacity={1}
          cx="49.15758"
          cy="77.35397"
          rx="25.244253"
          ry="12.622127"
        />
      )}
      <ellipse
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2.8}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="49.15758"
        cy="77.35397"
        rx="25.244253"
        ry="12.622127"
      />
      {isSubLevel && (
        <ellipse
          fill={'transparent'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 3.6}
          opacity={1}
          cx="49.96326"
          cy="98.30132"
          rx="23.901474"
          ry="8.3252325"
        />
      )}
      <ellipse
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 3.6}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="49.96326"
        cy="98.30132"
        rx="23.901474"
        ry="8.3252325"
      />
    </>
  )
}
export const SvgRuins2 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const { path } = getRuins2SvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <>
      {isSubLevel && (
        <path
          d={path}
          fill="transparent"
          stroke={'white'}
          strokeWidth={SVG_HEX_RADIUS / 5}
        />
      )}
      <path
        d={path}
        fill="transparent"
        stroke={fillColor}
        strokeWidth={SVG_HEX_RADIUS / 5}
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
      />
    </>
  )
}
export const SvgRuins3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const { path } = getRuins3SvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <>
      {isSubLevel && (
        <path
          d={path}
          fill="transparent"
          stroke={'white'}
          strokeWidth={SVG_HEX_RADIUS / 5}
        />
      )}
      <path
        d={path}
        fill="transparent"
        stroke={fillColor}
        strokeWidth={SVG_HEX_RADIUS / 5}
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
      />
    </>
  )
}
export const SvgFortifiedWall = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const { points } = getFortifiedWallSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )

  return <polygon points={points} fill={fillColor} />
}
export const SvgMarvelRuin = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const { path } = getMarvelRuinsShapeSvgPath(SVG_HEX_RADIUS)

  return (
    <>
      {isSubLevel && (
        <path
          d={path}
          stroke={'white'}
          fillOpacity={0}
          strokeWidth={2 * SVG_BORDER_WIDTH}
        />
      )}
      <path
        d={path}
        fillOpacity={0}
        stroke={fillColor}
        strokeWidth={2 * SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgBoardPieceLaurWallShort = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const { points } = getLaurShortWallSvgPolygonPoints(SVG_HEX_RADIUS)
  return <polygon points={points} fill={fillColor} />
}
export const SvgBoardPieceLaurWallLong = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const { points } = getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS)
  return <polygon points={points} fill={fillColor} />
}
export const SvgBoardPieceLaurWallLongArch = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const { points } = getLaurLongWallSvgPolygonPoints(SVG_HEX_RADIUS)
  return <polygon points={points} fill={fillColor} />
}
export const SvgLaurWallArchText = ({
  isSubLevel,
  pieceRotation,
}: {
  isSubLevel: boolean
  pieceRotation: number
}) => {
  const archText = 'ARCH'
  const textColor = isSubLevel
    ? svgSubLevelColors.evergreenText
    : svgColors.evergreenText
  // rotations that are hard to read: 150, 210
  return (
    <text
      fill={textColor}
      style={{
        fontSize: 0.55 * SVG_HEX_RADIUS,
        letterSpacing: 6,
        // fontFamily: 'Inter',
        fontFamily: 'Inter, Arial, Helvetica, sans-serif',
        fontWeight: 600,
      }}
      // {...singleHexObstacleHeightTextProps()}
      y={0.2 * SVG_HEX_RADIUS}
      // upside down text is flipped in parent component, and adjusted here
      x={
        pieceRotation === 150 || pieceRotation === 210
          ? -2.75 * SVG_HEX_APOTHEM
          : 0.65 * SVG_HEX_APOTHEM
      }
    >
      {/* TODO: International: this style will need adjustment for international/other languages, where char length changes */}
      {archText}
    </text>
  )
}
export const SvgBoardPieceLaurWallRuin = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const { points } = getLaurWallRuinSvgPolygonPoints(SVG_HEX_RADIUS)
  return <polygon points={points} fill={fillColor} />
}
export const SvgRoadWall = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const { points } = getRoadWallSvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return <polygon points={points} fill={fillColor} />
}
export const SvgBattlement = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(piece)
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getBattlementSvgPolygonPoints(SVG_HEX_RADIUS, 0)
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 2}
        />
      )}
      <polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgLadder = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  // const borderColor = getSvgHexBorderColor(hex)
  const { points } = getLadderSvgPolygonPoints(SVG_HEX_RADIUS, 0)
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <polygon
        points={points}
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgStartZone = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  // const borderColor = getSvgHexBorderColor(hex)
  return (
    <>
      {isSubLevel && <polygon points={points} fill={'white'} />}
      <polygon
        points={points}
        fill={fillColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* <circle
        r={SVG_HEX_RADIUS / 2}
        // points={points}
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      /> */}
    </>
  )
}
export const SvgCastleCorner = ({
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  const { points } = getCastleCornerShapeSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgCastleStraight = ({
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  const { points } = getCastleStraightShapeSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgCastleEnd = ({
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  // const borderColor = getSvgHexBorderColor(hex)
  const { points } = getCastleEndShapeSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          // borderWidth={SVG_BORDER_WIDTH / 4}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgCastleArch = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  const { points } = getCastleArchShapeSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const archText = 'D O O R'
  const textColor = isSubLevel
    ? svgSubLevelColors.jungleText
    : svgColors.jungleText
  const isFlippedText =
    pieceRotation === 180 || pieceRotation === 120 || pieceRotation === 240
  return (
    <g transform={`rotate(${pieceRotation})`}>
      <SvgCastleArchStraight3 hex={hex} isSubLevel={isSubLevel} />
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      <g
        // flip upside down text, all other rotations are legible
        transform={isFlippedText ? 'rotate(-180)' : 'rotate(0)'}
      >
        <text
          fill={textColor}
          {...singleHexObstacleHeightTextProps()}
          x={isFlippedText ? -2 * SVG_HEX_APOTHEM : 2 * SVG_HEX_APOTHEM}
        >
          {archText}
        </text>
      </g>
    </g>
  )
}

export const SvgShipWall = ({
  hex,
  isSubLevel,
  pieceRotation,
}: {
  hex: BoardHex
  isSubLevel?: boolean
  pieceRotation: number
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const { points } = getShipWallSvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <g transform={`rotate(${pieceRotation})`}>
      <polygon points={points} fill={fillColor} />
    </g>
  )
}
export const SvgShipBow = ({
  hex,
  isSubLevel,
  pieceRotation,
}: {
  hex: BoardHex
  isSubLevel?: boolean
  pieceRotation: number
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const { points } = getShipBowSvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <g transform={`rotate(${pieceRotation})`}>
      <polygon points={points} fill={fillColor} />
    </g>
  )
}

export const SvgCannon = ({
  hex,
  isSubLevel,
  pieceRotation,
}: {
  hex: BoardHex
  pieceRotation: number
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const arrowColor = '#FFFFFF'

  const iconRadius = SVG_HEX_RADIUS * 0.5
  const iconDiameter = iconRadius * 2
  // renegade spec svg: arrow width is 12, circle width is 17.46
  const arrowWidth = iconDiameter * (12 / 17.46)
  return (
    <>
      <circle fill={fillColor} r={iconRadius} />
      <path
        fill={arrowColor}
        // d={generateArrowPath(SVG_HEX_RADIUS * 0.8)}
        d={generateArrowPath(arrowWidth)}
        transform={`rotate(${pieceRotation})`}
      />
    </>
  )
}

export const SvgRopeLadder = ({
  piece,
  isSubLevel,
  pieceRotation,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
  pieceRotation: number
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(piece)
    : getSvgHexFillColor(piece)
  const arrowColor = '#FFFFFF'

  const iconRadius = SVG_HEX_RADIUS * 0.4
  const iconDiameter = iconRadius * 2
  // renegade spec svg: arrow width is 12, circle width is 17.46
  // const arrowWidth = (iconDiameter * (12 / 17.46))
  const arrowWidth = iconDiameter / 1.3
  return (
    <g transform={`rotate(${pieceRotation})`}>
      <g transform={`translate(${SVG_HEX_APOTHEM},0)`}>
        {/* Placeholder until custom rope-ladder 2D geometry is added. */}
        <rect
          fill={fillColor}
          width={iconDiameter}
          height={iconDiameter}
          x={-iconDiameter / 2}
          y={-iconDiameter / 2}
        />
        <path
          fill={arrowColor}
          // d={generateArrowPath(SVG_HEX_RADIUS * 0.8)}
          d={generateArrowPath(arrowWidth)}
          transform={'translate(0, -17)'}
        />
        <path
          fill={arrowColor}
          // d={generateArrowPath(SVG_HEX_RADIUS * 0.8)}
          d={generateArrowPath(arrowWidth)}
          transform={'translate(-0, 15),rotate(180)'}
        />
      </g>
    </g>
  )
}

const treeXYForRotation = [
  { x: 0.9 * SVG_HEX_APOTHEM, y: SVG_HEX_RADIUS },
  { x: -0.6 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS },
  { x: -2.1 * SVG_HEX_APOTHEM, y: 1 * SVG_HEX_RADIUS },
  { x: -2 * SVG_HEX_APOTHEM, y: -0.5 * SVG_HEX_RADIUS },
  { x: -0.6 * SVG_HEX_APOTHEM, y: -1.3 * SVG_HEX_RADIUS },
  { x: 0.9 * SVG_HEX_APOTHEM, y: -0.4 * SVG_HEX_RADIUS },
]
export const SvgTree415 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const pieceHeightText = piecesSoFar[hex.inventoryID].height
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const textColor = isSubLevel
    ? svgSubLevelColors.evergreenText
    : svgColors.evergreenText
  const { points } = get4HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get4HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        <polygon points={points} fill={fillColor} />
        <polygon points={outlinePoints} fill={borderColor} />
      </g>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={{
          ...singleHexObstacleHeightTextProps().style,
        }}
        x={treeXYForRotation?.[hex?.pieceRotation]?.x ?? 0}
        y={treeXYForRotation?.[hex?.pieceRotation]?.y ?? 0}
      >
        {pieceHeightText}
      </text>
    </>
  )
}
const posO3_1 = { x: -0.3 * SVG_HEX_APOTHEM, y: 0.3 * SVG_HEX_RADIUS }
const posO3_2 = { x: 2 * SVG_HEX_APOTHEM, y: 0 }
const posO3_3 = { x: 1 * SVG_HEX_APOTHEM, y: 1.5 * SVG_HEX_RADIUS }
const posO3_4 = { x: -1 * SVG_HEX_APOTHEM, y: 1.5 * SVG_HEX_RADIUS }
const posO3_5 = { x: -2 * SVG_HEX_APOTHEM, y: 0 }
const posO3_6 = { x: -1 * SVG_HEX_APOTHEM, y: -1.5 * SVG_HEX_RADIUS }
const posO3_7 = { x: 1 * SVG_HEX_APOTHEM, y: -1.5 * SVG_HEX_RADIUS }

// The 4-glacier has one more text spot than 3-glacier
const posO4_1 = { x: 3 * SVG_HEX_APOTHEM, y: 1.5 * SVG_HEX_RADIUS }
const posO4_2 = { x: 0, y: 3 * SVG_HEX_RADIUS }
const posO4_3 = { x: -3 * SVG_HEX_APOTHEM, y: 1.5 * SVG_HEX_RADIUS }
const posO4_4 = { x: -3 * SVG_HEX_APOTHEM, y: -1.5 * SVG_HEX_RADIUS }
const posO4_5 = { x: 0, y: -3 * SVG_HEX_RADIUS }
const posO4_6 = { x: 3 * SVG_HEX_APOTHEM, y: -1.5 * SVG_HEX_RADIUS }

// The 6-glacier has two more text spots than 4-glacier, but some are reused
const posO6_1_1 = { x: 4 * SVG_HEX_APOTHEM, y: 0 } // top right of glacier
const posO6_2_1 = { x: -1 * SVG_HEX_APOTHEM, y: 1.5 * SVG_HEX_RADIUS } // bottom left
const posO6_2_2 = { x: 2 * SVG_HEX_APOTHEM, y: 3 * SVG_HEX_RADIUS }
const posO6_2_3 = { x: -2 * SVG_HEX_APOTHEM, y: 3 * SVG_HEX_RADIUS }
const posO6_2_4 = { x: -4 * SVG_HEX_APOTHEM, y: 0 }
const posO6_1_5 = { x: -2 * SVG_HEX_APOTHEM, y: -3 * SVG_HEX_RADIUS }
const posO6_1_6 = { x: 2 * SVG_HEX_APOTHEM, y: -3 * SVG_HEX_RADIUS }

const outcrop3TextXYForRotation = [
  [posO3_1, posO3_2, posO3_3],
  [posO3_1, posO3_3, posO3_4],
  [posO3_1, posO3_4, posO3_5],
  [posO3_1, posO3_5, posO3_6],
  [posO3_1, posO3_6, posO3_7],
  [posO3_1, posO3_7, posO3_2],
]
const outcrop4TextXYForRotation = [
  [posO3_1, posO3_2, posO3_3, posO4_1],
  [posO3_1, posO3_3, posO3_4, posO4_2],
  [posO3_1, posO3_4, posO3_5, posO4_3],
  [posO3_1, posO3_5, posO3_6, posO4_4],
  [posO3_1, posO3_6, posO3_7, posO4_5],
  [posO3_1, posO3_7, posO3_2, posO4_6],
]
const outcrop6TextXYForRotation = [
  [posO3_1, posO3_2, posO3_3, posO4_1, posO6_1_1, posO6_2_1],
  [posO3_1, posO3_3, posO3_4, posO4_2, posO3_5, posO6_2_2],
  [posO3_1, posO3_4, posO3_5, posO4_3, posO3_6, posO6_2_3],
  [posO3_1, posO3_5, posO3_6, posO4_4, posO3_7, posO6_2_4],
  [posO3_1, posO3_6, posO3_7, posO4_5, posO6_1_5, posO3_2],
  [posO3_1, posO3_7, posO3_2, posO4_6, posO6_1_6, posO3_3],
]
export const getOutcropTextColor = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const subLevelTextColor =
    hex.terrain === HexTerrain.glacier
      ? svgSubLevelColors.glacierText
      : hex.terrain === HexTerrain.outcrop
        ? svgSubLevelColors.outcropText
        : svgSubLevelColors.lavaRockOutcropText
  const currentLevelTextColor =
    hex.terrain === HexTerrain.glacier
      ? svgColors.glacierText
      : hex.terrain === HexTerrain.outcrop
        ? svgColors.outcropText
        : svgColors.lavaRockOutcropText
  const textColor = isSubLevel ? subLevelTextColor : currentLevelTextColor
  return textColor
}
export const SvgOutcrop6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const textColor = getOutcropTextColor({ hex, isSubLevel })
  const { points } = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        <polygon points={points} fill={fillColor} />
        <polygon points={outlinePoints} fill={borderColor} />
      </g>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        // {...singleHexObstacleHeightTextProps()}
        // x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        // y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[5]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[5]?.y ?? 0}
      >
        {'17'}
      </text>
    </>
  )
}
export const SvgOutcrop3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const textColor = getOutcropTextColor({ hex, isSubLevel })
  const { points } = get3HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get3HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        <polygon points={points} fill={fillColor} />
        <polygon points={outlinePoints} fill={borderColor} />
      </g>
      <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
        {'5'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'7'}
      </text>
    </>
  )
}
export const SvgOutcrop4 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const textColor = getOutcropTextColor({ hex, isSubLevel })
  const { points } = get4HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get4HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        <polygon points={points} fill={fillColor} />
        <polygon points={outlinePoints} fill={borderColor} />
      </g>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        // x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        // y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'7'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'11'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'11'}
      </text>
      <text
        fill={textColor}
        {...singleHexObstacleHeightTextProps()}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </text>
    </>
  )
}
const SvgSubLevelWhiteBackerPolygon = ({
  points,
}: { points: string; borderWidth?: number }) => {
  return <polygon points={points} fill={'white'} />
}

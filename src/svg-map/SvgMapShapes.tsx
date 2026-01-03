import { piecesSoFar } from '../data/pieces'
import {
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
} from '../types'
import {
  OPACITY_SUBLEVEL,
  SVG_BORDER_WIDTH,
  SVG_EMPTYHEX_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
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
export const SvgMultiHex1 = ({
  hex,
  isSubLevel,
  isGlyph,
}: {
  hex: BoardHex
  isSubLevel?: boolean
  isGlyph?: boolean
}) => {
  const fillColor = isSubLevel
    ? getSvgHexSubLevelFillColor(hex)
    : getSvgHexFillColor(hex)
  const borderColor = isSubLevel
    ? getSvgHexSubLevelBorderColor(hex)
    : getSvgHexBorderColor(hex)
  const glyphHexRadius = SVG_HEX_RADIUS / 2
  const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: glyphPoints } = getHexagonSvgPolygonPointsAt00(glyphHexRadius)
  const { points: outlinePoints } = get1HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && (
        <SvgSubLevelWhiteBackerPolygon
          // glyphs are rendered a little smaller
          points={isGlyph ? glyphPoints : points}
        />
      )}
      <polygon
        // glyphs are rendered a little smaller
        points={isGlyph ? glyphPoints : points}
        fill={fillColor}
      />
      {/* glyphs rendered with no outline */}
      {isGlyph ? null : <polygon points={outlinePoints} fill={borderColor} />}
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
      />
      {isSubLevel && <polygon points={outlinePoints} fill={'white'} />}
      <polygon
        points={outlinePoints}
        fill={borderColor}
      />
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
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points: fullHexPoints } =
    getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS)
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
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={fullHexPoints} />}
      {/* FULL HEX */}
      <polygon
        points={fullHexPoints}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      <g transform={`rotate(${pieceRotation})`}>
        {/*  LAUR SQUARE/TRIANGLE BELOW */}
        {isSubLevel && (
          <SvgSubLevelWhiteBackerPolygon
            points={innerShapePoints}
            borderWidth={0}
          />
        )}
        {/* TODO: redo innerShapePoints per master svg file */}
        <polygon
          points={innerShapePoints}
          fill={borderColor}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
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
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        {/* JUNGLE ORIENTATION MARKER */}
        <polygon
          points={points}
          fill={borderColor}
        />
      </g>
      <text
        // fill="rgb(35, 31, 32)"
        fill={textColor}
        {...singleHexObstacleHeightTextProps(pieceHeightText.toString())}
      >
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
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
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
export const SvgMarvelRuin = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  // const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
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
  const fillColor = getSvgHexFillColor(piece)
  const { points } = getLaurShortWallSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
        stroke={fillColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgBoardPieceLaurWallLong = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getLaurLongWallSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={borderColor} // RENEGADE: they have all border color, community might want regular fill
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgBoardPieceLaurWallLongArch = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getLaurLongWallSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={'transparent'}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgBoardPieceLaurWallRuin = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getLaurWallRuinSvgPolygonPoints(
    SVG_HEX_RADIUS,
    // SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={borderColor} // Renegade just does a pink rectangle
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const SvgRoadWall = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(piece)
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getRoadWallSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )

  return (
    <>
      {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
      <polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
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
  // const borderColor = getSvgHexBorderColor(hex)
  return (
    <>
      {isSubLevel && (
        <circle
          r={SVG_HEX_RADIUS / 2}
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <circle
        r={SVG_HEX_RADIUS / 2}
        // points={points}
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
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
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  // const borderColor = getSvgHexBorderColor(hex)
  const { points } = getCastleArchShapeSvgPolygonPoints(
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
const twoCharNumberAdjust = -0.15 * SVG_HEX_RADIUS
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
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get4HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get4HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
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
      </g>
      <text
        fill={svgColors.evergreenText}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={{
          ...singleHexObstacleHeightTextProps(pieceHeightText.toString()).style,
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
const posO3_2 = { x: 1.7 * SVG_HEX_APOTHEM, y: 0.3 * SVG_HEX_RADIUS }
const posO3_3 = { x: 0.7 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS }
const posO3_4 = { x: -1.3 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS }
const posO3_5 = { x: -2.3 * SVG_HEX_APOTHEM, y: 0.3 * SVG_HEX_RADIUS }
const posO3_6 = { x: -1.3 * SVG_HEX_APOTHEM, y: -1.2 * SVG_HEX_RADIUS }
const posO3_7 = { x: 0.7 * SVG_HEX_APOTHEM, y: -1.2 * SVG_HEX_RADIUS }

// The 4-glacier has one more text spot than 3-glacier
const posO4_1 = { x: 2.7 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS }
const posO4_2 = { x: -0.2 * SVG_HEX_APOTHEM, y: 3.3 * SVG_HEX_RADIUS }
const posO4_3 = { x: -3.2 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS }
const posO4_4 = { x: -3.2 * SVG_HEX_APOTHEM, y: -1.2 * SVG_HEX_RADIUS }
const posO4_5 = { x: -0.3 * SVG_HEX_APOTHEM, y: -2.7 * SVG_HEX_RADIUS }
const posO4_6 = { x: 2.7 * SVG_HEX_APOTHEM, y: -1.2 * SVG_HEX_RADIUS }

// The 6-glacier has two more text spots than 4-glacier, but some are reused
const posO6_1_1 = { x: 3.6 * SVG_HEX_APOTHEM, y: 0.3 * SVG_HEX_RADIUS } // top right of glacier
const posO6_2_1 = { x: -1.3 * SVG_HEX_APOTHEM, y: 1.7 * SVG_HEX_RADIUS } // bottom left
const posO6_2_2 = { x: 1.7 * SVG_HEX_APOTHEM, y: 3.3 * SVG_HEX_RADIUS }
const posO6_2_3 = { x: -2.3 * SVG_HEX_APOTHEM, y: 3.3 * SVG_HEX_RADIUS }
const posO6_2_4 = { x: -4.3 * SVG_HEX_APOTHEM, y: 0.3 * SVG_HEX_RADIUS }
const posO6_1_5 = { x: -2.3 * SVG_HEX_APOTHEM, y: -2.7 * SVG_HEX_RADIUS }
const posO6_1_6 = { x: 1.7 * SVG_HEX_APOTHEM, y: -2.7 * SVG_HEX_RADIUS }

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
export const SvgOutcrop6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const textColor =
    hex.terrain === HexTerrain.glacier
      ? 'black'
      : hex.terrain === HexTerrain.outcrop
        ? svgColors.outcropText
        : svgColors.lavaRockOutcropText
  const { points } = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get6HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
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
      </g>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.y ?? 0}
      >
        {'17'}
      </text>
      <text
        fill={textColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[5]?.x ?? 0) +
          twoCharNumberAdjust
        }
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
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const textColor =
    hex.terrain === HexTerrain.glacier
      ? 'black'
      : hex.terrain === HexTerrain.outcrop
        ? svgColors.outcropText
        : svgColors.lavaRockOutcropText
  const { points } = get3HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get3HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
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
      </g>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        // white text (not glaciers, so far) needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'5'}
      </text>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        // white text (not glaciers, so far) needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        // white text (not glaciers, so far) needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
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
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const textColor =
    hex.terrain === HexTerrain.glacier
      ? 'black'
      : hex.terrain === HexTerrain.outcrop
        ? svgColors.outcropText
        : svgColors.lavaRockOutcropText
  const { points } = get4HexSvgPolygonPointsAt00(SVG_HEX_RADIUS)
  const { points: outlinePoints } = get4HexOutlineSvgPolygonPoints(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
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
      </g>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'7'}
      </text>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
        x={
          (outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'11'}
      </text>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
        x={
          (outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'11'}
      </text>
      <text
        fill={textColor}
        // white text needs a little opacity boost
        opacity={
          isSubLevel
            ? hex.terrain === HexTerrain.glacier
              ? OPACITY_SUBLEVEL
              : OPACITY_SUBLEVEL * 2
            : 1
        }
        style={hexTextStyle}
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

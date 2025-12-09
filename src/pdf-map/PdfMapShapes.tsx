import { Circle, Ellipse, G, Path, Polygon, Text } from '@react-pdf/renderer'
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
  getMarvel6HexSvgPolygonPointsAt00,
  getMarvelRuinsShapeSvgPath,
  getRoadWallSvgPolygonPoints,
  getRuins2SvgPolygonPoints,
  getRuins3SvgPolygonPoints,
} from '../pdf-svg-shared/getHexagonSvgPolygonPoints'
import {
  getSvgHexBorderColor,
  getSvgHexFillColor,
} from '../svg-map/getSvgHexColors'
import {
  type BoardHex,
  type DecodedPieceID,
  HexTerrain,
  Pieces,
} from '../types'
import {
  OPACITY_EMPTY,
  OPACITY_SUBLEVEL,
  SVG_BORDER_WIDTH,
  SVG_EMPTYHEX_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { hexTerrainColor, svgColors } from '../world/maphex/hexColors'
import { svgHiveBlobD } from '../svg-map/svg-hive'
import {
  hexTextStyle,
  singleHexObstacleHeightTextProps,
} from '../svg-map/svgText'

export const PdfEmptyHex = () => {
  const fillColor = 'white'
  const borderColor = 'black'
  const borderWidth = SVG_EMPTYHEX_BORDER_WIDTH
  const { points } = getHexagonSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
  )
  return (
    <>
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
        opacity={OPACITY_EMPTY}
      />
    </>
  )
}

export const PdfMultiHex1 = ({
  hex,
  isSubLevel,
  isGlyph,
}: {
  hex: BoardHex
  isSubLevel?: boolean
  isGlyph?: boolean
}) => {
  const isEmptyHex = hex.terrain === 'empty'
  const fillColor = isEmptyHex ? 'white' : getSvgHexFillColor(hex)
  const borderColor =
    SVG_BORDER_WIDTH > 0
      ? isGlyph
        ? fillColor
        : getSvgHexBorderColor(hex)
      : ''
  const glyphHexRadius = SVG_HEX_RADIUS / 1.4
  const { points } = getHexagonSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
  )
  const { points: glyphPoints } = getHexagonSvgPolygonPointsAt00(
    glyphHexRadius,
  )
  return (
    <>
      {isSubLevel && (
        <PdfSubLevelWhiteBackerPolygon
          points={isGlyph ? glyphPoints : points}
        />
      )}
      <Polygon
        points={isGlyph ? glyphPoints : points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex2 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get2HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get3HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfCastleArchStraight3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get3HexStraightSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex4 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get4HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex5 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get5HexStraightSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get6HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHexMarvel6 = ({
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  // const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = getMarvel6HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        // fill={fillColor}
        fill={'rgb(220, 220, 220)'}
        // stroke={borderColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex7 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get7HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHexWallWalk7 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get7HexWallWalkSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHexWallWalk9 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get9HexWallWalkSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHex24 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get24HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}

export const PdfJungle = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const pieceHeightText = piecesSoFar[hex.inventoryID]?.height
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  // const points = getJungleTriangleShape(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).points
  return (
    <>
      <G transform={`rotate(${pieceRotation})`}>
        <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        {/* renegade-hexoscape omits the triangle (which represents cactus orientation) for now */}
        {/* <Polygon
          points={points}
          fill={svgColors.outlineJungle}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        /> */}
      </G>
      <Text
        fill="rgb(35, 31, 32)"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        {...singleHexObstacleHeightTextProps(pieceHeightText.toString())}
      >
        {pieceHeightText}
      </Text>
    </>
  )
}
export const PdfLaurPillar = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points: fullHexPoints } = getHexagonSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
  )
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={fullHexPoints} />}
      {/* FULL HEX */}
      <Polygon
        points={fullHexPoints}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      <G transform={`rotate(${pieceRotation})`}>
        {/*  LAUR SQUARE/TRIANGLE BELOW */}
        {isSubLevel && (
          <PdfSubLevelWhiteBackerPolygon
            points={innerShapePoints}
            borderWidth={SVG_BORDER_WIDTH / 2}
          />
        )}
        <Polygon
          points={innerShapePoints}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH / 2}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </G>
    </>
  )
}

export const PdfHive6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get6HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {isSubLevel && (
        <Path
          d={svgHiveBlobD}
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 1.2}
          transform={`translate(${-2 * SVG_HEX_APOTHEM},${-SVG_HEX_RADIUS})`}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      )}
      <Path
        d={svgHiveBlobD}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 1.2}
        transform={`translate(${-2 * SVG_HEX_APOTHEM},${-SVG_HEX_RADIUS})`}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />

      {isSubLevel && (
        <Ellipse
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 2}
          opacity={1}
          cx="9.4113"
          cy="82.45652"
          rx="16.650465"
          ry="10.742236"
        />
      )}
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="9.4113"
        cy="82.45652"
        rx="16.650465"
        ry="10.742236"
      />

      {isSubLevel && (
        <Ellipse
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 2}
          opacity={1}
          cx="12.63397"
          cy="101.25543"
          rx="14.502019"
          ry="8.5937881"
        />
      )}
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="12.63397"
        cy="101.25543"
        rx="14.502019"
        ry="8.5937881"
      />

      {isSubLevel && (
        <Ellipse
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 1.4}
          opacity={1}
          cx="49.15758"
          cy="77.35397"
          rx="25.244253"
          ry="12.622127"
        />
      )}
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 1.4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="49.15758"
        cy="77.35397"
        rx="25.244253"
        ry="12.622127"
      />

      {isSubLevel && (
        <Ellipse
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 1.8}
          opacity={1}
          cx="49.96326"
          cy="98.30132"
          rx="23.901474"
          ry="8.3252325"
        />
      )}
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 1.8}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="49.96326"
        cy="98.30132"
        rx="23.901474"
        ry="8.3252325"
      />
    </>
  )
}
export const PdfSvgRuins2 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  // const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  // const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  const { path } = getRuins2SvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <>
      {isSubLevel && (
        <Path d={path} stroke={'white'} strokeWidth={SVG_HEX_RADIUS / 5} />
      )}
      <Path
        d={path}
        stroke={fillColor}
        strokeWidth={SVG_HEX_RADIUS / 5}
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
      />
    </>
  )
}
export const PdfSvgRuins3 = ({
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
        <Path d={path} stroke={'white'} strokeWidth={SVG_HEX_RADIUS / 5} />
      )}
      <Path
        d={path}
        stroke={fillColor}
        strokeWidth={SVG_HEX_RADIUS / 5}
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
      />
    </>
  )
}
export const PdfMarvelRuin = ({
  // hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  // const fillColor = getSvgHexFillColor(hex)
  const fillColorSub = svgColors.outlineCastleWall
  // const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { path } = getMarvelRuinsShapeSvgPath(SVG_HEX_RADIUS)

  return (
    <>
      {isSubLevel && (
        <Path d={path} stroke={'white'} strokeWidth={2 * SVG_BORDER_WIDTH} />
      )}
      <Path
        d={path}
        stroke={fillColorSub}
        strokeWidth={2 * SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfBoardPieceLaurWallShort = ({
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={fillColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfBoardPieceLaurWallLong = ({
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={borderColor} // RENEGADE: they have all border color, community might want regular fill
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfBoardPieceLaurWallLongArch = ({
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        // fill={borderColor} // RENEGADE: they have all border color, community might want regular fill
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfBoardPieceLaurWallRuin = ({
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={borderColor} // Renegade just does a pink rectangle
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfRoadWall = ({
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
      {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfBattlement = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 2}
        />
      )}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfLadder = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfStartZone = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  // const borderColor = getSvgHexBorderColor(hex)
  // const { points } = getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS, 0)
  return (
    <>
      {/* Renegade style start zones, full hex coverage, below, show as one level for exactness */}
      {/* {isSubLevel && (
        <Polygon
          points={points}
          fill={'white'}
        />
      )}
      <Polygon
        points={points}
        fill={fillColor}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      /> */}
      {isSubLevel && (
        <Circle
          r={SVG_HEX_RADIUS / 2}
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Circle
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
export const PdfCastleCorner = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfCastleStraight = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfCastleEnd = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          // borderWidth={SVG_BORDER_WIDTH / 4}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Polygon
        points={points}
        fill={svgColors.castleInterior}
        stroke={svgColors.castleInterior}
        strokeWidth={SVG_BORDER_WIDTH / 4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfCastleArch = ({
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
        <PdfSubLevelWhiteBackerPolygon
          points={points}
          // borderWidth={SVG_BORDER_WIDTH / 4}
          borderWidth={SVG_BORDER_WIDTH / 4}
        />
      )}
      <Polygon
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
export const PdfSvgTree415 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const pieceHeightText = piecesSoFar[hex.inventoryID].height
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get4HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <G transform={`rotate(${pieceRotation})`}>
        {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
        <Polygon
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </G>
      <Text
        fill="white"
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={{
          ...singleHexObstacleHeightTextProps(pieceHeightText.toString()).style,
        }}
        x={treeXYForRotation?.[hex?.pieceRotation]?.x ?? 0}
        y={treeXYForRotation?.[hex?.pieceRotation]?.y ?? 0}
      >
        {pieceHeightText}
      </Text>
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
export const PdfSvgOutcrop6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get6HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <G transform={`rotate(${pieceRotation})`}>
        {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
        <Polygon
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </G>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'9'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'17'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'17'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[4]?.y ?? 0}
      >
        {'17'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        style={hexTextStyle}
        x={
          (outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[5]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[5]?.y ?? 0}
      >
        {'17'}
      </Text>
    </>
  )
}
export const PdfSvgOutcrop3 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get3HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <G transform={`rotate(${pieceRotation})`}>
        {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
        <Polygon
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </G>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
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
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
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
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
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
      </Text>
    </>
  )
}
export const PdfSvgOutcrop4 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = get4HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  return (
    <>
      <G transform={`rotate(${pieceRotation})`}>
        {isSubLevel && <PdfSubLevelWhiteBackerPolygon points={points} />}
        <Polygon
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </G>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'7'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={
          (outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'11'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={
          (outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0) +
          twoCharNumberAdjust
        }
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'11'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop4TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </Text>
    </>
  )
}
const PdfSubLevelWhiteBackerPolygon = ({
  points,
  borderWidth,
}: { points: string; borderWidth?: number }) => {
  return (
    <Polygon
      points={points}
      fill={'white'}
      stroke={'white'}
      strokeWidth={borderWidth ?? SVG_BORDER_WIDTH}
    />
  )
}

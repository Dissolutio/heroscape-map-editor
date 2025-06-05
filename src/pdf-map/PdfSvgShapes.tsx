import { Ellipse, G, Path, Polygon, Text } from '@react-pdf/renderer'
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
  getHexagonSvgPolygonPointsAt00,
  getLadderSvgPolygonPoints,
  getLaurLongWallSvgPolygonPoints,
  getLaurShortWallSvgPolygonPoints,
  getLaurWallRuinSvgPolygonPoints,
  getMarvel6HexSvgPolygonPointsAt00,
  getRoadWallSvgPolygonPoints,
  getRuins2SvgPolygonPoints,
  getRuins3SvgPolygonPoints,
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

export const PdfEmptyHex = () => {
  const fillColor = 'white'
  const borderColor = 'black'
  const borderWidth = SVG_EMPTYHEX_BORDER_WIDTH
  const { points } = getHexagonSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_EMPTYHEX_BORDER_WIDTH,
  )
  return (
    <>
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
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
    SVG_BORDER_WIDTH,
  )
  const { points: glyphPoints } = getHexagonSvgPolygonPointsAt00(
    glyphHexRadius,
    0,
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
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isEmptyHex ? OPACITY_EMPTY : isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* SNOWFLAKE IDEA, this one looks like the original ice snowflakes in Heroscape */}
      {/* https://www.svgrepo.com/svg/60624/snowflake?edit=true */}
      {/* <svg fill="#000000" height="100px" width="100px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-48.96 -48.96 587.52 587.52" xml:space="preserve" transform="matrix(1, 0, 0, 1, 0, 0)rotate(0)"><g id="SVGRepo_bgCarrier" stroke-width="0" transform="translate(0,0), scale(1)"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="10.7712"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M470.758,288L470.758,288l-77.9,34.2l-128.7-77.2l128.7-77.2l77.9,34.2c1.3,0.6,2.7,0.8,4,0.8c3.8,0,7.5-2.2,9.2-6 c2.2-5.1-0.1-11-5.1-13.2l-64.9-28.5l45.2-27.1c4.7-2.8,6.3-9,3.4-13.7c-2.9-4.7-9-6.3-13.7-3.4l-46.1,27.7l7.5-70.2 c0.6-5.5-3.4-10.4-8.9-11s-10.4,3.4-11,8.9l-9.1,85.2l-126.4,75.9V77.5l69.2-49.1c4.5-3.2,5.6-9.4,2.4-13.9s-9.4-5.6-13.9-2.4 l-57.6,40.9V10c0-5.5-4.5-10-10-10s-10,4.5-10,10v42.5l-57.7-40.5c-4.5-3.2-10.8-2.1-13.9,2.4c-3.2,4.5-2.1,10.8,2.4,13.9 l69.1,48.5v150.4l-127.2-76.4l-8.2-84.7c-0.5-5.5-5.4-9.5-10.9-9s-9.5,5.4-9,10.9l6.8,69.9l-45.5-27.3c-4.7-2.8-10.9-1.3-13.7,3.4 c-2.8,4.7-1.3,10.9,3.4,13.7l45,27l-64.7,28.7c-5,2.2-7.3,8.1-5.1,13.2c1.7,3.7,5.3,6,9.1,6c1.4,0,2.7-0.3,4-0.9l77.5-34.4 l129,77.4l-129,77.4l-77.5-34.4c-5.1-2.2-11,0-13.2,5.1c-2.2,5,0,11,5.1,13.2l64.7,28.7l-45,27c-4.7,2.8-6.3,9-3.4,13.7 c1.9,3.1,5.2,4.9,8.6,4.9c1.8,0,3.5-0.5,5.1-1.4l45.5-27.3l-6.8,69.9c-0.5,5.5,3.5,10.4,9,10.9c0.3,0,0.7,0,1,0 c5.1,0,9.4-3.9,9.9-9l8.2-84.7l127.2-76.4v154.8l-68.8,43.9c-4.7,3-6,9.2-3.1,13.8c1.9,3,5.1,4.6,8.4,4.6c1.8,0,3.7-0.5,5.4-1.6 l58-37v38.8c0,5.5,4.5,10,10,10s10-4.5,10-10v-39.2l58,37.4c4.6,3,10.8,1.7,13.8-3c3-4.7,1.7-10.8-3-13.8l-68.7-44V262.6 l126.4,75.9l9.1,85.2c0.5,5.1,4.9,8.9,9.9,8.9c0.4,0,0.7,0,1.1-0.1c5.5-0.6,9.5-5.5,8.9-11l-7.5-70.2l46.1,27.7 c1.6,1,3.4,1.4,5.1,1.4c3.4,0,6.7-1.7,8.6-4.9c2.8-4.7,1.3-10.9-3.4-13.7l-45.2-27.1l64.9-28.5c5.1-2.2,7.4-8.1,5.1-13.2 C481.658,288.1,475.758,285.8,470.758,288z"></path> </g> </g> </g></svg> */}
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}
export const PdfMultiHexMarvel6 = ({
  hex,
  isSubLevel,
}: {
  hex: BoardHex
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(hex)
  const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { points } = getMarvel6HexSvgPolygonPointsAt00(
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
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
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* Inner blob made in Inkscape, so not dynamic yet */}
      <Path
        d={
          'm 286.1131,90.73696 c 16.65839,-26.382446 54.15216,-31.892208 79.83132,-15.922364 c 17.97372,10.51788 35.03836,27.196614 57.59125,24.751205 c 22.74872,0.795339 33.98922,-21.294895 52.15463,-30.112717 c 18.42088,-8.050132 46.43658,-4.1049 55.40207,15.571474 c 10.17637,24.542152 -6.43448,52.274572 -30.46369,60.507912 c -18.87364,7.69153 -40.92365,19.04331 -43.32809,41.79135 c -2.99742,25.00222 0.9538,54.08721 -18.15166,73.93317 c -14.48747,17.32703 -40.51142,15.45047 -57.27469,2.80782 c -15.27799,-10.18442 -32.47377,-26.90733 -52.36956,-18.37378 c -13.42277,9.39008 -26.98936,19.30184 -42.8071,24.76172 c -20.63209,9.83002 -46.00051,8.09821 -63.89811,-6.5458 C 208.2596,249.78421 189.07835,237.53341 167.93492,244.2458 c -19.61348,1.87835 -30.33792,19.2147 -42.8165,31.95551 c -22.24859,21.78883 -64.126055,10.10048 -71.795918,-20.1076 c -4.537076,-15.35781 -1.1543,-36.2301 14.689092,-43.44663 c 7.776181,-6.11087 16.524827,-9.88732 25.963292,-12.65677 C 118.43879,189.54675 142.38076,166.68803 139.2922,137.93049 c -2.41869,-23.04113 -4.22448,-51.457898 16.73336,-66.951241 c 24.68892,-16.597599 57.28564,-2.150415 75.81862,17.26422 c 10.82387,13.158621 29.97878,29.987911 46.91284,16.055191 c 3.98396,-3.43307 6.65108,-8.350139 7.35608,-13.5617 z'
        }
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 1.2}
        transform={`translate(${-2 * SVG_HEX_APOTHEM},${-SVG_HEX_RADIUS})`}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
      {/* Little marro bubbles made in Inkscape, so not dynamic yet */}
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="9.4113"
        cy="82.45652"
        rx="16.650465"
        ry="10.742236"
      />
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 2}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="12.63397"
        cy="101.25543"
        rx="14.502019"
        ry="8.5937881"
      />
      <Ellipse
        stroke={'black'}
        strokeWidth={SVG_BORDER_WIDTH / 1.4}
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        cx="49.15758"
        cy="77.35397"
        rx="25.244253"
        ry="12.622127"
      />
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
  const { path } = getRuins2SvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <>
      {isSubLevel && (
        <Path
          d={path}
          stroke={'white'}
          strokeWidth={2 * SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
        />
      )}
      <Path
        d={path}
        stroke={fillColor}
        strokeWidth={2 * SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
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
  // const borderColor = SVG_BORDER_WIDTH > 0 ? getSvgHexBorderColor(hex) : ''
  const { path } = getRuins3SvgPolygonPoints(SVG_HEX_RADIUS, 0)

  return (
    <>
      {isSubLevel && (
        <Path
          d={path}
          stroke={'white'}
          strokeWidth={2 * SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
        />
      )}
      <Path
        d={path}
        stroke={fillColor}
        strokeWidth={2 * SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
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
  const fillColor = getSvgHexFillColor(piece)
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
export const PdfBoardPieceLaurWallRuin = ({
  piece,
  isSubLevel,
}: {
  piece: DecodedPieceID
  isSubLevel?: boolean
}) => {
  const fillColor = getSvgHexFillColor(piece)
  const borderColor = getSvgHexBorderColor(piece)
  const { points } = getLaurWallRuinSvgPolygonPoints(
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
// const {points} = get6HexSvgPolygonPointsAt00(SVG_HEX_RADIUS, SVG_BORDER_WIDTH)
//   {isSubLevel && (
//       <PdfSubLevelWhiteBackerPolygon points={points} />
//       )}
//         points={points}
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
      {isSubLevel && (
        <Polygon
          points={points}
          fill={'white'}
          stroke={'white'}
          strokeWidth={SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
        />
      )}
      <Polygon
        points={points}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={SVG_BORDER_WIDTH}
        // strokeLinecap="round"
        // strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      />
    </>
  )
}

const hexTextStyle = {
  fontSize: 0.8 * SVG_HEX_RADIUS,
  fontWeight: 'bold',
}
const singleHexObstacleHeightTextProps = (heightText: string) => ({
  style: hexTextStyle,
  y: 0.3 * SVG_HEX_RADIUS,
  x:
    heightText.toString().length === 2
      ? -0.6 * SVG_HEX_APOTHEM
      : -0.3 * SVG_HEX_APOTHEM,
})
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
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'9'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
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
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
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
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.x ?? 0}
        y={outcrop6TextXYForRotation?.[hex?.pieceRotation]?.[3]?.y ?? 0}
      >
        {'9'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
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
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
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
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'5'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'9'}
      </Text>
      <Text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'7'}
      </Text>
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
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  const { points } = get3HexSvgPolygonPointsAt00(
    SVG_HEX_RADIUS,
    SVG_BORDER_WIDTH,
  )
  return (
    <>
      <g transform={`rotate(${pieceRotation})`}>
        {isSubLevel && <SvgSubLevelWhiteBackerPolygon points={points} />}
        <polygon
          transform={`rotate(${pieceRotation})`}
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={SVG_BORDER_WIDTH}
          opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
        />
      </g>
      <text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[0]?.y ?? 0}
      >
        {'5'}
      </text>
      <text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[1]?.y ?? 0}
      >
        {'9'}
      </text>
      <text
        fill={hex.terrain === HexTerrain.glacier ? 'black' : 'white'}
        // white text needs a little opacity boost
        opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
        style={hexTextStyle}
        x={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.x ?? 0}
        y={outcrop3TextXYForRotation?.[hex?.pieceRotation]?.[2]?.y ?? 0}
      >
        {'7'}
      </text>
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
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}
const SvgSubLevelWhiteBackerPolygon = ({
  points,
  borderWidth,
}: { points: string; borderWidth?: number }) => {
  return (
    <polygon
      points={points}
      fill={'white'}
      stroke={'white'}
      strokeWidth={borderWidth ?? SVG_BORDER_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

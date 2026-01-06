import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { HexTerrain, Pieces, type BoardHex } from '../types'
import {
  isCastleTerrain,
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { decodePieceID, hexUtilsHexToPixel } from '../utils/map-utils'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'
import {
  SvgCastleArch,
  SvgCastleArchStraight3,
  SvgCastleCorner,
  SvgCastleEnd,
  SvgCastleStraight,
  SvgEmptyHex,
  SvgHive6,
  SvgLadder,
  SvgMarvelRuin,
  SvgMultiHex1,
  SvgMultiHex2,
  SvgMultiHex24,
  SvgMultiHex3,
  SvgMultiHex4,
  SvgMultiHex5,
  SvgMultiHex6,
  SvgMultiHex7,
  SvgMultiHexMarvel6,
  SvgMultiHexWallWalk7,
  SvgMultiHexWallWalk9,
  SvgOutcrop3,
  SvgOutcrop4,
  SvgOutcrop6,
  SvgStartZone,
  SvgRuins2,
  SvgRuins3,
  SvgTree415,
  SvgLaurPillar,
  SvgJungle,
} from './SvgMapShapes'
import { hexTextStyle, singleHexObstacleHeightTextProps } from './svgText'

const OPACITY_SUBLEVEL = 0.3

const glyphTextProps = (glyphText: string) => ({
  style: {
    fontSize: 0.5 * SVG_HEX_RADIUS,
    fontWeight: 'bold',
  },
  y: 0.2 * SVG_HEX_RADIUS,
  x:
    glyphText.toString().length === 2
      ? -0.3 * SVG_HEX_RADIUS
      : -0.15 * SVG_HEX_APOTHEM,
})

export const SvgMapHex = ({ hex }: { hex: BoardHex }) => {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const pixel = hexUtilsHexToPixel(hex)
  const isSubLevel = hex.altitude < viewingLevel
  const { inventoryID } = decodePieceID(hex.pieceID)
  const isObstaclePiece = piecesSoFar[inventoryID]?.isObstaclePiece
  const isAuxiliaryNotRenderedIn2D =
    isObstaclePiece && (hex.isObstacleAuxiliary || hex.isVerticalClearanceHex)
  const isVisible = hex.altitude <= viewingLevel
  const isLandHex =
    isSolidTerrainHex(hex.terrain) || isFluidTerrainHex(hex.terrain)
  const pieceHeightText = piecesSoFar[inventoryID]?.height
  const pieceRotation = ((hex?.pieceRotation ?? 0) % 6) * 60
  // EARLY RETURN: NOT VISIBLE
  if (!isVisible || isAuxiliaryNotRenderedIn2D) {
    return null
  }
  // Empty Hexes
  if (hex.terrain === HexTerrain.empty) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgEmptyHex hex={hex} />
      </g>
    )
  }
  // Ladder
  if (inventoryID === Pieces.ladder && hex.isObstacleOrigin) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgLadder hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Ruins 2
  if (inventoryID === Pieces.ruins2 && hex.isObstacleOrigin) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgRuins2 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Ruins 3
  if (inventoryID === Pieces.ruins3 && hex.isObstacleOrigin) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgRuins3 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Marro Hive 6
  if (inventoryID === Pieces.hive && hex.isObstacleOrigin) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgHive6 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Outcrop/glacier/LavaOutcrop 1's
  if (
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1 ||
    inventoryID === Pieces.glacier1
  ) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <text
          fill={
            hex.terrain === HexTerrain.glacier
              ? 'black'
              : hex.terrain === HexTerrain.outcrop
                ? svgColors.outcropText
                : svgColors.lavaRockOutcropText
          }
          // white text (not glaciers, so far) needs a little opacity boost
          opacity={
            isSubLevel
              ? hex.terrain === HexTerrain.glacier
                ? OPACITY_SUBLEVEL
                : OPACITY_SUBLEVEL * 2
              : 1
          }
          {...singleHexObstacleHeightTextProps(pieceHeightText.toString())}
        >
          {pieceHeightText}
        </text>
      </g>
    )
  }
  // Outcrop/glacier/LavaOutcrop 3's
  if (
    inventoryID === Pieces.outcrop3 ||
    inventoryID === Pieces.lavaRockOutcrop3 ||
    inventoryID === Pieces.glacier3
  ) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgOutcrop3 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Glacier 6's
  if (inventoryID === Pieces.glacier6) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgOutcrop6 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Glacier 4's
  if (inventoryID === Pieces.glacier4) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgOutcrop4 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // TREE 415
  if (inventoryID === Pieces.tree415) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgTree415 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Glyphs
  if (
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure
  ) {
    // const glyphShortName =
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 isGlyph hex={hex} isSubLevel={isSubLevel} />
        <text
          fill="white"
          // white text needs a little opacity boost
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          // {...glyphTextProps(`${pieceHeightText}`)}
          {...glyphTextProps('GL')}
        >
          {'GL'}
        </text>
      </g>
    )
  }
  // Start Zones
  if (hex.terrain === HexTerrain.startZone) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgStartZone hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // Single hex trees
  if (isEvergreenTree(hex.terrain)) {
    const textColor = isSubLevel ? svgSubLevelColors.evergreenText : svgColors.evergreenText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <text
          fill={textColor}
          // white text needs a little opacity boost
          {...singleHexObstacleHeightTextProps(pieceHeightText.toString())}
        >
          {pieceHeightText}
        </text>
      </g>
    )
  }
  // CASTLE WALLS
  if (isCastleTerrain(hex.terrain) && hex.isObstacleOrigin) {
    const heightText = pieceHeightText > 0 ? pieceHeightText : ''
    //  Return Castle Corner
    if (
      hex.inventoryID === Pieces.castleBaseCorner ||
      hex.inventoryID === Pieces.castleWallCorner
    ) {
      return (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <g transform={`rotate(${pieceRotation})`}>
            <SvgCastleCorner hex={hex} isSubLevel={isSubLevel} />
          </g>
          <SvgCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </g>
      )
    }
    //  Return Castle Straight
    if (
      hex.inventoryID === Pieces.castleBaseStraight ||
      hex.inventoryID === Pieces.castleWallStraight
    ) {
      return (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <g transform={`rotate(${pieceRotation})`}>
            <SvgCastleStraight hex={hex} isSubLevel={isSubLevel} />
          </g>
          <SvgCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </g>
      )
    }
    //  Return Castle End
    if (
      hex.inventoryID === Pieces.castleBaseEnd ||
      hex.inventoryID === Pieces.castleWallEnd
    ) {
      return (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <g transform={`rotate(${pieceRotation})`}>
            <SvgCastleEnd hex={hex} isSubLevel={isSubLevel} />
          </g>
          <SvgCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </g>
      )
    }
    //  Castle Arch
    if (
      hex.inventoryID === Pieces.castleArch ||
      hex.inventoryID === Pieces.castleArchNoDoor
    ) {
      return (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <g transform={`rotate(${pieceRotation})`}>
            <SvgCastleArchStraight3 hex={hex} isSubLevel={isSubLevel} />
            <SvgCastleArch hex={hex} isSubLevel={isSubLevel} />

            <g
              // flip upside down text, all other rotations are legible
              transform={pieceRotation === 180 ? 'rotate(-180)' : 'rotate(0)'}
            >
              <SvgCastleArchText
                isSubLevel={isSubLevel}
                pieceRotation={pieceRotation}
              />
            </g>
          </g>
        </g>
      )
    }
    // Default return, simple 1-hex representation
    return null
  }
  //  Marvel Ruin
  if (
    hex.inventoryID === Pieces.marvel ||
    hex.inventoryID === Pieces.marvelBroken ||
    hex.inventoryID === Pieces.marvelNoUpper ||
    hex.inventoryID === Pieces.marvelNoUpperBroken
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHexMarvel6 hex={hex} isSubLevel={isSubLevel} />
        <SvgMarvelRuin hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // JUNGLE
  if (isJungleTerrainHex(hex.terrain)) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgJungle hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // LAUR PILLARS
  if (
    inventoryID === Pieces.laurWallSquarePillar ||
    inventoryID === Pieces.laurWallTrianglePillar
  ) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgLaurPillar hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // SINGLE HEX LAND
  if (isLandHex && piecesSoFar[inventoryID].size === 1) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <g transform={`scale(${.105 * SVG_HEX_RADIUS}) translate(-28.7, -1074.2)`}>
          <path d="M32.4588 1076.05L34.0088 1075.13L33.4088 1074.78L31.8588 1075.7L29.3338 1074.24L31.8588 1072.78L33.4088 1073.7L34.0088 1073.35L32.4588 1072.43L34.0755 1071.5L33.7755 1070.98L32.1588 1071.91L32.1421 1070.11L31.5421 1070.46L31.5588 1072.26L29.0338 1073.71V1070.8L30.6005 1069.91V1069.22L29.0338 1070.11V1068.24H28.4255V1070.11L26.8671 1069.22V1069.91L28.4255 1070.8V1073.71L25.9005 1072.26L25.9171 1070.46L25.3171 1070.11L25.3005 1071.91L23.6838 1070.98L23.3838 1071.5L25.0005 1072.43L23.4505 1073.35L24.0505 1073.7L25.6005 1072.78L28.1255 1074.24L25.6005 1075.7L24.0505 1074.78L23.4505 1075.13L25.0005 1076.05L23.3838 1076.98L23.6838 1077.5L25.3005 1076.56L25.3171 1078.36L25.9171 1078.01L25.9005 1076.22L28.4255 1074.76V1077.68L26.8671 1078.56V1079.26L28.4255 1078.37V1080.24H29.0338V1078.37L30.6005 1079.26V1078.56L29.0338 1077.68V1074.76L31.5588 1076.22L31.5421 1078.01L32.1421 1078.36L32.1588 1076.56L33.7755 1077.5L34.0755 1076.98L32.4588 1076.05Z" fill="blue" />
        </g>
      </g>
    )
  }
  // EARLY RETURN: LAND AUXILIARY HEXES return null
  if (
    isLandHex &&
    (piecesSoFar?.[inventoryID]?.template === '2' ||
      piecesSoFar?.[inventoryID]?.template === '3' ||
      piecesSoFar?.[inventoryID]?.template === '4' ||
      piecesSoFar?.[inventoryID]?.template === '5' ||
      piecesSoFar?.[inventoryID]?.template === '6' ||
      piecesSoFar?.[inventoryID]?.template === '7' ||
      piecesSoFar?.[inventoryID]?.template === Pieces.marvel ||
      piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk7 ||
      piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk9 ||
      piecesSoFar?.[inventoryID]?.template === '24') &&
    hex.isObstacleAuxiliary
  ) {
    return null
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '2' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex2 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '4' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex4 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '3' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex3 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '5' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex5 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '7' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex7 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk7 &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHexWallWalk7 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk9 &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHexWallWalk9 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '6' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex6 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.marvel &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHexMarvel6 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '24' &&
    hex.isObstacleOrigin
  ) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgMultiHex24 hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  return null
}

const SvgCastleArchText = ({
  isSubLevel,
  pieceRotation,
}: {
  isSubLevel: boolean
  pieceRotation: number
}) => {
  const archText = 'D O O R'
  return (
    <text
      fill="black"
      opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      {...singleHexObstacleHeightTextProps(archText.toString())}
      y={0.3 * SVG_HEX_RADIUS}
      // upside down text is flipped in parent component, and adjusted here
      x={pieceRotation === 180 ? -3.7 * SVG_HEX_APOTHEM : 0.3 * SVG_HEX_APOTHEM}
    >
      {/* TODO: International: this style will need adjustment for international/other languages, where char length changes */}
      {archText}
    </text>
  )
}
const SvgCastleWallBaseHeightText = ({
  isSubLevel,
  heightText,
}: {
  isSubLevel: boolean
  heightText: string
}) => {
  return (
    <text
      fill="black"
      opacity={isSubLevel ? OPACITY_SUBLEVEL : 1}
      {...singleHexObstacleHeightTextProps(heightText.toString())}
      y={0.3 * SVG_HEX_RADIUS}
      x={-0.3 * SVG_HEX_APOTHEM}
    >
      {heightText}
    </text>
  )
}

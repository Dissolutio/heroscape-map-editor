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
    // const roadDecorScale = 11
    const toxicDecorScale = 11
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        {/* <g transform={`translate(${roadDecorScale * -28.812}, ${roadDecorScale * -2038.11}) scale(${roadDecorScale})`}> */}
        <g transform={`translate(${toxicDecorScale * -28.73}, ${toxicDecorScale * -1556.155}) scale(${toxicDecorScale})`}>
          <path
            d="M26.3712 1552.22C25.8891 1552.51 25.4843 1552.86 25.1434 1553.29C24.5812 1553.99 24.2677 1554.84 24.2354 1555.74L24.2305 1555.87H27.3811V1555.84C27.3811 1555.82 27.3846 1555.78 27.3888 1555.74C27.4331 1555.35 27.6517 1555.01 27.9897 1554.8L28.0558 1554.75L28.0354 1554.72C27.5259 1553.87 26.4864 1552.16 26.4801 1552.16C26.4752 1552.16 26.426 1552.19 26.3712 1552.22Z"
            fill="blue" />
          <path
            d="M30.7949 1552.46C30.5109 1552.93 29.4111 1554.75 29.4083 1554.75C29.4069 1554.75 29.4315 1554.77 29.4624 1554.79C29.7646 1554.98 29.9817 1555.28 30.0513 1555.61C30.0668 1555.69 30.0801 1555.79 30.0801 1555.84V1555.87H33.2308L33.2258 1555.74C33.2097 1555.3 33.1317 1554.89 32.989 1554.49C32.6713 1553.6 32.0592 1552.84 31.2362 1552.31C31.1161 1552.23 30.9924 1552.16 30.9818 1552.16C30.9776 1552.16 30.894 1552.29 30.7949 1552.46Z"
            fill="blue" />
          <path
            d="M28.6079 1555.02C28.1336 1555.08 27.7885 1555.5 27.8377 1555.95C27.8602 1556.16 27.9445 1556.33 28.0977 1556.47C28.2516 1556.62 28.4294 1556.7 28.648 1556.72C28.901 1556.75 29.1639 1556.66 29.3515 1556.49C29.6811 1556.18 29.7219 1555.7 29.4478 1555.35C29.2545 1555.11 28.9291 1554.98 28.6079 1555.02Z"
            fill="blue" />
          <path
            d="M27.6989 1557.58C26.4339 1559.67 26.4859 1559.58 26.4964 1559.59C26.5133 1559.6 26.7248 1559.71 26.8436 1559.76C27.3208 1559.97 27.798 1560.1 28.3448 1560.15C28.5198 1560.16 28.9379 1560.16 29.1164 1560.15C29.6534 1560.1 30.1348 1559.98 30.6071 1559.77C30.7083 1559.72 30.9332 1559.61 30.9592 1559.59L30.9746 1559.58L30.217 1558.33C29.8003 1557.64 29.4467 1557.05 29.432 1557.03L29.4053 1556.99L29.3223 1557.02C29.179 1557.09 29.0258 1557.13 28.8627 1557.15C28.6245 1557.18 28.3595 1557.13 28.1374 1557.02L28.0559 1556.99L27.6989 1557.58Z"
            fill="blue" />
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
    // snow hexes display a snowflake
    // toxic land hexes display a nuclear symbol
    // toxic water hexes display a nuclear symbol
    // road hexes display cobblestones
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

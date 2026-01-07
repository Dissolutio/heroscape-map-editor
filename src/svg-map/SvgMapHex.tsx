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
    const roadDecorScale = 11
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <g transform={`translate(${roadDecorScale * -28.812}, ${roadDecorScale * -2038.11}) scale(${roadDecorScale})`}>
          <path d="M26.9734 2037.14C27.6223 2037.12 28.5262 2037.8 28.7889 2038.44C29.0824 2039.18 28.6498 2040.4 28.1399 2040.95C28.0163 2041.07 26.8884 2042.03 26.8035 2042.06C26.6567 2042.1 26.5022 2042.09 26.3477 2042.06C26.0773 2042 25.0884 2041.69 24.8567 2041.56C24.6249 2041.44 24.5399 2041.25 24.4704 2041C24.37 2040.69 24.1614 2039.59 24.2695 2039.31C24.3777 2039.03 25.1502 2038.55 25.3974 2038.28C25.9459 2037.68 25.9923 2037.15 26.9811 2037.14H26.9734Z" fill="blue" />
          <path d="M29.4454 2038.67C29.2523 2038.42 28.9046 2037.32 28.9355 2037C28.951 2036.8 29.4995 2035.58 29.6385 2035.5C29.8162 2035.39 30.6737 2035.3 30.9209 2035.3C31.2145 2035.3 31.9948 2035.4 32.242 2035.53C32.5201 2035.66 33.254 2036.67 33.2308 2036.98C33.2231 2037.1 32.5741 2038.47 32.466 2038.64C31.9407 2039.48 31.5312 2039.1 30.7742 2038.99C30.3338 2038.93 29.7853 2039.1 29.4454 2038.67Z" fill="blue" />
          <path d="M26.7569 2034.12C27.0273 2034.07 28.1397 2034.06 28.3946 2034.12C28.6882 2034.19 29.0899 2034.79 29.0667 2035.11C29.0281 2035.63 28.4719 2036.8 27.9234 2036.81C27.6685 2036.81 26.9423 2036.76 26.6796 2036.72C25.9998 2036.62 26.2547 2036.23 26.2316 2035.79C26.1929 2035.18 25.9303 2034.27 26.7646 2034.12L26.7569 2034.12Z" fill="blue" />
          <path d="M30.6574 2039.38C30.9742 2039.34 32.0248 2039.71 32.2643 2039.94C32.8978 2040.57 32.3956 2041.79 31.6154 2041.86C31.1364 2041.9 30.0781 2041.46 29.6532 2041.19C29.2514 2040.94 29.2128 2040.39 29.4909 2040C29.6454 2039.79 30.418 2039.41 30.6574 2039.38V2039.38Z" fill="blue" />
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

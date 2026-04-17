import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'
import { HexTerrain, Pieces, type BoardHex } from '../types'
import {
  isCastleTerrain,
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import {
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
  SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH,
} from '../utils/constants'
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
  SvgHexDecor,
  SvgFortifiedWall,
  getOutcropTextColor,
} from './SvgMapShapes'
import { singleHexObstacleHeightTextProps } from './svgText'
import {
  xTransformForMultiHex3Rotation,
  yTransformForMultiHex3Rotation,
} from '../pdf-svg-shared/textRotations'

const OPACITY_SUBLEVEL = 0.3

const glyphTextProps = (glyphText: string) => {
  const fontSize =
    glyphText.toString().length === 4 // NIFL
      ? 0.6 * SVG_HEX_RADIUS
      : glyphText.toString().length === 3 // ZIP
        ? 0.6 * SVG_HEX_RADIUS
        : glyphText.toString().length === 2
          ? 0.7 * SVG_HEX_RADIUS
          : glyphText.toString() === '?'
            ? 0.9 * SVG_HEX_RADIUS
            : 0.7 * SVG_HEX_RADIUS

  return {
    // Use dy-based vertical centering for better compatibility in native SVG viewers.
    textAnchor: 'middle' as const,
    dy: '0.35em',
    style: {
      fontSize,
      fontWeight: 'bold',
    },
  }
}

export const SvgMapHex = ({ hex }: { hex: BoardHex }) => {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const is2DOverlayLevelEnabled = useBoundStore(
    (s) => s.is2DOverlayLevelEnabled,
  )
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const overlayLevel = getBoardPiecesMaxLevel(boardPieces) + 1
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
  // Fortified Wall
  if (inventoryID === Pieces.fortifiedWall && hex.isObstacleOrigin) {
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgFortifiedWall hex={hex} isSubLevel={isSubLevel} />
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
  // Shroudshroom7
  if (inventoryID === Pieces.shroudshroom7) {
    const textColor = isSubLevel
      ? svgSubLevelColors.shroudshroomText
      : svgColors.shroudshroomText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
          Y
        </text>
      </g>
    )
  }
  // Shroudshroom10
  if (inventoryID === Pieces.shroudshroom10) {
    const textColor = isSubLevel
      ? svgSubLevelColors.shroudshroomText
      : svgColors.shroudshroomText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
          M
        </text>
      </g>
    )
  }
  // Shroudshroom13
  if (inventoryID === Pieces.shroudshroom13) {
    const textColor = isSubLevel
      ? svgSubLevelColors.shroudshroomText
      : svgColors.shroudshroomText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <g transform={`rotate(${pieceRotation})`}>
          <SvgMultiHex3 hex={hex} isSubLevel={isSubLevel} />
        </g>
        <text
          opacity={
            isSubLevel
              ? // white text needs a little opacity boost
              OPACITY_SUBLEVEL * 2
              : 1
          }
          fill={textColor}
          {...singleHexObstacleHeightTextProps()}
          x={xTransformForMultiHex3Rotation[hex?.pieceRotation ?? 0]}
          y={yTransformForMultiHex3Rotation[hex?.pieceRotation ?? 0]}
        >
          A
        </text>
      </g>
    )
  }
  // Cannon
  if (inventoryID === Pieces.cannon) {
    const textColor = isSubLevel
      ? svgSubLevelColors.shroudshroomText
      : svgColors.shroudshroomText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
          C
        </text>
      </g>
    )
  }
  // Rope Ladder
  if (inventoryID === Pieces.ropeLadder) {
    const textColor = isSubLevel
      ? svgSubLevelColors.shroudshroomText
      : svgColors.shroudshroomText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
          R
        </text>
      </g>
    )
  }
  // Ship Wall (placeholder: replace with custom ship wall shape)
  if (inventoryID === Pieces.shipWall && hex.isObstacleOrigin) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <g transform={`rotate(${pieceRotation})`}>
          <SvgMultiHex3 hex={hex} isSubLevel={isSubLevel} />
        </g>
        <text
          fill={svgColors.shroudshroomText}
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          {...singleHexObstacleHeightTextProps()}
        >
          SW
        </text>
      </g>
    )
  }
  // Ship Bow (placeholder: replace with custom ship bow shape)
  if (inventoryID === Pieces.shipBow && hex.isObstacleOrigin) {
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <g transform={`rotate(${pieceRotation})`}>
          <SvgMultiHex5 hex={hex} isSubLevel={isSubLevel} />
        </g>
        <text
          fill={svgColors.shroudshroomText}
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          {...singleHexObstacleHeightTextProps()}
        >
          SB
        </text>
      </g>
    )
  }
  // Outcrop/glacier/LavaOutcrop 1's
  if (
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1 ||
    inventoryID === Pieces.glacier1
  ) {
    const textColor = getOutcropTextColor({ hex, isSubLevel })
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text fill={textColor} {...singleHexObstacleHeightTextProps()}>
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
    // When overlay view is enabled, glyphs should only be shown on the overlay level
    const isOverlayViewing =
      is2DOverlayLevelEnabled && viewingLevel === overlayLevel
    if (is2DOverlayLevelEnabled && !isOverlayViewing) {
      return null
    }
    const specialIsSubLevel = isOverlayViewing ? false : isSubLevel
    const glyphLetter = piecesSoFar[inventoryID]?.glyphLetter ?? '?'
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={specialIsSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text
          fill={
            specialIsSubLevel
              ? svgSubLevelColors.glyphText
              : svgColors.glyphText
          }
          // white text needs a little opacity boost
          opacity={specialIsSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          {...glyphTextProps(glyphLetter)}
        >
          {glyphLetter}
        </text>
      </g>
    )
  }
  // Start Zones
  if (hex.terrain === HexTerrain.startZone) {
    const isOverlayViewing =
      is2DOverlayLevelEnabled && viewingLevel === overlayLevel
    if (is2DOverlayLevelEnabled && !isOverlayViewing) {
      return null
    }
    const specialIsSubLevel = isOverlayViewing ? false : isSubLevel
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgStartZone hex={hex} isSubLevel={specialIsSubLevel} />
      </g>
    )
  }
  // Single hex trees
  if (isEvergreenTree(hex.terrain)) {
    const textColor = isSubLevel
      ? svgSubLevelColors.evergreenText
      : svgColors.evergreenText
    return (
      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
        <SvgMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          borderWidth={SVG_TREE_JUNGLE_OUTCROP_BORDER_WIDTH}
        />
        <text
          fill={textColor}
          // white text needs a little opacity boost
          {...singleHexObstacleHeightTextProps()}
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
          <SvgCastleArch hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
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
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  // LAND AUXILIARY HEXES return just decor
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
    return (
      <g
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <SvgHexDecor hex={hex} isSubLevel={isSubLevel} />
      </g>
    )
  }
  return null
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
      {...singleHexObstacleHeightTextProps()}
    // y={0.3 * SVG_HEX_RADIUS}
    // x={-0.3 * SVG_HEX_APOTHEM}
    >
      {heightText}
    </text>
  )
}

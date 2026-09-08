import { G, Text } from '@react-pdf/renderer'
import { piecesSoFar } from '../data/pieces'
import {
  xTransformForMultiHex3Rotation,
  yTransformForMultiHex3Rotation,
} from '../pdf-svg-shared/textRotations'
import { pdfHexTextStyle, pdfTextProps } from '../svg-map/pdfText'
import { type BoardHex, HexTerrain, Pieces } from '../types'
import {
  isCastleTerrain,
  isEvergreenTree,
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils'
import { OPACITY_SUBLEVEL, SVG_HEX_RADIUS } from '../utils/constants'
import { hexUtilsHexToPixel } from '../utils/map-utils'
import {
  getTerrainTileLetter,
  getTileLetterPosition,
  shouldDisplayTerrainTileLetter,
} from '../utils/tileLetters'
import { svgColors, svgSubLevelColors } from '../world/maphex/hexColors'
import {
  PdfCannon,
  PdfCastleArch,
  PdfCastleArchStraight3,
  PdfCastleArchText,
  PdfCastleCorner,
  PdfCastleEnd,
  PdfCastleStraight,
  PdfEmptyHex,
  PdfHive6,
  PdfJungle,
  PdfLadder,
  PdfLaurPillar,
  PdfMarvelRuin,
  PdfMultiHex1,
  PdfMultiHex2,
  PdfMultiHex3,
  PdfMultiHex4,
  PdfMultiHex5,
  PdfMultiHex6,
  PdfMultiHex7,
  PdfMultiHex24,
  PdfMultiHexMarvel6,
  PdfMultiHexWallWalk7,
  PdfMultiHexWallWalk9,
  PdfShipBow,
  PdfShipWall,
  PdfStartZone,
  PdfSvgFortifiedWall,
  PdfSvgHexDecor,
  PdfSvgOutcrop3,
  PdfSvgOutcrop4,
  PdfSvgOutcrop6,
  PdfSvgRuins2,
  PdfSvgRuins3,
  PdfSvgTree415,
} from './PdfMapShapes'

const glyphTextProps = () => ({
  style: {
    fontSize: 0.5 * SVG_HEX_RADIUS,
    fontWeight: 'bold',
  },
  // these properties make the text centered within the hexagon
  // text-anchor="middle" dominant-baseline="central"
  textAnchor: 'middle' as const,
  dominantBaseline: 'central' as const,
})

const TerrainTileLetterText = ({
  hex,
  viewingLevel,
  enabled,
}: {
  hex: BoardHex
  viewingLevel: number
  enabled: boolean
}) => {
  if (!enabled || !shouldDisplayTerrainTileLetter(hex, viewingLevel)) {
    return null
  }
  const terrainLetter = getTerrainTileLetter(hex.terrain)
  if (!terrainLetter) {
    return null
  }
  const position = getTileLetterPosition(hex)
  return (
    <Text
      fill={terrainLetter.isBlack ? '#000000' : '#FFFFFF'}
      {...pdfTextProps()}
      x={position.x}
      y={position.y}
    >
      {terrainLetter.letter}
    </Text>
  )
}

export const PdfMapHex = ({
  hex,
  viewingLevel,
  isOverlayViewing,
  isPdfColorBorders,
  isShowPdfOverlayOnPlacedLevel,
  isShowPdfTileLetters,
  useLegacyStartZones,
}: {
  hex: BoardHex
  viewingLevel: number
  isOverlayViewing: boolean
  isPdfColorBorders: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPdfTileLetters: boolean
  useLegacyStartZones: boolean
}) => {
  const pixel = hexUtilsHexToPixel(hex)
  const isSubLevel = hex.altitude < viewingLevel
  const { inventoryID } = hex
  const isObstaclePiece = piecesSoFar[inventoryID]?.isObstaclePiece
  const isAuxiliaryNotRenderedIn2D =
    isObstaclePiece &&
    !hex.isObstacleOrigin &&
    (hex.isObstacleAuxiliary || hex.isVerticalClearanceHex)
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
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfEmptyHex />
      </G>
    )
  }
  // Ladder
  if (inventoryID === Pieces.ladder && hex.isObstacleOrigin) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfLadder hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Ruins 3
  if (inventoryID === Pieces.ruins3 && hex.isObstacleOrigin) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfSvgRuins3 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Marvel Ruins (4 variations)
  if (
    (inventoryID === Pieces.marvel ||
      inventoryID === Pieces.marvelBroken ||
      inventoryID === Pieces.marvelNoUpper ||
      inventoryID === Pieces.marvelNoUpperBroken) &&
    hex.isObstacleOrigin
  ) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfMarvelRuin hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Marro Hive 6
  if (inventoryID === Pieces.hive && hex.isObstacleOrigin) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfHive6 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  if (inventoryID === Pieces.ruins2 && hex.isObstacleOrigin) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfSvgRuins2 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  if (inventoryID === Pieces.fortifiedWall && hex.isObstacleOrigin) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfSvgFortifiedWall hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Shroudshroom7
  if (inventoryID === Pieces.shroudshroom7) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <Text
          fill={svgColors.shroudshroomText}
          // white text (not glaciers, so far) needs a little opacity boost
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          style={pdfHexTextStyle}
          textAnchor="middle"
          dominantBaseline="central"
          // {...pdfTextProps()}
        >
          Y
        </Text>
      </G>
    )
  }
  // Shroudshroom10
  if (inventoryID === Pieces.shroudshroom10) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <Text
          fill={svgColors.shroudshroomText}
          // white text (not glaciers, so far) needs a little opacity boost
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          style={pdfHexTextStyle}
          textAnchor="middle"
          dominantBaseline="central"
          // {...pdfTextProps()}
        >
          M
        </Text>
      </G>
    )
  }
  // Shroudshroom13
  if (inventoryID === Pieces.shroudshroom13) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex3 hex={hex} isSubLevel={isSubLevel} />
        </G>
        <Text
          fill={svgColors.shroudshroomText}
          opacity={
            isSubLevel
              ? // white text needs a little opacity boost
                OPACITY_SUBLEVEL * 2
              : 1
          }
          style={pdfHexTextStyle}
          textAnchor="middle"
          dominantBaseline="central"
          x={xTransformForMultiHex3Rotation[hex?.pieceRotation ?? 0]}
          y={yTransformForMultiHex3Rotation[hex?.pieceRotation ?? 0]}
        >
          A
        </Text>
      </G>
    )
  }
  // Cannon
  if (inventoryID === Pieces.cannon) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfCannon
          hex={hex}
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
        />
      </G>
    )
  }
  // Ship Wall (placeholder: replace with custom ship wall shape)
  if (inventoryID === Pieces.shipWall && hex.isObstacleOrigin) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfShipWall
          hex={hex}
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
        />
      </G>
    )
  }
  // Ship Bow (placeholder: replace with custom ship bow shape)
  if (inventoryID === Pieces.shipBow && hex.isObstacleOrigin) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfShipBow
          hex={hex}
          isSubLevel={isSubLevel}
          pieceRotation={pieceRotation}
        />
      </G>
    )
  }
  // Outcrop/Glacier/LavaOutcrop 1's
  if (
    inventoryID === Pieces.outcrop1 ||
    inventoryID === Pieces.lavaRockOutcrop1 ||
    inventoryID === Pieces.glacier1
  ) {
    const glacierTextColor = isSubLevel
      ? svgSubLevelColors.glacierText
      : svgColors.glacierText
    const outcropTextColor = isSubLevel
      ? svgSubLevelColors.outcropText
      : svgColors.outcropText
    const textColor =
      hex.terrain === HexTerrain.glacier ? glacierTextColor : outcropTextColor
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <Text
          fill={textColor}
          // white text (not glaciers, so far) needs a little opacity boost
          opacity={
            isSubLevel
              ? hex.terrain === HexTerrain.glacier
                ? 1
                : OPACITY_SUBLEVEL * 2
              : 1
          }
          {...pdfTextProps()}
        >
          {pieceHeightText}
        </Text>
      </G>
    )
  }
  // Outcrop/Glacier/LavaOutcrop 3's
  if (
    inventoryID === Pieces.outcrop3 ||
    inventoryID === Pieces.lavaRockOutcrop3 ||
    inventoryID === Pieces.glacier3
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfSvgOutcrop3 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Glacier 6's
  if (inventoryID === Pieces.glacier6) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfSvgOutcrop6 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Glacier 4's
  if (inventoryID === Pieces.glacier4) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfSvgOutcrop4 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // TREE 415
  if (inventoryID === Pieces.tree415) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfSvgTree415 hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // Glyphs
  if (
    hex.terrain === HexTerrain.glyphPower ||
    hex.terrain === HexTerrain.glyphTreasure
  ) {
    const isPlacedLevelViewing = hex.altitude === viewingLevel
    if (
      !isOverlayViewing &&
      !(isShowPdfOverlayOnPlacedLevel && isPlacedLevelViewing)
    ) {
      return null
    }
    const specialIsSubLevel = false
    // const isNamedGlyph =  (hex.terrain === HexTerrain.glyphPower || hex.terrain === HexTerrain.glyphTreasure) && (hex.inventoryID !== Pieces.glyphPower && hex.inventoryID !== Pieces.glyphTreasure)
    const glyphLetter = piecesSoFar[hex.inventoryID]?.glyphLetter
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1 isGlyph hex={hex} isSubLevel={specialIsSubLevel} />
        <Text
          fill="white"
          // white text needs a little opacity boost
          opacity={specialIsSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          // {...glyphTextProps(`${pieceHeightText}`)}
          {...glyphTextProps()}
        >
          {glyphLetter}
        </Text>
      </G>
    )
  }
  // Start Zones
  if (hex.terrain === HexTerrain.startZone) {
    const isPlacedLevelViewing = hex.altitude === viewingLevel
    if (
      !isOverlayViewing &&
      !(isShowPdfOverlayOnPlacedLevel && isPlacedLevelViewing)
    ) {
      return null
    }
    const specialIsSubLevel = false
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfStartZone
          hex={hex}
          isSubLevel={specialIsSubLevel}
          useLegacyStartZones={useLegacyStartZones}
        />
      </G>
    )
  }
  // Single hex trees
  if (isEvergreenTree(hex.terrain)) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
        <Text
          fill="white"
          // white text needs a little opacity boost
          opacity={isSubLevel ? OPACITY_SUBLEVEL * 2 : 1}
          {...pdfTextProps()}
        >
          {pieceHeightText}
        </Text>
      </G>
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
        <G transform={`translate(${pixel.x}, ${pixel.y})`}>
          <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <G transform={`rotate(${pieceRotation})`}>
            <PdfCastleCorner hex={hex} isSubLevel={isSubLevel} />
          </G>
          <PdfCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </G>
      )
    }
    //  Return Castle Straight
    if (
      hex.inventoryID === Pieces.castleBaseStraight ||
      hex.inventoryID === Pieces.castleWallStraight
    ) {
      return (
        <G transform={`translate(${pixel.x}, ${pixel.y})`}>
          <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <G transform={`rotate(${pieceRotation})`}>
            <PdfCastleStraight hex={hex} isSubLevel={isSubLevel} />
          </G>
          <PdfCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </G>
      )
    }
    //  Return Castle End
    if (
      hex.inventoryID === Pieces.castleBaseEnd ||
      hex.inventoryID === Pieces.castleWallEnd
    ) {
      return (
        <G transform={`translate(${pixel.x}, ${pixel.y})`}>
          <PdfMultiHex1 hex={hex} isSubLevel={isSubLevel} />
          <G transform={`rotate(${pieceRotation})`}>
            <PdfCastleEnd hex={hex} isSubLevel={isSubLevel} />
          </G>
          <PdfCastleWallBaseHeightText
            isSubLevel={isSubLevel}
            heightText={`${heightText}`}
          />
        </G>
      )
    }
    //  Castle Arch
    if (
      hex.inventoryID === Pieces.castleArch ||
      hex.inventoryID === Pieces.castleArchNoDoor
    ) {
      return (
        <G transform={`translate(${pixel.x}, ${pixel.y})`}>
          <G transform={`rotate(${pieceRotation})`}>
            <PdfCastleArchStraight3 hex={hex} isSubLevel={isSubLevel} />
            <PdfCastleArch hex={hex} isSubLevel={isSubLevel} />

            <G
              // flip upside down text, all other rotations are legible
              transform={pieceRotation === 180 ? 'rotate(-180)' : 'rotate(0)'}
            >
              <PdfCastleArchText
                isSubLevel={isSubLevel}
                pieceRotation={pieceRotation}
              />
            </G>
          </G>
        </G>
      )
    }
  }
  // JUNGLE
  if (isJungleTerrainHex(hex.terrain)) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfJungle hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // LAUR PILLARS
  if (
    inventoryID === Pieces.laurWallSquarePillar ||
    inventoryID === Pieces.laurWallTrianglePillar
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfLaurPillar hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  // SINGLE HEX LAND
  if (isLandHex && piecesSoFar[inventoryID].size === 1) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <PdfMultiHex1
          hex={hex}
          isSubLevel={isSubLevel}
          useTerrainBorderColor={isPdfColorBorders}
        />
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
        <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '2' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex2
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '4' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex4
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '3' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex3
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '5' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex5
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '7' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex7
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk7 &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHexWallWalk7
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk9 &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHexWallWalk9
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '6' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex6
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === Pieces.marvel &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHexMarvel6 hex={hex} isSubLevel={isSubLevel} />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
    )
  }
  if (
    isLandHex &&
    piecesSoFar?.[inventoryID]?.template === '24' &&
    hex.isObstacleOrigin
  ) {
    return (
      <G transform={`translate(${pixel.x}, ${pixel.y})`}>
        <G transform={`rotate(${pieceRotation})`}>
          <PdfMultiHex24
            hex={hex}
            isSubLevel={isSubLevel}
            useTerrainBorderColor={isPdfColorBorders}
          />
          <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
        </G>
        <TerrainTileLetterText
          hex={hex}
          viewingLevel={viewingLevel}
          enabled={isShowPdfTileLetters}
        />
      </G>
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
      piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk7 ||
      piecesSoFar?.[inventoryID]?.template === Pieces.wallWalk9 ||
      piecesSoFar?.[inventoryID]?.template === '24') &&
    hex.isObstacleAuxiliary
  ) {
    return (
      <G
        transform={`translate(${pixel.x}, ${pixel.y})rotate(${pieceRotation})`}
      >
        <PdfSvgHexDecor hex={hex} isSubLevel={isSubLevel} />
      </G>
    )
  }
  return null
}

const PdfCastleWallBaseHeightText = ({
  isSubLevel,
  heightText,
}: {
  isSubLevel: boolean
  heightText: string
}) => {
  const textColor = isSubLevel
    ? svgSubLevelColors.jungleText
    : svgColors.jungleText
  return (
    <Text fill={textColor} {...pdfTextProps()}>
      {heightText}
    </Text>
  )
}

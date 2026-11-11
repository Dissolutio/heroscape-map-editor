import { Page, Text, View } from '@react-pdf/renderer'
import { groupBy, keyBy, uniq } from 'lodash'
import type { PropsWithChildren } from 'react'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import {
  LEVEL_LOGO_OUTLIER_LABEL_MARGIN,
  LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE,
  LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT,
  LEVEL_LOGO_PDF_WIDTH,
  NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE,
  NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT,
} from '../pdf-svg-shared/levelLogoLayout'
import { getLadderOverlayLevels } from '../pdf-svg-shared/ladderStack'
import { getPdfLegendObjectiveMarkers } from '../pdf-svg-shared/objectiveMarkerExport'
import useBoundStore from '../store/store'
import {
  type BoardHexes,
  type BoardPiece,
  type PdfMapAltitudeChunk,
  Pieces,
} from '../types'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import {
  boardPieceToDecodedPieceID,
  getBoardHexesSvgMapDimensions,
  getOverlayLevel,
} from '../utils/map-utils'
import {
  BURIED_MARKS_KEY,
  type BuriedMarksByUID,
  getBuriedMarksForHex,
} from '../utils/tileMarks'
import { PdfLevelLogo } from './PdfLevelLogo'
import { PdfObjectiveMarkerLegend } from './PdfObjectiveMarkers'
import { PdfPieceLegend } from './PdfPieceLegend'
import { ReactPdfSvgMapDisplay } from './ReactPdfSvgMapDisplay'
export const PdfMapLevels6PerPage = ({
  boardHexes,
  boardPieces,
  isPdfColorBorders,
  isShowPdfOverlayLayer,
  isShowPdfOverlayOnPlacedLevel,
  isShowPdfGridLinesOverSublevels,
  isShowPdfLevelLogo,
  isShowPdfTileLetters,
  isShowPdfBuriedMarks,
  buriedMarksByUID,
  useLegacyStartZones,
  is2DOverlayLevelEnabled,
  objectiveMarkers,
  children,
}: PropsWithChildren<{
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPdfGridLinesOverSublevels: boolean
  isShowPdfLevelLogo: boolean
  isShowPdfTileLetters: boolean
  isShowPdfBuriedMarks: boolean
  buriedMarksByUID: BuriedMarksByUID
  useLegacyStartZones: boolean
  is2DOverlayLevelEnabled: boolean
  objectiveMarkers: ObjectiveMarker[]
}>) => {
  // Not a hook: @react-pdf/renderer's tree has no React dispatcher.
  const { isShowPdfPieceLegend, isShowPdfLadderOverlay } =
    useBoundStore.getState()
  const boardHexesArr = Object.values(boardHexes)
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const chunksOf6Levels = get6LevelChunk(
    boardHexesWithoutEmpties,
    boardPieces,
    isShowPdfOverlayLayer,
    isShowPdfLadderOverlay,
  )
  const decodedBoardPiecesArr = boardPieces
    .map((bp) => boardPieceToDecodedPieceID(bp))
    .filter((p) => Boolean(p))
  const hasBuriedMarks =
    isShowPdfBuriedMarks &&
    Object.values(boardHexes).some((hex) =>
      getBuriedMarksForHex(hex, hex.altitude, buriedMarksByUID),
    )
  const legendMarkers = getPdfLegendObjectiveMarkers(
    objectiveMarkers,
    isShowPdfOverlayLayer,
    isShowPdfOverlayOnPlacedLevel,
  ).filter((marker) => marker.name?.trim())
  return (
    <>
      {chunksOf6Levels.map((chunk, i) => (
        <Page
          key={i}
          size="LETTER"
          style={{
            flexDirection: 'column',
            maxHeight: '100vh',
            padding: 5,
          }}
        >
          {i === 0 && children}
          <View
            style={{
              flexDirection: 'row',
              flexGrow: 1,
            }}
          >
            <HalfPageColumn>
              {chunk.map((group, i) =>
                i < 3 ? (
                  <RowWrapper key={i}>
                    <PdfLevelChunkHeading
                      group={group}
                      isShowPdfLevelLogo={isShowPdfLevelLogo}
                    />
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={boardHexesArr}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
                      overlayLevel={overlayLevel}
                      isPdfColorBorders={isPdfColorBorders}
                      isShowPdfOverlayOnPlacedLevel={
                        isShowPdfOverlayOnPlacedLevel
                      }
                      isShowGridLinesOverSublevels={
                        isShowPdfGridLinesOverSublevels
                      }
                      isShowPdfTileLetters={isShowPdfTileLetters}
                      isShowPdfBuriedMarks={isShowPdfBuriedMarks}
                      buriedMarksByUID={buriedMarksByUID}
                      useLegacyStartZones={useLegacyStartZones}
                      is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
                      objectiveMarkers={objectiveMarkers}
                    />
                  </RowWrapper>
                ) : null,
              )}
            </HalfPageColumn>
            <HalfPageColumn>
              {chunk.map((group, i) =>
                i >= 3 ? (
                  <RowWrapper key={i}>
                    <PdfLevelChunkHeading
                      group={group}
                      isShowPdfLevelLogo={isShowPdfLevelLogo}
                    />
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={boardHexesArr}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
                      overlayLevel={overlayLevel}
                      isPdfColorBorders={isPdfColorBorders}
                      isShowPdfOverlayOnPlacedLevel={
                        isShowPdfOverlayOnPlacedLevel
                      }
                      isShowGridLinesOverSublevels={
                        isShowPdfGridLinesOverSublevels
                      }
                      isShowPdfTileLetters={isShowPdfTileLetters}
                      isShowPdfBuriedMarks={isShowPdfBuriedMarks}
                      buriedMarksByUID={buriedMarksByUID}
                      useLegacyStartZones={useLegacyStartZones}
                      is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
                      objectiveMarkers={objectiveMarkers}
                    />
                  </RowWrapper>
                ) : null,
              )}
            </HalfPageColumn>
          </View>
          {i === 0 && legendMarkers.length > 0 && (
            <PdfObjectiveMarkerLegend markers={legendMarkers} />
          )}
          {i === 0 && hasBuriedMarks && (
            <Text style={{ fontSize: 7, textAlign: 'center', marginTop: 2 }}>
              {BURIED_MARKS_KEY}
            </Text>
          )}
        </Page>
      ))}
      {isShowPdfPieceLegend && <PdfPieceLegend boardPieces={boardPieces} />}
    </>
  )
}

const get6LevelChunk = (
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
  isShowPdfOverlayLayer: boolean,
  isShowPdfLadderOverlay = false,
): PdfMapAltitudeChunk[][] => {
  const filteredBoardHexes = Object.values(
    getBoardHexObstacleOriginsAndHexesAndEmpties(boardHexes),
  )
  const filteredBoardPieces = boardPieces
    .filter((boardPiece) => {
      const id = boardPiece.inventoryID
      return (
        id === Pieces.ropeLadder ||
        id === Pieces.battlement ||
        id === Pieces.roadWall ||
        id === Pieces.laurWallRuin1 ||
        id === Pieces.laurWallRuin2 ||
        id === Pieces.laurWallRuin3 ||
        id === Pieces.laurWallShort ||
        id === Pieces.laurWallShortStackable ||
        id === Pieces.laurWallLong ||
        id === Pieces.laurWallLongStackable ||
        id === Pieces.laurWallArch
      )
    })
    // move pieces up 1 altitude, otherwise a battlement on bottom level causes level-0 to show in pdf
    .map((boardPiece) => {
      const decodedPiece = boardPieceToDecodedPieceID(boardPiece)
      return {
        ...decodedPiece,
        altitude: decodedPiece.altitude + 1,
      }
    })

  // Group hexes and pieces by altitude
  const groupedHexesByAltitude = groupBy(filteredBoardHexes, 'altitude')
  const groupedPiecesByAltitude = groupBy(filteredBoardPieces, 'altitude')

  // Combine hexes and pieces into a single array of altitude groups
  const combinedGroups: PdfMapAltitudeChunk[] = uniq([
    ...Object.keys(groupedPiecesByAltitude),
    ...Object.keys(groupedHexesByAltitude),
  ]).map((altitude) => ({
    altitude: Number(altitude),
    hexes: groupedHexesByAltitude[altitude] || [],
    pieces: groupedPiecesByAltitude[altitude] || [],
  }))

  // Sort combined groups by altitude
  combinedGroups.sort((a, b) => a.altitude - b.altitude)

  const overlayAltitude =
    combinedGroups.length > 0
      ? combinedGroups[combinedGroups.length - 1].altitude + 1
      : 1

  if (isShowPdfOverlayLayer) {
    combinedGroups.push({
      altitude: overlayAltitude,
      label: 'Glyphs and Start Zones',
      isOverlay: true,
      hexes: [],
      pieces: [],
    })
  }

  // Ladder overlay levels come after the StartZones/Glyphs overlay level
  if (isShowPdfLadderOverlay) {
    const ladderLevels = getLadderOverlayLevels(boardPieces)
    ladderLevels.forEach((ladderStacks, i) => {
      combinedGroups.push({
        altitude: overlayAltitude,
        label:
          ladderLevels.length > 1
            ? `Ladders ${i + 1} of ${ladderLevels.length}`
            : 'Ladders',
        ladderStacks,
        hexes: [],
        pieces: [],
      })
    })
  }

  // Chunk combined groups into chunks of 6
  const chunks = []
  for (let i = 0; i < combinedGroups.length; i += 6) {
    chunks.push(combinedGroups.slice(i, i + 6))
  }

  return chunks
}

const HalfPageColumn = (props: PropsWithChildren) => {
  return (
    <View
      style={{
        flexBasis: '50%',
        flexDirection: 'column',
        flexShrink: 0,
        margin: 0,
      }}
    >
      {props.children}
    </View>
  )
}
const PdfLevelChunkHeading = ({
  group,
  isShowPdfLevelLogo,
}: {
  group: PdfMapAltitudeChunk
  isShowPdfLevelLogo: boolean
}) => {
  // Half levels (fluid stacked on fluid) get the plaque too, e.g. "LEVEL 01.5".
  if (group.label || !isShowPdfLevelLogo) {
    const margin =
      (group.isOverlay || group.ladderStacks) && isShowPdfLevelLogo
        ? LEVEL_LOGO_OUTLIER_LABEL_MARGIN
        : 0
    return (
      <Text
        style={{
          // The last level, the overlay layer, needs to be pushed down to line up with the chunks that have a level logo
          marginTop: margin,
          marginBottom: margin,
          fontSize: isShowPdfLevelLogo
            ? LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE
            : NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_FONT_SIZE,
          lineHeight: isShowPdfLevelLogo
            ? LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT
            : NO_LEVEL_LOGO_OVERLAY_LAYER_PDF_LINE_HEIGHT,
          fontFamily: isShowPdfLevelLogo
            ? 'Proxima Nova Condensed Black'
            : undefined,
        }}
      >
        {group.label ?? `Level: ${group.altitude}`}
      </Text>
    )
  }
  return <PdfLevelLogo level={group.altitude} width={LEVEL_LOGO_PDF_WIDTH} />
}

const RowWrapper = (props: PropsWithChildren) => {
  return (
    <View
      style={{
        flexBasis: '33%',
        maxHeight: '33%',
      }}
    >
      {props.children}
    </View>
  )
}

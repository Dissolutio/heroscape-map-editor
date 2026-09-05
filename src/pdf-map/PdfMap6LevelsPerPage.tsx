import { Page, Text, View } from '@react-pdf/renderer'
import { groupBy, keyBy, uniq } from 'lodash'
import type { PropsWithChildren } from 'react'
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
} from '../utils/map-utils'
import { PdfLevelLogo } from './PdfLevelLogo'
import { ReactPdfSvgMapDisplay } from './ReactPdfSvgMapDisplay'
export const PdfMapLevels6PerPage = ({
  boardHexes,
  boardPieces,
  isPdfColorBorders,
  isShowPdfOverlayLayer,
  isShowPdfOverlayOnPlacedLevel,
  isShowPdfGridLinesOverSublevels,
  isShowPdfLevelLogo,
  useLegacyStartZones,
  children,
}: PropsWithChildren<{
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
  isPdfColorBorders: boolean
  isShowPdfOverlayLayer: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowPdfGridLinesOverSublevels: boolean
  isShowPdfLevelLogo: boolean
  useLegacyStartZones: boolean
}>) => {
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const chunksOf6Levels = get6LevelChunk(
    boardHexesWithoutEmpties,
    boardPieces,
    isShowPdfOverlayLayer,
  )
  const decodedBoardPiecesArr = boardPieces
    .map((bp) => boardPieceToDecodedPieceID(bp))
    .filter((p) => Boolean(p))
  return (
    <>
      {chunksOf6Levels.map((chunk, i) => (
        <Page
          // biome-ignore lint/suspicious/noArrayIndexKey: <fine in this case>
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
            }}
          >
            <HalfPageColumn>
              {chunk.map((group, i) =>
                i < 3 ? (
                  <RowWrapper
                    // biome-ignore lint/suspicious/noArrayIndexKey: <fine in this case>
                    key={i}
                  >
                    <PdfLevelChunkHeading
                      group={group}
                      isShowPdfLevelLogo={isShowPdfLevelLogo}
                    />
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={Object.values(boardHexes)}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
                      isPdfColorBorders={isPdfColorBorders}
                      isShowPdfOverlayOnPlacedLevel={
                        isShowPdfOverlayOnPlacedLevel
                      }
                      isShowGridLinesOverSublevels={
                        isShowPdfGridLinesOverSublevels
                      }
                      useLegacyStartZones={useLegacyStartZones}
                    />
                  </RowWrapper>
                ) : null,
              )}
            </HalfPageColumn>
            <HalfPageColumn>
              {chunk.map((group, i) =>
                i >= 3 ? (
                  <RowWrapper
                    // biome-ignore lint/suspicious/noArrayIndexKey: <fine in this case>
                    key={i}
                  >
                    <PdfLevelChunkHeading
                      group={group}
                      isShowPdfLevelLogo={isShowPdfLevelLogo}
                    />
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={Object.values(boardHexes)}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
                      isPdfColorBorders={isPdfColorBorders}
                      isShowPdfOverlayOnPlacedLevel={
                        isShowPdfOverlayOnPlacedLevel
                      }
                      isShowGridLinesOverSublevels={
                        isShowPdfGridLinesOverSublevels
                      }
                      useLegacyStartZones={useLegacyStartZones}
                    />
                  </RowWrapper>
                ) : null,
              )}
            </HalfPageColumn>
          </View>
        </Page>
      ))}
    </>
  )
}

const get6LevelChunk = (
  boardHexes: BoardHexes,
  boardPieces: BoardPiece[],
  isShowPdfOverlayLayer: boolean,
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

  if (isShowPdfOverlayLayer) {
    const overlayAltitude =
      combinedGroups.length > 0
        ? combinedGroups[combinedGroups.length - 1].altitude + 1
        : 1

    combinedGroups.push({
      altitude: overlayAltitude,
      label: 'Glyphs and Start Zones',
      isOverlay: true,
      hexes: [],
      pieces: [],
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
  if (group.label || !isShowPdfLevelLogo) {
    return (
      <Text
        style={{
          // The last level, the overlay layer, needs to be pushed down to line up with the chunks that have a level logo
          // TODO this will change when we add different levels-per-page formats
          marginTop: group.label === 'Glyphs and Start Zones' ? 12.5 : 0,
          marginBottom: group.label === 'Glyphs and Start Zones' ? 12.5 : 0,
          fontSize: '10px',
          fontFamily: 'Proxima Nova Condensed Black',
        }}
      >
        {group.label ?? `Level: ${group.altitude}`}
      </Text>
    )
  }
  return <PdfLevelLogo level={group.altitude} width={60} />
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

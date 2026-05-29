import { Page, Text, View } from '@react-pdf/renderer'
import { groupBy, keyBy, uniq } from 'lodash'
import type { PropsWithChildren } from 'react'
import {
  type BoardPiece,
  type BoardHexes,
  type PdfMapAltitudeChunk,
  Pieces,
} from '../types'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import {
  boardPieceToDecodedPieceID,
  getBoardHexesSvgMapDimensions,
} from '../utils/map-utils'
import { ReactPdfSvgMapDisplay } from './ReactPdfSvgMapDisplay'
export const PdfMapLevels6PerPage = ({
  boardHexes,
  boardPieces,
  children,
}: PropsWithChildren<{
  boardHexes: BoardHexes
  boardPieces: BoardPiece[]
}>) => {
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const chunksOf6Levels = get6LevelChunk(boardHexesWithoutEmpties, boardPieces)
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
                    <Text style={{ fontSize: '10px' }}>
                      {group.label ?? `Level: ${group.altitude}`}
                    </Text>
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={Object.values(boardHexes)}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
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
                    <Text style={{ fontSize: '10px' }}>
                      {group.label ?? `Level: ${group.altitude}`}
                    </Text>
                    <ReactPdfSvgMapDisplay
                      chunk={chunk[i]}
                      boardPiecesArr={decodedBoardPiecesArr}
                      boardHexesArr={Object.values(boardHexes)}
                      width={width}
                      length={length}
                      viewingLevel={group.altitude}
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

  combinedGroups.push({
    altitude: overlayAltitude,
    label: 'Glyphs and Start Zones',
    isOverlay: true,
    hexes: [],
    pieces: [],
  })

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
const RowWrapper = (props: PropsWithChildren) => {
  return (
    <View
      style={{
        flexBasis: '33%',
        // maxHeight: '33%',
      }}
    >
      {props.children}
    </View>
  )
}

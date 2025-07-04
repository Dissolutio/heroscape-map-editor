import { Page, Text, View } from '@react-pdf/renderer'
import { groupBy, keyBy } from 'lodash'
import type { PropsWithChildren } from 'react'
import {
  type BoardHexes,
  type BoardPieces,
  type MapState,
  type PdfMapAltitudeChunk,
  Pieces,
} from '../types'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import {
  decodePieceID,
  getBoardHexesSvgMapDimensions,
} from '../utils/map-utils'
import { ReactPdfSvgMapDisplay } from './ReactPdfSvgMapDisplay'

export const PdfMapLevels4FirstPage = ({
  chunk,
  boardHexes,
  // boardPieces,
  decodedBoardPiecesArr,
  width,
  length,
  children,
}: any) => (
  <Page
    size="LETTER"
    style={{
      flexDirection: 'column',
      maxHeight: '100vh',
      padding: 5,
    }}
  >
    {children}
    <View style={{ flexDirection: 'row', flexGrow: 1 }}>
      <HalfPageColumn>
        {chunk.map((group: any, i: number) =>
          i < 2 ? (
            <RowWrapper key={i}>
              <Text style={{ fontSize: '10px' }}>Level: {group.altitude}</Text>
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
        {chunk.map((group: any, i: number) =>
          i >= 2 ? (
            <RowWrapper key={i}>
              <Text style={{ fontSize: '10px' }}>Level: {group.altitude}</Text>
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
)

export const PdfMapLevels6PerPage = ({
  boardHexes,
  boardPieces,
  // hexMap,
  children,
}: PropsWithChildren<MapState>) => {
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const boardHexAndPieceChunks = getBoardHexAndPieceChunks(
    boardHexesWithoutEmpties,
    boardPieces,
  )
  const decodedBoardPiecesArr = Object.keys(boardPieces)
    .map((id) => decodePieceID(id))
    .filter((p) => Boolean(p))
  return (
    <>
      {boardHexAndPieceChunks.map((chunk, i) => (
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
                      Level: {group.altitude}
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
                      Level: {group.altitude}
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

export const PdfMapLevelsPerPage = ({
  boardHexes,
  boardPieces,
  hexMap,
  children,
}: PropsWithChildren<MapState>) => {
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const boardHexAndPieceChunks = getBoardHexAndPieceChunks(
    boardHexesWithoutEmpties,
    boardPieces,
  )
  const decodedBoardPiecesArr = Object.keys(boardPieces)
    .map((id) => decodePieceID(id))
    .filter((p) => Boolean(p))

  return (
    <>
      {boardHexAndPieceChunks.map((chunk, i) =>
        i === 0 ? (
          <PdfMapLevels4FirstPage
            key={i}
            chunk={chunk}
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            decodedBoardPiecesArr={decodedBoardPiecesArr}
            width={width}
            length={length}
          >
            {children}
          </PdfMapLevels4FirstPage>
        ) : (
          <PdfMapLevels6PerPage
            key={i}
            hexMap={hexMap}
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            children={null}
          />
        ),
      )}
    </>
  )
}

const getBoardHexAndPieceChunks = (
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
): PdfMapAltitudeChunk[][] => {
  const filteredBoardHexes = Object.values(
    getBoardHexObstacleOriginsAndHexesAndEmpties(boardHexes),
  )
  const filteredBoardPieces = Object.keys(boardPieces)
    .filter((pieceID) => {
      const id = decodePieceID(pieceID).inventoryID
      return (
        id === Pieces.battlement ||
        id === Pieces.roadWall ||
        id === Pieces.laurWallLong ||
        id === Pieces.laurWallShort ||
        id === Pieces.laurWallRuin1
      )
    })
    .map((pieceID) => decodePieceID(pieceID))

  // Group hexes and pieces by altitude
  const groupedHexesByAltitude = groupBy(filteredBoardHexes, 'altitude')
  const groupedPiecesByAltitude = groupBy(filteredBoardPieces, 'altitude')

  // Combine hexes and pieces into a single array of altitude groups
  const combinedGroups = Object.keys(groupedHexesByAltitude).map(
    (altitude) => ({
      altitude: Number(altitude),
      hexes: groupedHexesByAltitude[altitude] || [],
      pieces: groupedPiecesByAltitude[altitude] || [],
    }),
  )

  // Sort combined groups by altitude
  combinedGroups.sort((a, b) => a.altitude - b.altitude)

  // Chunk combined groups: 4 for first page, 6 for the rest
  const chunks = []
  let i = 0
  if (combinedGroups.length > 0) {
    // First page: 4 levels
    chunks.push(combinedGroups.slice(0, 4))
    i = 4
  }
  // Subsequent pages: 6 levels per page
  for (; i < combinedGroups.length; i += 6) {
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

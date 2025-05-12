import { groupBy, keyBy } from 'lodash'
import { BoardHex, BoardHexes, BoardPieces, MapState, Pieces } from '../types'
import { getBoardHexObstacleOriginsAndHexesAndEmpties } from '../utils/board-utils'
import {
  decodePieceID,
  getBoardHexesSvgMapDimensions,
} from '../utils/map-utils'
import { Page, Text, View } from '@react-pdf/renderer'
import { Fragment, PropsWithChildren } from 'react'
import { ReactPdfSvgMapDisplay } from './ReactPdfSvgMapDisplay'


export const PdfMapLevels6PerPage = ({ boardHexes, boardPieces }: MapState) => {
  const { width, length } = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesWithoutEmpties = keyBy(
    Object.values(boardHexes).filter((hex) => hex.terrain !== 'empty'),
    'id',
  )
  const boardHexAndPieceChunks = getBoardHexAndPieceChunks(
    boardHexesWithoutEmpties,
    boardPieces,
  )
  return (
    <>
      {boardHexAndPieceChunks.map((chunk) => (
        <Page
          size="LETTER"
          style={{
            flexDirection: 'column',
            maxHeight: '100vh',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexGrow: 1,
            }}
          >
            <HalfPageColumn>
              {chunk.map((group, i) => (
                <Fragment key={group.altitude}>
                  {i < 3 && (
                    <View
                      style={{
                        flexBasis: '33%',
                      }}
                    >
                      <Text style={{ fontSize: '10px' }}>
                        Level: {group.altitude}
                      </Text>
                      <ReactPdfSvgMapDisplay
                        // levelHexArr={group.hexes}
                        boardHexesArr={Object.values(boardHexes)}
                        width={width}
                        length={length}
                        viewingLevel={group.altitude}
                      />
                    </View>
                  )}
                </Fragment>
              ))}
            </HalfPageColumn>
            <HalfPageColumn>
              {chunk.map((group, i) => (
                <Fragment key={group.altitude}>
                  {i >= 3 && (
                    <View
                      style={{
                        flexBasis: '33%',
                      }}
                    >
                      <Text style={{ fontSize: '10px' }}>
                        Level: {group.altitude}
                      </Text>
                      <ReactPdfSvgMapDisplay
                        // levelHexArr={group.hexes}
                        boardHexesArr={Object.values(boardHexes)}
                        width={width}
                        length={length}
                        viewingLevel={group.altitude}
                      />
                    </View>
                  )}
                </Fragment>
              ))}
            </HalfPageColumn>
          </View>
        </Page>
      ))}
    </>
  )
}

const getBoardHexAndPieceChunks = (
  boardHexes: BoardHexes,
  boardPieces: BoardPieces,
) => {
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
        id === Pieces.laurWallRuin
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
        flexGrow: 1,
        flexBasis: '50%',
        flexDirection: 'column',
        margin: 5,
      }}
    >
      {props.children}
    </View>
  )
}

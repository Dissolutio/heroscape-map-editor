import { useMediaQuery } from '@mui/material'
import { Document, Font, Image, Page, PDFViewer, Text, View } from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import { ReactPdfDownloadLink } from './ReactPdfDownloadLink'
import type { HexMap } from '../types'
import { PdfSvgHeroscapeLogo } from './PdfSvgHeroscapeLogo'
import { countTerrainSets, getSetsUsedText, decodePieceID } from '../utils/map-utils'

export function ReactPdfRoot() {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const isShowPDFInventory = useBoundStore((s) => s.isShowPDFInventory)
  const mapNotes = hexMap?.mapNotes ?? ''
  const mapPortraitBase64 = hexMap?.mapPortraitBase64 ?? ''
  const isMobile = useMediaQuery('(max-width:800px)')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
      }}
    >
      {isMobile ? (
        <ReactPdfDownloadLink>Download</ReactPdfDownloadLink>
      ) : (
        <PDFViewer width={'100%'} height={'100%'}>
          <Document title={hexMap.name}>
            <PdfMapLevels6PerPage
              boardHexes={boardHexes}
              boardPieces={boardPieces}
            >
              <MapPortraitHeader
                hexMap={hexMap}
                mapPortraitBase64={mapPortraitBase64}
                mapNotes={mapNotes}
              />
              {/* <MyCustomHeaderHeroscapeLogo
                boardHexes={boardHexes}
                boardPieces={boardPieces}
                hexMap={hexMap}
                /> */}
            </PdfMapLevels6PerPage>
            <PdfPieceInventory
              isShowPDFInventory={isShowPDFInventory}
              boardPieces={boardPieces}
            />
          </Document>
        </PDFViewer>
      )}
    </div>
  )
}

const MapPortraitHeader = ({
  hexMap,
  mapPortraitBase64,
  mapNotes,
}: {
  hexMap: HexMap
  mapPortraitBase64: string
  mapNotes: string
}) => {
  const notesHeight = 20 * Math.ceil(mapNotes.length / 134)
  const terrainSetCounts = countTerrainSets(hexMap.setsUsed ?? [])
  return (
    <View
      style={{
        flexDirection: 'column',
        flexGrow: 0,
        padding: 0,
        alignContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexGrow: 0,
          padding: 0,
          alignContent: 'center',
          alignItems: 'center',
          flexBasis: 50,
        }}
      >
        <View
          style={{
            flexBasis: 110,
          }}
        >
          <PdfSvgHeroscapeLogo
            svgProps={{
              height: '70%',
            }}
            fillColor="red"
          />
        </View>
        <Text style={{ fontSize: '20px' }}>{hexMap.name}</Text>
        {hexMap.author && (
          <Text style={{ fontSize: '12px', paddingLeft: 5 }}>
            by: {hexMap.author}
          </Text>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexGrow: 0,
          padding: 0,
          paddingBottom: 5,
          alignContent: 'center',
          alignItems: 'flex-start',
          // flexBasis: 30,
        }}
      >
        {Object.entries(terrainSetCounts).length > 0 && (
          <Text style={{ fontSize: '10px' }}>
            Requires: {getSetsUsedText(hexMap?.setsUsed ?? [])}
          </Text>
        )}
      </View>

      <View
        style={{
          flexBasis: notesHeight,
        }}
      >
        <Text style={{ fontSize: '10px' }}>
          {/* STRIP OUT LINE BREAKS */}
          {/* {mapNotes.replace(/(\r\n|\n|\r)/gm, "")} */}
          {mapNotes}
        </Text>
      </View>
      <View
        style={{
          flexBasis: mapPortraitBase64 ? 200 : 0,
        }}
      >
        {mapPortraitBase64 && (
          <Image
            src={mapPortraitBase64}
            style={{
              height: '200px',
              width: 'auto',
              // border: '1px solid red',
            }}
          />
        )}
      </View>
    </View>
  )
}

const PdfPieceInventory = ({
  isShowPDFInventory,
  boardPieces,
}: {
  isShowPDFInventory: boolean,
  boardPieces: string[]
}) => {
  if (!isShowPDFInventory || !boardPieces.length) {
    return null
  }

  // Decode placed pieces and count by inventoryID
  const decoded = (boardPieces || []).map((id) => decodePieceID(id))
  const counts: Record<string, number> = decoded.reduce((acc, p) => {
    const inventoryID = p?.inventoryID
    if (!inventoryID) return acc
    acc[inventoryID] = (acc[inventoryID] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const entries = Object.entries(counts)
    .map(([id, count]) => ({ id, count, title: piecesSoFar[id]?.title ?? id }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <Page
      // biome-ignore lint/suspicious/noArrayIndexKey: <fine in this case>
      size="LETTER"
      style={{
        flexDirection: 'column',
        maxHeight: '100vh',
        padding: 5,
      }}
    >

      <View
        style={{
          marginBottom: 8,
          padding: 4,
          flexDirection: 'column',
        }}
      >
        <Text
          style={{ fontSize: '16px', marginBottom: 2 }}>Inventory</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {entries.map((e) => (
            <View
              key={e.id}
              style={{
                width: '50%',
                flexDirection: 'row',
                // justifyContent: 'space-between',
                // paddingBottom: 2,
              }}
            >
              <Text style={{ fontSize: '12px' }}>{e.title} </Text>
              <Text style={{ fontSize: '12px' }}>x{e.count}</Text>
            </View>
          ))
          }
        </View>
      </View>
    </Page>
  )
}
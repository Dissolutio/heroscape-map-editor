import { useMediaQuery } from '@mui/material'
import {
  Document,
  Font,
  Image,
  Page,
  PDFViewer,
  Text,
  View,
} from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import { ReactPdfDownloadLink } from './ReactPdfDownloadLink'
import type { BoardPiece, HexMap } from '../types'
import { PdfSvgHeroscapeLogo } from './PdfSvgHeroscapeLogo'
import { countTerrainSets, getSetsUsedText } from '../utils/map-utils'
import {
  countPiecesUsedWithLaurStacking,
  getCombinedInventory,
  reconcileLaurLegacyToStackableUsage,
} from '../inventory/laurInventoryReconcile'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'fonts/Inter_18pt-Bold.ttf',
    },
  ],
})

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
              setsUsed={hexMap.setsUsed ?? []}
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
  setsUsed,
}: {
  isShowPDFInventory: boolean
  boardPieces: BoardPiece[]
  setsUsed: string[]
}) => {
  if (!isShowPDFInventory || !boardPieces.length) {
    return null
  }

  const countsBeforeReconcile = countPiecesUsedWithLaurStacking(boardPieces)
  const hasConstraints = Array.isArray(setsUsed) && setsUsed.length > 0
  const combinedInventory = getCombinedInventory(setsUsed)

  const counts = hasConstraints
    ? reconcileLaurLegacyToStackableUsage({
      usedInventory: countsBeforeReconcile,
      availableInventory: combinedInventory,
    }).reconciledUsedInventory
    : countsBeforeReconcile

  const entries = Object.entries(counts)
    .map(([id, count]) => ({ id, count, title: piecesSoFar[id]?.title ?? id }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <Page
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
        <Text style={{ fontSize: '16px', marginBottom: 2 }}>Inventory</Text>

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
          ))}
        </View>
      </View>
    </Page>
  )
}

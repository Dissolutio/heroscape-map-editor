import { useMediaQuery } from '@mui/material'
import { Document, Image, PDFViewer, Text, View } from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import { ReactPdfDownloadLink } from './ReactPdfDownloadLink'
import type { MapState } from '../types'
import { PdfSvgHeroscapeLogo } from './PdfSvgHeroscapeLogo'
import { terrainSetsByShortID } from '../data/terrainSets'

export function ReactPdfRoot() {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const mapNotes = useBoundStore((s) => s.mapNotes)
  const mapPortraitBase64 = useBoundStore((s) => s.mapPortraitBase64)
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
              hexMap={hexMap}
            >
              <MapPortraitHeader
                boardHexes={boardHexes}
                boardPieces={boardPieces}
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
          </Document>
        </PDFViewer>
      )}
    </div>
  )
}

function countTerrainSets(setsUsed: string[]): Record<string, number> {
  return setsUsed.reduce(
    (acc, setID) => {
      acc[setID] = (acc[setID] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}
const MapPortraitHeader = ({
  hexMap,
  mapPortraitBase64,
  mapNotes,
}: MapState & { mapPortraitBase64: string; mapNotes: string }) => {
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
        <Text style={{ fontSize: '12px', paddingLeft: 5 }}>
          by: {hexMap.author}
        </Text>
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
            Requires:{' '}
            {Object.entries(terrainSetCounts).map(([key, val], index) => {
              const isCommaAfter = !(
                index >=
                Object.entries(terrainSetCounts).length - 1
              )
              const setNameText = `${terrainSetsByShortID[key as keyof typeof terrainSetsByShortID]?.abbreviation}`
              const countText = `x${val ?? 0}`
              return `${setNameText} ${countText}${isCommaAfter ? ', ' : ''}`
            })}
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

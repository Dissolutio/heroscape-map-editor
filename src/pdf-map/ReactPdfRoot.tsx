import { useMediaQuery } from '@mui/material'
import { Document, Image, PDFViewer, Text, View } from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import { ReactPdfDownloadLink } from './ReactPdfDownloadLink'
import type { MapState } from '../types'
import { PdfSvgHeroscapeLogo } from './PdfSvgHeroscapeLogo'

export function ReactPdfRoot() {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  // const mapPortraitBase64 = useBoundStore((s) => s.mapPortraitBase64)
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
              {/* <MapPortraitHeader
                boardHexes={boardHexes}
                boardPieces={boardPieces}
                hexMap={hexMap}
                mapPortraitBase64={mapPortraitBase64}
              /> */}
              <MyCustomHeaderHeroscapeLogo
                boardHexes={boardHexes}
                boardPieces={boardPieces}
                hexMap={hexMap}
              />
            </PdfMapLevels6PerPage>
          </Document>
        </PDFViewer>
      )}
    </div>
  )
}

const MyCustomHeader = ({ hexMap }: MapState) => {
  return (
    <View
      style={{
        flexDirection: 'column',
        flexGrow: 0,
      }}
    >
      <Text style={{ fontSize: '20px', alignSelf: 'center' }}>
        {hexMap.name}
      </Text>
      {/* <View
                    style={{
                      flexDirection: 'row',
                      flexGrow: 1,
                      justifyContent: 'center',
                      alignContent: 'center'
                    }}
                  >
                    <Text style={{ fontSize: '12px', alignSelf: 'center' }}>
                      by: dissolutio
                    </Text>
                    <Svg viewBox="0 0 128 128" width='12' height='12'>
                      <Path
                        d="M130.637322,82.7564373 C114.220681,88.0865156 92.5094947,111.787597 99.829469,126.853952 C100.326943,127.919968 99.829469,129.661127 96.2760834,129.021517 C84.2656402,126.747351 82.3112781,122.945228 73.8542205,112.320605 C67.2804572,104.041217 60.5290246,85.279341 48.9805216,85.3148749 C34.3050392,85.3148749 36.8634768,98.9954093 25.3505076,89.1880651 C17.6261255,81.614654 10.6855651,73.2812195 4.63426972,64.3143662 C2.85757694,61.2584546 4.91854057,58.7355509 9.50240794,58.7355509 C17.3198562,58.7355509 25.1373044,59.3040926 32.9192188,59.3040926 C34.0879786,59.3472621 35.2200544,58.8918967 36.0333893,58.0514507 C36.8467241,57.2110047 37.2647376,56.0646112 37.1832815,54.8978945 L37.1832815,26.0444037 C37.1832815,8.27747586 33.6298959,5.89670753 51.7876962,6.0033091 C73.9963559,6.0033091 61.1331002,20.2168514 73.5344158,29.8820601 C79.894976,34.7501983 88.7784399,35.4253416 96.7380235,35.6385447 C104.697607,35.8517478 115.819704,31.871956 122.855407,37.6284406 C129.891111,43.3849252 134.368377,72.487153 130.672856,82.7564373 L130.637322,82.7564373 Z"
                        fill='blue'
                      />
                    </Svg>
                  </View> */}
      <Text style={{ fontSize: '12px', alignSelf: 'center', padding: 5 }}>
        by: dissolutio
      </Text>
      <Text style={{ fontSize: '14px', alignSelf: 'center', padding: 5 }}>
        Uses: Battle for the Wellspring (1xBftW)
      </Text>
      <Text style={{ fontSize: '14px', alignSelf: 'center', padding: 5 }}>
        For 3 players (300 - 500 points each) (2 Permenant Power Glyphs)
      </Text>
      <Text style={{ fontSize: '14px', alignSelf: 'center', padding: 5 }}>
        The first time a unit moves into battle, they must exit the water space
        and never return.
      </Text>
    </View>
  )
}
const MyCustomHeaderHeroscapeLogo = ({ hexMap }: MapState) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexGrow: 0,
        padding: 0,
        alignContent: 'center',
        alignItems: 'center',
        height: 50,
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
      <Text style={{ fontSize: '12px', paddingLeft: 5 }}>by:</Text>
    </View>
  )
}
const MapPortraitHeader = ({
  hexMap,
  mapPortraitBase64,
}: MapState & { mapPortraitBase64: string }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexGrow: 0,
        padding: 0,
        alignContent: 'center',
        alignItems: 'center',
        height: 50,
      }}
    >
      <View
        style={{
          flexBasis: 110,
        }}
      >
        <Image
          src={mapPortraitBase64}
          style={{
            // width: '30%',
            maxHeight: '100%',
          }}
        />
      </View>
      <Text style={{ fontSize: '20px' }}>{hexMap.name}</Text>
      <Text style={{ fontSize: '12px', paddingLeft: 5 }}>by:</Text>
    </View>
  )
}

import { useMediaQuery } from '@mui/material'
import {
  Document,
  PDFViewer,
} from '@react-pdf/renderer'
import useBoundStore from '../store/store'
import { ReactPdfDownloadLink } from './ReactPdfDownloadLink'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'

export function ReactPdfRoot() {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
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
        <ReactPdfDownloadLink
        >
          Download!
        </ReactPdfDownloadLink>
      ) : (
        <PDFViewer width={'100%'} height={'100%'}>
          <Document title={hexMap.name}>
            <PdfMapLevels6PerPage
              boardHexes={boardHexes}
              boardPieces={boardPieces}
              hexMap={hexMap}
            />
          </Document>
        </PDFViewer>
      )}
    </div>
  )
}

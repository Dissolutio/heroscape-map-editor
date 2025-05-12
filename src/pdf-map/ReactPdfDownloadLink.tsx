import { Document, PDFDownloadLink } from '@react-pdf/renderer'
import { PropsWithChildren } from 'react'
import useBoundStore from '../store/store'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'

export const ReactPdfDownloadLink = (props: PropsWithChildren) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  return (
    <PDFDownloadLink
      document={
        <Document title={hexMap.name}>
          <PdfMapLevels6PerPage
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            hexMap={hexMap}
          />
        </Document>
      }
      fileName={`${hexMap.name}.pdf`}
    >
      {props.children}
    </PDFDownloadLink>
  )
}

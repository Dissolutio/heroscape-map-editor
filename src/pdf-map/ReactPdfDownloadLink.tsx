import { Document, PDFDownloadLink } from '@react-pdf/renderer'
import type { PropsWithChildren } from 'react'
import useBoundStore from '../store/store'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'

export const ReactPdfDownloadLink = (props: PropsWithChildren) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const hexMap = useBoundStore((s) => s.hexMap)
  const isPdfColorBorders = useBoundStore((s) => s.isPdfColorBorders)
  const isShowPdfOverlayLayer = useBoundStore((s) => s.isShowPdfOverlayLayer)
  const isShowPdfOverlayOnPlacedLevel = useBoundStore(
    (s) => s.isShowPdfOverlayOnPlacedLevel,
  )
  const isShowPdfGridLinesOverSublevels = useBoundStore(
    (s) => s.isShowPdfGridLinesOverSublevels,
  )
  const isShowPdfLevelLogo = useBoundStore((s) => s.isShowPdfLevelLogo)
  const isShowPdfTileLetters = useBoundStore((s) => s.isShowPdfTileLetters)
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  return (
    <PDFDownloadLink
      document={
        <Document title={hexMap.name}>
          <PdfMapLevels6PerPage
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            isPdfColorBorders={isPdfColorBorders}
            isShowPdfOverlayLayer={isShowPdfOverlayLayer}
            isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
            isShowPdfGridLinesOverSublevels={isShowPdfGridLinesOverSublevels}
            isShowPdfLevelLogo={isShowPdfLevelLogo}
            isShowPdfTileLetters={isShowPdfTileLetters}
            useLegacyStartZones={useLegacyStartZones}
          />
        </Document>
      }
      fileName={`${hexMap.name}.pdf`}
    >
      {props.children}
    </PDFDownloadLink>
  )
}

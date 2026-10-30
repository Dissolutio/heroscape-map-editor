import { Document, PDFDownloadLink } from '@react-pdf/renderer'
import { useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import useBoundStore from '../store/store'
import { makeBuriedMarksByUID } from '../utils/tileMarks'
import { PdfMapLevels6PerPage } from './PdfMap6LevelsPerPage'
import { registerPdfFonts } from './registerPdfFonts'

registerPdfFonts()

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
  const isShowPdfBuriedMarks = useBoundStore((s) => s.isShowPdfBuriedMarks)
  const genericTerrainColorsKey = useBoundStore(
    (s) =>
      `${s.genericSolidCapColor}|${s.genericSolidSideColor}|${s.genericFluidCapColor}|${s.genericFluidSideColor}|${s.isTransparentGlyphSpaces}|${s.isHideHeightsOnGlyphs}`,
  )
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const is2DOverlayLevelEnabled = useBoundStore(
    (s) => s.is2DOverlayLevelEnabled,
  )
  const buriedMarksByUID = useMemo(
    () => makeBuriedMarksByUID(boardHexes, boardPieces),
    [boardHexes, boardPieces],
  )
  return (
    <PDFDownloadLink
      document={
        <Document key={genericTerrainColorsKey} title={hexMap.name}>
          <PdfMapLevels6PerPage
            boardHexes={boardHexes}
            boardPieces={boardPieces}
            isPdfColorBorders={isPdfColorBorders}
            isShowPdfOverlayLayer={isShowPdfOverlayLayer}
            isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
            isShowPdfGridLinesOverSublevels={isShowPdfGridLinesOverSublevels}
            isShowPdfLevelLogo={isShowPdfLevelLogo}
            isShowPdfTileLetters={isShowPdfTileLetters}
            isShowPdfBuriedMarks={isShowPdfBuriedMarks}
            buriedMarksByUID={buriedMarksByUID}
            useLegacyStartZones={useLegacyStartZones}
            is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
            objectiveMarkers={hexMap.objectiveMarkers ?? []}
          />
        </Document>
      }
      fileName={`${hexMap.name}.pdf`}
    >
      {props.children}
    </PDFDownloadLink>
  )
}

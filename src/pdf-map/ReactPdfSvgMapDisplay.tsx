import { Line, Svg } from '@react-pdf/renderer'
import { piecesSoFar } from '../data/pieces'
import type { BoardHex, DecodedPieceID, PdfMapAltitudeChunk } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'
import { PdfMapHex } from './PdfMapHex'

type ReactPdfSvgMapDisplayProps = {
  width: number
  length: number
  boardHexesArr: BoardHex[]
  boardPiecesArr: DecodedPieceID[]
  viewingLevel: number
  isPdfColorBorders: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowGridLinesOverSublevels: boolean
  useLegacyStartZones: boolean
  chunk?: PdfMapAltitudeChunk
}

export const ReactPdfSvgMapDisplay = ({
  width,
  length,
  boardHexesArr,
  boardPiecesArr,
  viewingLevel,
  isPdfColorBorders,
  isShowPdfOverlayOnPlacedLevel,
  isShowGridLinesOverSublevels,
  useLegacyStartZones,
  chunk,
}: ReactPdfSvgMapDisplayProps) => {
  const emptyHexesArr = boardHexesArr.filter((hex) => hex.terrain === 'empty')
  const nonEmptyHexesArr = boardHexesArr.filter(
    (hex) => hex.terrain !== 'empty',
  )
  const adjustXForNew00Centers = 1.5 * SVG_HEX_APOTHEM
  const adjustYForNew00Centers = 1.2 * SVG_HEX_RADIUS
  const isOverlayViewing = Boolean(chunk?.isOverlay)
  const subLevelHexes = nonEmptyHexesArr.filter(
    (h) => h.altitude < viewingLevel,
  )
  const visibleBoardPieces = boardPiecesArr.filter((bp) => {
    if (piecesSoFar[bp.inventoryID].isOverlayPiece) {
      return (
        isOverlayViewing ||
        (isShowPdfOverlayOnPlacedLevel && bp.altitude <= viewingLevel)
      )
    }
    return bp.altitude <= viewingLevel
  })
  // pieces sit on top of the hex they are placed on, so their displayed level is altitude + 1 (matches PdfMapBoardPiece)
  const subLevelPieces = visibleBoardPieces.filter(
    (bp) => bp.altitude + 1 < viewingLevel,
  )
  const currentLevelPieces = visibleBoardPieces.filter(
    (bp) => bp.altitude + 1 >= viewingLevel,
  )
  const viewBoxStr = `${-adjustXForNew00Centers} ${-adjustYForNew00Centers} ${width + adjustXForNew00Centers} ${length + adjustYForNew00Centers}`
  const subLevelHexesEls = subLevelHexes
    .sort((a, b) => a.altitude - b.altitude)
    .map((hex) => (
      <PdfMapHex
        key={hex.id}
        hex={hex}
        viewingLevel={viewingLevel}
        isOverlayViewing={isOverlayViewing}
        isPdfColorBorders={isPdfColorBorders}
        isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
        useLegacyStartZones={useLegacyStartZones}
      />
    ))
  const subLevelPiecesEls = subLevelPieces
    .sort((a, b) => a.altitude - b.altitude)
    .map((bp) => (
      <PdfMapBoardPiece
        key={bp.boardPieceID}
        piece={bp}
        viewingLevel={viewingLevel}
      />
    ))
  const emptyHexesEls = emptyHexesArr.map((hex) => (
    <PdfMapHex
      key={hex.id}
      hex={hex}
      viewingLevel={viewingLevel}
      isOverlayViewing={isOverlayViewing}
      isPdfColorBorders={isPdfColorBorders}
      isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
      useLegacyStartZones={useLegacyStartZones}
    />
  ))
  return (
    <Svg viewBox={viewBoxStr}>
      {/* <PdfSvgXYHelperLines length={length} width={width} /> */}
      {/* rendering the empty hexes AFTER the sublevel hexes/pieces renders grid-lines over the sublevels */}
      {isShowGridLinesOverSublevels ? (
        <>
          {subLevelHexesEls}
          {subLevelPiecesEls}
          {emptyHexesEls}
        </>
      ) : (
        <>
          {emptyHexesEls}
          {subLevelHexesEls}
          {subLevelPiecesEls}
        </>
      )}
      {nonEmptyHexesArr
        .filter((h) => h.altitude === viewingLevel)
        .map((hex) => (
          <PdfMapHex
            key={hex.id}
            hex={hex}
            viewingLevel={viewingLevel}
            isOverlayViewing={isOverlayViewing}
            isPdfColorBorders={isPdfColorBorders}
            isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
            useLegacyStartZones={useLegacyStartZones}
          />
        ))}
      {currentLevelPieces
        .sort((a, b) => a.altitude - b.altitude)
        .map((bp) => (
          <PdfMapBoardPiece
            key={bp.boardPieceID}
            piece={bp}
            viewingLevel={viewingLevel}
          />
        ))}
    </Svg>
  )
}
// const PdfSvgXYHelperLines = ({
//   length,
//   width,
// }: { length: number; width: number }) => {
//   return (
//     <>
//       <Line x1={0} x2={0} y1={0} y2={length} stroke="red" strokeWidth={0.5} />
//       <Line x1={0} x2={width} y1={0} y2={0} stroke="blue" strokeWidth={0.5} />
//     </>
//   )
// }

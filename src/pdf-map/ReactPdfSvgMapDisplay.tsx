import { Line, Svg } from '@react-pdf/renderer'
import { piecesSoFar } from '../data/pieces'
import { getBoardPieceOriginHexes } from '../pdf-svg-shared/boardPieceOriginHexes'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import { getPdfVisibleObjectiveMarkers } from '../pdf-svg-shared/objectiveMarkerExport'
import type { BoardHex, DecodedPieceID, PdfMapAltitudeChunk } from '../types'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import type { BuriedMarksByUID } from '../utils/tileMarks'
import { PdfObjectiveMarkerOverlay } from './PdfObjectiveMarkers'
import { PdfLadderOverlayStack } from './PdfLadderOverlay'
import { PdfMapBoardPiece } from './PdfMapBoardPiece'
import { PdfMapHex } from './PdfMapHex'

type ReactPdfSvgMapDisplayProps = {
  width: number
  length: number
  boardHexesArr: BoardHex[]
  boardPiecesArr: DecodedPieceID[]
  viewingLevel: number
  overlayLevel: number
  isPdfColorBorders: boolean
  isShowPdfOverlayOnPlacedLevel: boolean
  isShowGridLinesOverSublevels: boolean
  isShowPdfTileLetters: boolean
  isShowPdfBuriedMarks: boolean
  buriedMarksByUID: BuriedMarksByUID
  useLegacyStartZones: boolean
  is2DOverlayLevelEnabled: boolean
  objectiveMarkers: ObjectiveMarker[]
  chunk?: PdfMapAltitudeChunk
}

export const ReactPdfSvgMapDisplay = ({
  width,
  length,
  boardHexesArr,
  boardPiecesArr,
  viewingLevel,
  overlayLevel,
  isPdfColorBorders,
  isShowPdfOverlayOnPlacedLevel,
  isShowGridLinesOverSublevels,
  isShowPdfTileLetters,
  isShowPdfBuriedMarks,
  buriedMarksByUID,
  useLegacyStartZones,
  is2DOverlayLevelEnabled,
  objectiveMarkers,
  chunk,
}: ReactPdfSvgMapDisplayProps) => {
  const emptyHexesArr = boardHexesArr.filter((hex) => hex.terrain === 'empty')
  const nonEmptyHexesArr = boardHexesArr.filter(
    (hex) => hex.terrain !== 'empty',
  )
  const pieceOriginHexes = getBoardPieceOriginHexes(
    boardPiecesArr,
    boardHexesArr,
  )
  const pieceOriginBySourceID = new Map(
    pieceOriginHexes
      .filter((origin) => origin.sourceHexID)
      .map((origin) => [origin.sourceHexID, origin.hex]),
  )
  const renderHexes = [
    ...nonEmptyHexesArr.map((hex) => pieceOriginBySourceID.get(hex.id) ?? hex),
    ...pieceOriginHexes
      .filter((origin) => !origin.sourceHexID)
      .map((origin) => origin.hex),
  ]
  const adjustXForNew00Centers = 1.5 * SVG_HEX_APOTHEM
  const adjustYForNew00Centers = 1.2 * SVG_HEX_RADIUS
  const isOverlayViewing = Boolean(chunk?.isOverlay)
  const subLevelHexes = renderHexes.filter((h) => h.altitude < viewingLevel)
  const ladderStacks = chunk?.ladderStacks
  const visibleBoardPieces = boardPiecesArr.filter((bp) => {
    if (piecesSoFar[bp.inventoryID]?.isOverlayPiece) {
      // the ladder overlay level is a plain top-down background
      if (ladderStacks) return false
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
  const visibleObjectiveMarkers = getPdfVisibleObjectiveMarkers(
    objectiveMarkers,
    viewingLevel,
    isOverlayViewing,
    isShowPdfOverlayOnPlacedLevel,
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
        isShowPdfTileLetters={isShowPdfTileLetters}
        isShowPdfBuriedMarks={isShowPdfBuriedMarks}
        buriedMarksByUID={buriedMarksByUID}
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
        overlayLevel={overlayLevel}
        useLegacyStartZones={useLegacyStartZones}
        is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
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
      isShowPdfTileLetters={isShowPdfTileLetters}
      isShowPdfBuriedMarks={isShowPdfBuriedMarks}
      buriedMarksByUID={buriedMarksByUID}
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
      {renderHexes
        .filter((h) => h.altitude === viewingLevel)
        .map((hex) => (
          <PdfMapHex
            key={hex.id}
            hex={hex}
            viewingLevel={viewingLevel}
            isOverlayViewing={isOverlayViewing}
            isPdfColorBorders={isPdfColorBorders}
            isShowPdfOverlayOnPlacedLevel={isShowPdfOverlayOnPlacedLevel}
            isShowPdfTileLetters={isShowPdfTileLetters}
            isShowPdfBuriedMarks={isShowPdfBuriedMarks}
            buriedMarksByUID={buriedMarksByUID}
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
            overlayLevel={overlayLevel}
            useLegacyStartZones={useLegacyStartZones}
          />
        ))}
      {ladderStacks?.map((stack) => (
        <PdfLadderOverlayStack
          key={`${stack.edgeId}~${stack.runIndex}`}
          stack={stack}
        />
      ))}
      {visibleObjectiveMarkers.length > 0 && (
        <PdfObjectiveMarkerOverlay markers={visibleObjectiveMarkers} />
      )}
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

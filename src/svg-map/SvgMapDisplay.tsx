import { useEffect, useMemo, useState } from 'react'
import { piecesSoFar } from '../data/pieces'
import {
  getObjectiveMarkerLegendLayout,
  getSvgObjectiveMarkerFooterHeight,
  getSvgObjectiveMarkerKeyFontSize,
  getSvgVisibleObjectiveMarkers,
} from '../pdf-svg-shared/objectiveMarkerExport'
import { getPieceKeyModel } from '../pdf-svg-shared/pieceKey'
import useBoundStore from '../store/store'
import { SVG_HEX_APOTHEM, SVG_HEX_RADIUS } from '../utils/constants'
import {
  boardPieceToDecodedPieceID,
  getBoardHexesSvgMapDimensions,
  getOverlayLevel,
} from '../utils/map-utils'
import {
  BURIED_MARKS_KEY,
  getBuriedMarksForHex,
  makeBuriedMarksByUID,
} from '../utils/tileMarks'
import { SvgMapBoardPiece } from './SvgMapBoardPiece'
import { SvgMapHex } from './SvgMapHex'
import {
  SvgObjectiveMarkerLegend,
  SvgObjectiveMarkerOverlay,
} from './SvgObjectiveMarkerOverlay'
import {
  SvgPieceKey,
  getSvgPieceKeyHeight,
  getSvgPieceKeyWidth,
} from './SvgPieceKey'

const adjustXForNew00Centers = -1 * SVG_HEX_APOTHEM
const adjustYForNew00Centers = -1 * SVG_HEX_RADIUS

const SvgMapDisplay = ({
  legendOnly = false,
  viewingLevelOverride,
  overlayEnabledOverride,
}: {
  legendOnly?: boolean
  viewingLevelOverride?: number
  overlayEnabledOverride?: boolean
}) => {
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const boardPieces = useBoundStore((s) => {
    return s.boardPieces
  })
  const isShow2DExportBuriedMarks = useBoundStore(
    (s) => s.isShow2DExportBuriedMarks,
  )
  const buriedMarksByUID = useMemo(
    () => makeBuriedMarksByUID(boardHexes, boardPieces),
    [boardHexes, boardPieces],
  )
  const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
  const storeViewingLevel = useBoundStore((s) => s.viewingLevel)
  const viewingLevel = viewingLevelOverride ?? storeViewingLevel
  const storeOverlayEnabled = useBoundStore((s) => s.is2DOverlayLevelEnabled)
  const is2DOverlayLevelEnabled = overlayEnabledOverride ?? storeOverlayEnabled
  const isShowPieceKey = useBoundStore((s) => s.isShowPdfPieceLegend)
  const useTerrainBorderColor = useBoundStore((s) => s.isPdfColorBorders)
  const decodedBoardPiecesArr = boardPieces
    .map((bp) => boardPieceToDecodedPieceID(bp))
    .filter((p) => Boolean(p))
  const hexMap = useBoundStore((state) => state.hexMap)
  const mapDimensions = getBoardHexesSvgMapDimensions(boardHexes)
  const boardHexesArr = Object.values(boardHexes)
    // sort by altitude, so pieces don't get painted over higher altitude shapes (easy to see with Ruins 2/3 and adjacent 1-hex land)
    .sort((a, b) => a.altitude - b.altitude)
  const hasVisibleBuriedMarks =
    isShow2DExportBuriedMarks &&
    boardHexesArr.some((hex) =>
      getBuriedMarksForHex(hex, viewingLevel, buriedMarksByUID),
    )
  const visibleObjectiveMarkers = getSvgVisibleObjectiveMarkers(
    hexMap.objectiveMarkers ?? [],
    viewingLevel,
    overlayLevel,
    is2DOverlayLevelEnabled,
  )
  const namedObjectiveMarkers = visibleObjectiveMarkers.filter((marker) =>
    marker.name?.trim(),
  )

  const [viewBox, setViewBox] = useState({
    x: adjustXForNew00Centers,
    y: adjustYForNew00Centers,
    width: mapDimensions.width,
    height: mapDimensions.length - adjustYForNew00Centers,
  })
  const keyFontSize = getSvgObjectiveMarkerKeyFontSize(viewBox.width)
  const objectiveLegendRowHeight = getObjectiveMarkerLegendLayout(
    namedObjectiveMarkers,
    keyFontSize,
  ).rowHeight
  const objectiveLegendHeight =
    namedObjectiveMarkers.length * objectiveLegendRowHeight
  const keyFooterHeight = getSvgObjectiveMarkerFooterHeight(
    namedObjectiveMarkers.length,
    hasVisibleBuriedMarks,
    keyFontSize,
    objectiveLegendRowHeight,
  )
  const pieceKeyModel = getPieceKeyModel(
    boardPieces,
    boardHexes,
    useTerrainBorderColor,
  )
  const isLegendOnly =
    legendOnly || (isShowPieceKey && viewingLevel === overlayLevel + 1)
  const shouldRenderPieceKey = isShowPieceKey || legendOnly
  const legendWidth = getSvgPieceKeyWidth(pieceKeyModel, mapDimensions.width)
  const legendHeight = getSvgPieceKeyHeight(pieceKeyModel, mapDimensions.width)
  const viewboxStr = isLegendOnly
    ? `0 0 ${legendWidth} ${legendHeight}`
    : `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height + keyFooterHeight}`
  const objectiveLegendY = viewBox.y + viewBox.height + keyFontSize * 1.1
  const buriedMarksY =
    objectiveLegendHeight > 0
      ? objectiveLegendY + objectiveLegendHeight + keyFontSize
      : viewBox.y + viewBox.height + keyFontSize * 1.1
  // const isPointerDown = useRef(false)

  // Effect to update the viewBox when map dimensions change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setViewBox({
      x: adjustXForNew00Centers,
      y: adjustYForNew00Centers,
      width: getBoardHexesSvgMapDimensions(boardHexes).width,
      height: getBoardHexesSvgMapDimensions(boardHexes).length,
    })
  }, [boardHexes, hexMap.id])

  return (
    <svg
      id="2d-svg-view"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      // ref={svgRef}
      viewBox={viewboxStr}
      style={{
        maxHeight: isLegendOnly ? 'none' : '99%',
        width: isLegendOnly
          ? `${(legendWidth / mapDimensions.width) * 100}%`
          : '100%',
        overflow: 'auto',
      }}
    >
      <title>{isLegendOnly ? '2D Map Legend' : '2D Map Display'}</title>

      {isLegendOnly ? (
        shouldRenderPieceKey && (
          <SvgPieceKey
            boardPieces={boardPieces}
            boardHexes={boardHexes}
            x={0}
            y={0}
            width={legendWidth}
          />
        )
      ) : (
        <g>
          {boardHexesArr.map((hex) => (
            <SvgMapHex
              key={hex.id}
              hex={hex}
              buriedMarksByUID={buriedMarksByUID}
            />
          ))}
          {decodedBoardPiecesArr
            .filter((bp) => {
              // when overlay mode is enabled, hide glyph/startzone/objective-like pieces
              if (is2DOverlayLevelEnabled) {
                if (piecesSoFar[bp.inventoryID]?.isOverlayPiece) {
                  return viewingLevel === overlayLevel
                }
                return bp.altitude <= viewingLevel
              }
              return bp.altitude <= viewingLevel
            })
            .sort((a, b) => a.altitude - b.altitude)
            .map((bp) => (
              <SvgMapBoardPiece
                key={bp.boardPieceID}
                piece={bp}
                viewingLevel={viewingLevel}
                overlayLevel={overlayLevel}
              />
            ))}
          <SvgObjectiveMarkerOverlay markers={visibleObjectiveMarkers} />
          <SvgObjectiveMarkerLegend
            markers={namedObjectiveMarkers}
            x={viewBox.x + 0.1}
            y={objectiveLegendY}
            fontSize={keyFontSize}
            rowHeight={objectiveLegendRowHeight}
          />
          {hasVisibleBuriedMarks && (
            <text
              x={viewBox.x + 0.1}
              y={buriedMarksY}
              fill="#000000"
              fontSize={keyFontSize}
            >
              {BURIED_MARKS_KEY}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
export default SvgMapDisplay
// const AxesHelper = ({ width, length }: { width: number; length: number }) => {
//   return (
//     <>
//       <line
//         x1={adjustXForNew00Centers}
//         y1={adjustYForNew00Centers}
//         x2={adjustXForNew00Centers}
//         y2={length}
//         stroke="red"
//         strokeWidth={0.5}
//       />
//       <line
//         x1={adjustXForNew00Centers}
//         y1={adjustYForNew00Centers}
//         x2={width}
//         y2={adjustYForNew00Centers}
//         stroke="blue"
//         strokeWidth={0.5}
//       />
//     </>
//   )
// }

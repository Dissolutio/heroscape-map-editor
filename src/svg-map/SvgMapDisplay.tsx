import { useEffect, useMemo, useState } from 'react'
import { piecesSoFar } from '../data/pieces'
import {
  getObjectiveMarkerLegendLayout,
  getSvgObjectiveMarkerFooterHeight,
  getSvgObjectiveMarkerKeyFontSize,
  getSvgVisibleObjectiveMarkers,
} from '../pdf-svg-shared/objectiveMarkerExport'
import { getBoardPieceOriginHexes } from '../pdf-svg-shared/boardPieceOriginHexes'
import {
  type PieceKeyModel,
  getPieceKeyModel,
} from '../pdf-svg-shared/pieceKey'
import {
  type GlyphExportSettings,
  makeGlyphCoordinateLookup,
} from '../pdf-svg-shared/glyphExportOptions'
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
import {
  SvgMapShapeSettingsContext,
  type SvgMapShapeSettings,
} from './SvgMapShapes'
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
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const isShow2DExportTileLetters = useBoundStore(
    (s) => s.isShow2DExportTileLetters,
  )
  const isShow2DExportBuriedMarks = useBoundStore(
    (s) => s.isShow2DExportBuriedMarks,
  )
  const buriedMarksByUID = useMemo(
    () => makeBuriedMarksByUID(boardHexes, boardPieces),
    [boardHexes, boardPieces],
  )
  const overlayLevel = useMemo(
    () => getOverlayLevel(boardPieces, boardHexes),
    [boardPieces, boardHexes],
  )
  const storeViewingLevel = useBoundStore((s) => s.viewingLevel)
  const viewingLevel = viewingLevelOverride ?? storeViewingLevel
  const storeOverlayEnabled = useBoundStore((s) => s.is2DOverlayLevelEnabled)
  const is2DOverlayLevelEnabled = overlayEnabledOverride ?? storeOverlayEnabled
  const isShowPieceKey = useBoundStore((s) => s.isShowPdfPieceLegend)
  const useTerrainBorderColor = useBoundStore((s) => s.isPdfColorBorders)
  const isHideHeightsOnGlyphs = useBoundStore((s) => s.isHideHeightsOnGlyphs)
  const genericSolidCapColor = useBoundStore((s) => s.genericSolidCapColor)
  const genericFluidCapColor = useBoundStore((s) => s.genericFluidCapColor)
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const glyphCoordinates = useMemo(
    () => makeGlyphCoordinateLookup(boardHexes),
    [boardHexes],
  )
  const glyphExportSettings = useMemo<GlyphExportSettings>(
    () => ({ isHideHeightsOnGlyphs }),
    [isHideHeightsOnGlyphs],
  )
  const shapeSettings = useMemo<SvgMapShapeSettings>(
    () => ({
      genericSolidCapColor,
      genericFluidCapColor,
      useLegacyStartZones,
    }),
    [genericSolidCapColor, genericFluidCapColor, useLegacyStartZones],
  )
  const decodedBoardPiecesArr = useMemo(
    () =>
      boardPieces
        .map((bp) => boardPieceToDecodedPieceID(bp))
        .filter((p) => Boolean(p)),
    [boardPieces],
  )
  const pieceOriginHexes = useMemo(
    () => getBoardPieceOriginHexes(decodedBoardPiecesArr, boardHexes),
    [decodedBoardPiecesArr, boardHexes],
  )
  const pieceOriginBySourceID = useMemo(
    () =>
      new Map(
        pieceOriginHexes
          .filter((origin) => origin.sourceHexID)
          .map((origin) => [origin.sourceHexID, origin.hex]),
      ),
    [pieceOriginHexes],
  )
  const hexMap = useBoundStore((state) => state.hexMap)
  const mapDimensions = useMemo(
    () => getBoardHexesSvgMapDimensions(boardHexes),
    [boardHexes],
  )
  const boardHexesArr = useMemo(
    () => Object.values(boardHexes).sort((a, b) => a.altitude - b.altitude),
    [boardHexes],
  )
  const buriedMarkLevels = useMemo(
    () =>
      new Set(
        isShow2DExportBuriedMarks
          ? boardHexesArr
              .filter((hex) =>
                getBuriedMarksForHex(hex, hex.altitude, buriedMarksByUID),
              )
              .map((hex) => hex.altitude)
          : [],
      ),
    [isShow2DExportBuriedMarks, boardHexesArr, buriedMarksByUID],
  )
  const hasVisibleBuriedMarks =
    isShow2DExportBuriedMarks && buriedMarkLevels.has(viewingLevel)
  const visibleObjectiveMarkers = useMemo(
    () =>
      getSvgVisibleObjectiveMarkers(
        hexMap.objectiveMarkers ?? [],
        viewingLevel,
        overlayLevel,
        is2DOverlayLevelEnabled,
      ),
    [
      hexMap.objectiveMarkers,
      viewingLevel,
      overlayLevel,
      is2DOverlayLevelEnabled,
    ],
  )
  const namedObjectiveMarkers = useMemo(
    () => visibleObjectiveMarkers.filter((marker) => marker.name?.trim()),
    [visibleObjectiveMarkers],
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
  const isLegendOnly =
    legendOnly || (isShowPieceKey && viewingLevel === overlayLevel + 1)
  const shouldRenderPieceKey = isShowPieceKey || legendOnly
  const pieceKeyModel = useMemo<PieceKeyModel | null>(
    () =>
      isLegendOnly
        ? getPieceKeyModel(boardPieces, boardHexes, useTerrainBorderColor)
        : null,
    [isLegendOnly, boardPieces, boardHexes, useTerrainBorderColor],
  )
  const legendWidth = pieceKeyModel
    ? getSvgPieceKeyWidth(pieceKeyModel, mapDimensions.width)
    : 0
  const legendHeight = pieceKeyModel
    ? getSvgPieceKeyHeight(pieceKeyModel, mapDimensions.width)
    : 0
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
    <SvgMapShapeSettingsContext.Provider value={shapeSettings}>
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
              model={pieceKeyModel}
              renderOptions={{
                viewingLevel:
                  isShow2DExportBuriedMarks || isShow2DExportTileLetters
                    ? viewingLevel
                    : 0,
                overlayLevel,
                isOverlayViewing:
                  is2DOverlayLevelEnabled && viewingLevel === overlayLevel,
                is2DOverlayLevelEnabled,
                isShow2DExportTileLetters,
                isShow2DExportBuriedMarks,
                glyphCoordinates,
                glyphExportSettings,
              }}
              useTerrainBorderColor={useTerrainBorderColor}
              x={0}
              y={0}
              width={legendWidth}
            />
          )
        ) : (
          <g>
            {boardHexesArr.map((hex) => {
              const originHex = pieceOriginBySourceID.get(hex.id) ?? hex
              return (
                <SvgMapHex
                  key={hex.id}
                  hex={originHex}
                  buriedMarksByUID={buriedMarksByUID}
                  viewingLevel={
                    isShow2DExportBuriedMarks || isShow2DExportTileLetters
                      ? viewingLevel
                      : 0
                  }
                  overlayLevel={overlayLevel}
                  isVisible={originHex.altitude <= viewingLevel}
                  isSubLevel={originHex.altitude < viewingLevel}
                  isOverlayViewing={
                    is2DOverlayLevelEnabled && viewingLevel === overlayLevel
                  }
                  is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
                  isShow2DExportTileLetters={isShow2DExportTileLetters}
                  isShow2DExportBuriedMarks={isShow2DExportBuriedMarks}
                  glyphCoordinates={glyphCoordinates}
                  glyphExportSettings={glyphExportSettings}
                />
              )
            })}
            {pieceOriginHexes
              .filter((origin) => !origin.sourceHexID)
              .map(({ hex }) =>
                hex.altitude <= viewingLevel ? (
                  <SvgMapHex
                    key={`missing-origin-${hex.boardPieceUID}`}
                    hex={hex}
                    buriedMarksByUID={buriedMarksByUID}
                    viewingLevel={
                      isShow2DExportBuriedMarks || isShow2DExportTileLetters
                        ? viewingLevel
                        : 0
                    }
                    overlayLevel={overlayLevel}
                    isVisible
                    isSubLevel={hex.altitude < viewingLevel}
                    isOverlayViewing={
                      is2DOverlayLevelEnabled && viewingLevel === overlayLevel
                    }
                    is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
                    isShow2DExportTileLetters={isShow2DExportTileLetters}
                    isShow2DExportBuriedMarks={isShow2DExportBuriedMarks}
                    glyphCoordinates={glyphCoordinates}
                    glyphExportSettings={glyphExportSettings}
                  />
                ) : null,
              )}
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
                  is2DOverlayLevelEnabled={is2DOverlayLevelEnabled}
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
    </SvgMapShapeSettingsContext.Provider>
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

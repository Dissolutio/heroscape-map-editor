import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from '../data/objectiveMarkers'
import {
  PDF_BORDER_WIDTH,
  SVG_BORDER_WIDTH,
  SVG_HEX_APOTHEM,
  SVG_HEX_RADIUS,
} from '../utils/constants'
import { getBoardHex3DCoords, hexUtilsHexToPixel } from '../utils/map-utils'
import {
  getObjectiveMarkerExportTextPosition,
  getObjectiveMarkerTextFontSize,
} from '../world/models/objectiveMarker3D'
import {
  get1HexOutlineSvgPolygonPoints,
  get2HexOutlineSvgPolygonPoints,
  get2HexPdfPolygonPointsAt00,
  get2HexSvgPolygonPointsAt00,
  getHexagonPdfPolygonPointsAt00,
  getHexagonSvgPolygonPointsAt00,
} from './hexPolygonPoints'

export type ObjectiveMarkerExportPoint = { x: number; y: number }

export type ObjectiveMarkerExportBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}

export type ObjectiveMarkerExportGeometry = {
  center: ObjectiveMarkerExportPoint
  rotationDegrees: number
  outerPoints: ObjectiveMarkerExportPoint[]
  facePoints: ObjectiveMarkerExportPoint[]
  svgBorderPoints: ObjectiveMarkerExportPoint[]
  textPosition: ObjectiveMarkerExportPoint
  textFontSize: number
}

export function getObjectiveMarkerExportBounds(
  points: ObjectiveMarkerExportPoint[],
): ObjectiveMarkerExportBounds {
  const xs = points.map(({ x }) => x)
  const ys = points.map(({ y }) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function getObjectiveMarkerExportGeometry(
  marker: ObjectiveMarker,
): ObjectiveMarkerExportGeometry {
  const footprint = getObjectiveMarkerFootprint(marker)
  const footprint3D = footprint.map(getBoardHex3DCoords)
  const footprintPixels = footprint.map(hexUtilsHexToPixel)
  const center = {
    x:
      footprintPixels.reduce((sum, position) => sum + position.x, 0) /
      footprintPixels.length,
    y:
      footprintPixels.reduce((sum, position) => sum + position.y, 0) /
      footprintPixels.length,
  }
  const markerPosition = {
    x:
      footprint3D.reduce((sum, position) => sum + position.x, 0) /
      footprint3D.length,
    y: 0,
    z:
      footprint3D.reduce((sum, position) => sum + position.z, 0) /
      footprint3D.length,
    rotationY: (-marker.rotation * Math.PI) / 3,
  }
  const textPosition = getObjectiveMarkerExportTextPosition(
    marker,
    markerPosition,
  )
  const outerCorners =
    marker.size === 1
      ? getHexagonSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
      : get2HexSvgPolygonPointsAt00(SVG_HEX_RADIUS).corners
  const svgBorderCorners =
    marker.size === 1
      ? get1HexOutlineSvgPolygonPoints(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).corners
      : get2HexOutlineSvgPolygonPoints(SVG_HEX_RADIUS, SVG_BORDER_WIDTH).corners
  const pdfFaceCorners =
    marker.size === 1
      ? getHexagonPdfPolygonPointsAt00(SVG_HEX_RADIUS, PDF_BORDER_WIDTH * 2)
          .corners
      : get2HexPdfPolygonPointsAt00(SVG_HEX_RADIUS, PDF_BORDER_WIDTH * 2)
          .corners
  const centerOffsetX = marker.size === 1 ? 0 : SVG_HEX_APOTHEM
  const centerPoints = (corners: { x: number; y: number }[]) =>
    corners.map(({ x, y }) => ({
      x: x - centerOffsetX,
      y,
    }))

  return {
    center,
    rotationDegrees: marker.rotation * 60,
    outerPoints: centerPoints(outerCorners),
    facePoints: centerPoints(pdfFaceCorners),
    svgBorderPoints: centerPoints(svgBorderCorners),
    textPosition: {
      x: textPosition.x * SVG_HEX_RADIUS,
      y: textPosition.z * SVG_HEX_RADIUS,
    },
    textFontSize: getObjectiveMarkerTextFontSize(marker) * SVG_HEX_RADIUS,
  }
}

export function getObjectiveMarkerLegendGeometry(
  marker: ObjectiveMarker,
): ObjectiveMarkerExportGeometry {
  return getObjectiveMarkerExportGeometry({ ...marker, rotation: 0 })
}

export function getObjectiveMarkerLegendLayout(
  markers: ObjectiveMarker[],
  fontSize: number,
) {
  const geometries = markers.map(getObjectiveMarkerLegendGeometry)
  const bounds = geometries.map((geometry) =>
    getObjectiveMarkerExportBounds(geometry.outerPoints),
  )
  const scales = geometries.map((geometry) => fontSize / geometry.textFontSize)
  const padding = fontSize * 0.3
  const swatchWidth = Math.max(
    0,
    ...bounds.map((bound, index) => bound.width * scales[index]),
  )
  const rowHeight =
    Math.max(0, ...bounds.map((bound, index) => bound.height * scales[index])) +
    padding * 2

  return { geometries, bounds, scales, padding, swatchWidth, rowHeight }
}

export function getSvgObjectiveMarkerKeyFontSize(viewBoxWidth: number) {
  return Math.max(8, Math.min(0.35 * SVG_HEX_RADIUS, viewBoxWidth / 70))
}

export function getObjectiveMarkerExportColors(marker: ObjectiveMarker) {
  return marker.style === 'black'
    ? { face: '#111111', foreground: '#ffffff' }
    : { face: '#ffffff', foreground: '#111111' }
}

export function getSvgVisibleObjectiveMarkers(
  markers: ObjectiveMarker[],
  viewingLevel: number,
  overlayLevel: number,
  isOverlayLevelEnabled: boolean,
) {
  return markers.filter((marker) =>
    isOverlayLevelEnabled
      ? viewingLevel === overlayLevel
      : marker.anchor.altitude <= viewingLevel,
  )
}

export function getPdfVisibleObjectiveMarkers(
  markers: ObjectiveMarker[],
  viewingLevel: number,
  isOverlayViewing: boolean,
  isShowOverlayOnPlacedLevel: boolean,
) {
  if (isOverlayViewing) return markers
  if (!isShowOverlayOnPlacedLevel) return []
  return markers.filter((marker) => marker.anchor.altitude === viewingLevel)
}

export function getPdfLegendObjectiveMarkers(
  markers: ObjectiveMarker[],
  isShowOverlayLayer: boolean,
  isShowOverlayOnPlacedLevel: boolean,
) {
  return isShowOverlayLayer || isShowOverlayOnPlacedLevel ? markers : []
}

export function getSvgObjectiveMarkerFooterHeight(
  namedMarkerCount: number,
  hasBuriedMarks: boolean,
  fontSize: number,
  rowHeight = fontSize * 1.5,
) {
  if (namedMarkerCount === 0) return hasBuriedMarks ? fontSize * 1.5 : 0

  const legendHeight = namedMarkerCount * rowHeight
  return (
    fontSize * 1.1 + legendHeight + fontSize * (hasBuriedMarks ? 2.5 : 0.35)
  )
}

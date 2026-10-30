import {
  getObjectiveMarkerFootprint,
  type ObjectiveMarker,
} from '../data/objectiveMarkers'
import {
  getObjectiveMarkerExportTextPosition,
  getObjectiveMarkerOutlinePoints,
  getObjectiveMarkerShapeOptions,
  getObjectiveMarkerTextFontSize,
} from '../world/models/objectiveMarker3D'
import { SVG_HEX_RADIUS } from '../utils/constants'
import { getBoardHex3DCoords, hexUtilsHexToPixel } from '../utils/map-utils'

export type ObjectiveMarkerExportPoint = { x: number; y: number }

export type ObjectiveMarkerExportGeometry = {
  center: ObjectiveMarkerExportPoint
  rotationDegrees: number
  outerPoints: ObjectiveMarkerExportPoint[]
  facePoints: ObjectiveMarkerExportPoint[]
  textPosition: ObjectiveMarkerExportPoint
  textFontSize: number
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
  const shapeOptions = getObjectiveMarkerShapeOptions()
  const markerRadius = marker.size === 1 ? 0.76 : shapeOptions.hexScale

  const getPoints = (scale: number) =>
    getObjectiveMarkerOutlinePoints(
      marker.size,
      {
        ...shapeOptions,
        hexScale: markerRadius * scale,
        bridgeOverlap: shapeOptions.bridgeOverlap * scale,
      },
      marker.size === 1 ? markerRadius * scale : undefined,
    ).map(({ x, z }) => ({
      x: x * SVG_HEX_RADIUS,
      y: z * SVG_HEX_RADIUS,
    }))

  return {
    center,
    rotationDegrees: marker.rotation * 60,
    outerPoints: getPoints(1),
    facePoints: getPoints(0.92),
    textPosition: {
      x: textPosition.x * SVG_HEX_RADIUS,
      y: textPosition.z * SVG_HEX_RADIUS,
    },
    textFontSize: getObjectiveMarkerTextFontSize(marker) * SVG_HEX_RADIUS,
  }
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
) {
  if (namedMarkerCount === 0) return hasBuriedMarks ? fontSize * 1.5 : 0

  const legendHeight = namedMarkerCount * fontSize * 1.5
  return (
    fontSize * 1.1 + legendHeight + fontSize * (hasBuriedMarks ? 2.5 : 0.35)
  )
}

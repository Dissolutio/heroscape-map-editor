import {
  type ObjectiveMarker,
  getObjectiveMarkerFootprint,
} from '../../data/objectiveMarkers'
import type { BoardHexes } from '../../types'
import { isFluidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
} from '../../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'

export type ObjectiveMarker3DPosition = {
  x: number
  y: number
  z: number
  rotationY: number
}

export type ObjectiveMarkerTextPosition = {
  x: number
  z: number
}

/**
 * 3D text sits at the center of the token, which is the midpoint of the two
 * occupied cells for a 2-hex marker. The marker group applies its rotation.
 */
export function getObjectiveMarker3DTextPosition(
  _marker: ObjectiveMarker,
  _position: ObjectiveMarker3DPosition,
): ObjectiveMarkerTextPosition {
  return { x: 0, z: 0 }
}

/**
 * Preserve the anchor-relative offset used by flat-map/export text layouts.
 * Keep this separate from 3D positioning: the 3D token is centered instead.
 */
export function getObjectiveMarkerExportTextPosition(
  marker: ObjectiveMarker,
  position: ObjectiveMarker3DPosition,
): ObjectiveMarkerTextPosition {
  if (marker.size === 1) return { x: 0, z: 0 }

  const anchorPosition = getBoardHex3DCoords(marker.anchor)
  const deltaX = anchorPosition.x - position.x
  const deltaZ = anchorPosition.z - position.z
  const cos = Math.cos(position.rotationY)
  const sin = Math.sin(position.rotationY)
  return {
    x: cos * deltaX - sin * deltaZ,
    z: sin * deltaX + cos * deltaZ,
  }
}

export type ObjectiveMarkerShapeOptions = {
  hexScale: number
  bridgeWidthRatio: number
  bridgeOverlap: number
}

export const DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS: ObjectiveMarkerShapeOptions =
  {
    hexScale: 0.92,
    bridgeWidthRatio: 1,
    bridgeOverlap: 0.04,
  }

function parseDial(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (value === null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, parsed))
    : fallback
}

/**
 * Development startup dials for tuning the token silhouette. Production
 * builds always use the defaults, regardless of URL parameters.
 */
export function getObjectiveMarkerShapeOptions(
  search?: string,
): ObjectiveMarkerShapeOptions {
  if (!import.meta.env.DEV) return DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS

  const query =
    search ?? (typeof window === 'undefined' ? '' : window.location.search)
  const params = new URLSearchParams(query)
  return {
    hexScale: parseDial(
      params.get('markerHexScale'),
      DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.hexScale,
      0.1,
      1.5,
    ),
    bridgeWidthRatio: parseDial(
      params.get('markerBridge'),
      DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
      0.1,
      1.5,
    ),
    bridgeOverlap: parseDial(
      params.get('markerBridgeOverlap'),
      DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS.bridgeOverlap,
      0,
      0.5,
    ),
  }
}

/**
 * Return the plain x/z outline for one regular hex or a two-hex token. The
 * two lobes remain regular hexagons; only the narrow space between their
 * inward-facing flat edges is bridged.
 */
export function getObjectiveMarkerOutlinePoints(
  size: ObjectiveMarker['size'],
  {
    hexScale,
    bridgeWidthRatio,
    bridgeOverlap,
  }: ObjectiveMarkerShapeOptions = DEFAULT_OBJECTIVE_MARKER_SHAPE_OPTIONS,
  singleHexRadius = 0.76,
): ObjectiveMarkerTextPosition[] {
  // Two hex centers remain one grid-step apart. Keep each regular lobe just
  // below the touching radius so the inner edges never cross when the
  // selection outline is expanded. One-hex markers retain their previous
  // radius; the optional override lets the 3D selection ring scale that hex.
  const radius = size === 2 ? Math.min(hexScale, 0.99) : singleHexRadius
  const apothem = (Math.sqrt(3) / 2) * radius
  const halfWidth =
    size === 2
      ? Math.min(radius / 2, (radius * bridgeWidthRatio) / 2 + bridgeOverlap)
      : 0

  if (size === 1) {
    return [
      { x: 0, z: radius },
      { x: apothem, z: radius / 2 },
      { x: apothem, z: -radius / 2 },
      { x: 0, z: -radius },
      { x: -apothem, z: -radius / 2 },
      { x: -apothem, z: radius / 2 },
    ]
  }

  const centerOffset = Math.sqrt(3) / 2
  const leftCenter = -centerOffset
  const rightCenter = centerOffset
  const leftInnerEdge = leftCenter + apothem
  const rightInnerEdge = rightCenter - apothem
  return [
    { x: leftCenter, z: radius },
    { x: leftInnerEdge, z: radius / 2 },
    { x: leftInnerEdge, z: halfWidth },
    { x: rightInnerEdge, z: halfWidth },
    { x: rightInnerEdge, z: radius / 2 },
    { x: rightCenter, z: radius },
    { x: rightCenter + apothem, z: radius / 2 },
    { x: rightCenter + apothem, z: -radius / 2 },
    { x: rightCenter, z: -radius },
    { x: rightInnerEdge, z: -radius / 2 },
    { x: rightInnerEdge, z: -halfWidth },
    { x: leftInnerEdge, z: -halfWidth },
    { x: leftInnerEdge, z: -radius / 2 },
    { x: leftCenter, z: -radius },
    { x: leftCenter - apothem, z: -radius / 2 },
    { x: leftCenter - apothem, z: radius / 2 },
  ]
}

export function getObjectiveMarker3DPosition(
  marker: ObjectiveMarker,
  boardHexes: BoardHexes,
  isHighQualityRender = false,
): ObjectiveMarker3DPosition | null {
  const footprint = getObjectiveMarkerFootprint(marker)
  const supportHexes = footprint.map((hex) => boardHexes[genBoardHexID(hex)])
  if (supportHexes.some((hex) => !hex || hex.isCap !== true)) return null

  const positions = footprint.map(getBoardHex3DCoords)
  const centerX =
    positions.reduce((sum, position) => sum + position.x, 0) / positions.length
  const centerZ =
    positions.reduce((sum, position) => sum + position.z, 0) / positions.length
  const anchorHex = supportHexes[0]
  if (!anchorHex) return null

  const anchorPosition = getBoardHex3DCoords(marker.anchor)
  const capTopY = isFluidTerrainHex(anchorHex.terrain)
    ? anchorPosition.y -
      (HEXGRID_HEX_HEIGHT - HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE) +
      0.0015
    : anchorPosition.y +
      (isHighQualityRender
        ? -HEXGRID_HEXCAP_HEIGHT / 2
        : HEXGRID_HEXCAP_HEIGHT / 2)
  const y = capTopY + 0.012

  return {
    x: centerX,
    y,
    z: centerZ,
    rotationY: marker.rotation === 0 ? 0 : (-marker.rotation * Math.PI) / 3,
  }
}

export function getObjectiveMarkerTextFontSize(
  marker: Pick<ObjectiveMarker, 'size' | 'content'>,
) {
  const text =
    marker.content.kind === 'number'
      ? String(marker.content.value)
      : marker.content.value
  const maxFontSize = marker.size === 2 ? 0.48 : 0.42
  const characterCount = Math.max(1, Array.from(text).length)
  return maxFontSize * Math.min(1, 2.1 / characterCount)
}

export function isObjectiveMarkerVisibleAtLevel(
  marker: Pick<ObjectiveMarker, 'anchor'>,
  viewingLevel: number,
) {
  return marker.anchor.altitude <= viewingLevel
}

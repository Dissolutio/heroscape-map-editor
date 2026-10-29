import type { BoardHexes } from '../../types'
import {
  getObjectiveMarkerFootprint,
  type ObjectiveMarker,
} from '../../data/objectiveMarkers'
import { isFluidTerrainHex } from '../../utils/board-utils'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEX_RADIUS,
} from '../../utils/constants'
import { genBoardHexID, getBoardHex3DCoords } from '../../utils/map-utils'

export type ObjectiveMarker3DPosition = {
  x: number
  y: number
  z: number
  rotationY: number
  lengthScale: number
  radius: number
}

export type ObjectiveMarkerTextPosition = {
  x: number
  z: number
}

export function getObjectiveMarkerTextPosition(
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
    lengthScale: marker.size === 2 ? Math.sqrt(3) : 1,
    radius: HEXGRID_HEX_RADIUS * (marker.size === 2 ? 0.68 : 0.76),
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

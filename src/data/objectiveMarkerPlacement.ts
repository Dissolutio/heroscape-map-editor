import type { BoardHexes } from '../types'
import { genBoardHexID } from '../utils/map-utils'
import {
  getObjectiveMarkerFootprint,
  objectiveMarkersOverlap,
  type ObjectiveMarker,
} from './objectiveMarkers'

export type ObjectiveMarkerPlacementStatus =
  | { status: 'ok'; footprint: ReturnType<typeof getObjectiveMarkerFootprint> }
  | {
      status: 'blocked'
      reason: 'outOfBounds' | 'unsupported' | 'overlap'
      footprint: ReturnType<typeof getObjectiveMarkerFootprint>
    }

export function getObjectiveMarkerPlacementStatus({
  marker,
  boardHexes,
  mapHexIDs,
  markers,
}: {
  marker: ObjectiveMarker
  boardHexes: BoardHexes
  mapHexIDs: ReadonlySet<string>
  markers: readonly ObjectiveMarker[]
}): ObjectiveMarkerPlacementStatus {
  const footprint = getObjectiveMarkerFootprint(marker)
  if (
    footprint.some(
      (hex) => !mapHexIDs.has(genBoardHexID({ ...hex, altitude: 0 })),
    )
  ) {
    return { status: 'blocked', reason: 'outOfBounds', footprint }
  }
  if (footprint.some((hex) => boardHexes[genBoardHexID(hex)]?.isCap !== true)) {
    return { status: 'blocked', reason: 'unsupported', footprint }
  }
  if (
    markers.some(
      (other) =>
        other.uid !== marker.uid && objectiveMarkersOverlap(other, marker),
    )
  ) {
    return { status: 'blocked', reason: 'overlap', footprint }
  }
  return { status: 'ok', footprint }
}

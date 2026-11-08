import type { ObjectiveMarker } from './objectiveMarkers'

export const OBJECTIVE_MARKERS_HIDDEN_MESSAGE =
  'Objective markers are hidden in 3D. Turn them on in the View tab.'

export function shouldRenderObjectiveMarker(isShowObjectiveMarkers: boolean) {
  return isShowObjectiveMarkers
}

export function canSelectObjectiveMarker(
  uid: string,
  markers: readonly Pick<ObjectiveMarker, 'uid'>[],
  isShowObjectiveMarkers: boolean,
) {
  return isShowObjectiveMarkers && markers.some((marker) => marker.uid === uid)
}

export function canDragObjectiveMarker(
  uid: string,
  selectedUID: string | null,
  markers: readonly Pick<ObjectiveMarker, 'uid'>[],
  isShowObjectiveMarkers: boolean,
) {
  return (
    selectedUID === uid &&
    canSelectObjectiveMarker(uid, markers, isShowObjectiveMarkers)
  )
}

export function filterVisibleObjectiveMarkerUIDs(
  selectedUIDs: readonly string[],
  markers: readonly Pick<ObjectiveMarker, 'uid'>[],
  isShowObjectiveMarkers: boolean,
) {
  if (isShowObjectiveMarkers) return [...selectedUIDs]

  const markerUIDs = new Set(markers.map((marker) => marker.uid))
  return selectedUIDs.filter((uid) => !markerUIDs.has(uid))
}

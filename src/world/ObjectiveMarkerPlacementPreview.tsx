import { useMemo } from 'react'
import { OBJECTIVE_MARKER_PEN_MODE } from '../data/objectiveMarkers'
import { getObjectiveMarkerPlacementStatus } from '../data/objectiveMarkerPlacement'
import { getObjectiveMarkerFootprint } from '../data/objectiveMarkers'
import { mapTableHexes } from '../data/fitMapToPieces'
import useBoundStore from '../store/store'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import { PlacementFootprint } from './PlacementFootprint'

const EMPTY_OBJECTIVE_MARKERS: ObjectiveMarker[] = []

export default function ObjectiveMarkerPlacementPreview() {
  const penMode = useBoundStore((state) => state.penMode)
  const hoveredHex = useBoundStore((state) => state.hoveredHex)
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const hexMap = useBoundStore((state) => state.hexMap)
  const markers = useBoundStore(
    (state) => state.hexMap.objectiveMarkers ?? EMPTY_OBJECTIVE_MARKERS,
  )
  const draft = useBoundStore((state) => state.objectiveMarkerDraft)
  const penModeRotation = useBoundStore((state) => state.penModeRotation)
  const dragPreview = useBoundStore((state) => state.objectiveMarkerDragPreview)
  const mapHexIDs = useMemo(() => mapTableHexes(hexMap), [hexMap])

  const marker = dragPreview?.marker ??
    (penMode === OBJECTIVE_MARKER_PEN_MODE && hoveredHex
      ? {
          uid: '__objective-marker-preview__',
          anchor: {
            q: hoveredHex.q,
            r: hoveredHex.r,
            s: hoveredHex.s,
            altitude: hoveredHex.altitude,
          },
          ...draft,
          rotation: (penModeRotation % 6) as 0 | 1 | 2 | 3 | 4 | 5,
        }
      : null)
  const placement = useMemo(() => {
    if (!marker) return null
    if (dragPreview) {
      return {
        status: dragPreview.status,
        footprint: getObjectiveMarkerFootprint(marker),
      }
    }
    return getObjectiveMarkerPlacementStatus({
      marker,
      boardHexes,
      mapHexIDs,
      markers,
    })
  }, [boardHexes, dragPreview, mapHexIDs, marker, markers])

  if (!marker || !placement) return null
  const hovered =
    hoveredHex ??
    ({
      q: marker.anchor.q,
      r: marker.anchor.r,
      s: marker.anchor.s,
      altitude: marker.anchor.altitude,
    } as const)
  return (
    <PlacementFootprint
      status={placement.status}
      footprintHexes={placement.footprint}
      hoveredHex={hovered}
    />
  )
}

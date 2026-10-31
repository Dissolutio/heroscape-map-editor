import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { mapTableHexes } from '../data/fitMapToPieces'
import { getObjectiveMarkerPlacementStatus } from '../data/objectiveMarkerPlacement'
import {
  OBJECTIVE_MARKER_PEN_MODE,
  getEffectiveObjectiveMarkerNumber,
  getObjectiveMarkerFootprint,
} from '../data/objectiveMarkers'
import type { ObjectiveMarker } from '../data/objectiveMarkers'
import useBoundStore from '../store/store'
import { HEXGRID_HEX_RADIUS } from '../utils/constants'
import { PlacementFootprint } from './PlacementFootprint'
import {
  getObjectiveMarker3DPosition,
  getObjectiveMarker3DTextTransform,
  getObjectiveMarkerTextFontSize,
} from './models/objectiveMarker3D'

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
  const isHighQualityRender = useBoundStore(
    (state) => state.isHighQualityRender,
  )
  const mapHexIDs = useMemo(() => mapTableHexes(hexMap), [hexMap])
  const content =
    draft.content.kind === 'number' && !draft.pinNumber
      ? {
          kind: 'number' as const,
          value: getEffectiveObjectiveMarkerNumber(
            markers,
            draft.style,
            draft.content.value,
          ),
        }
      : draft.content

  const marker =
    dragPreview?.marker ??
    (penMode === OBJECTIVE_MARKER_PEN_MODE && hoveredHex
      ? {
          uid: '__objective-marker-preview__',
          anchor: {
            q: hoveredHex.q,
            r: hoveredHex.r,
            s: hoveredHex.s,
            altitude: hoveredHex.altitude,
          },
          size: draft.size,
          style: draft.style,
          content,
          name: draft.name,
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
  const markerPosition = marker
    ? getObjectiveMarker3DPosition(marker, boardHexes, isHighQualityRender)
    : null
  const textTransform =
    marker && markerPosition
      ? getObjectiveMarker3DTextTransform(marker, markerPosition)
      : null

  if (!marker || !placement) return null
  const hovered =
    hoveredHex ??
    ({
      q: marker.anchor.q,
      r: marker.anchor.r,
      s: marker.anchor.s,
      altitude: marker.anchor.altitude,
    } as const)
  const text =
    marker.content.kind === 'number'
      ? String(marker.content.value)
      : marker.content.value
  const foreground = marker.style === 'black' ? '#ffffff' : '#111111'
  return (
    <>
      <PlacementFootprint
        status={placement.status}
        footprintHexes={placement.footprint}
        hoveredHex={hovered}
      />
      {textTransform && (
        <group
          position={textTransform.groupPosition}
          rotation={textTransform.groupRotation}
        >
          <Text
            position={textTransform.textPosition}
            rotation={textTransform.textRotation}
            font="/fonts/Inter_18pt-Bold.ttf"
            fontSize={getObjectiveMarkerTextFontSize(marker)}
            maxWidth={HEXGRID_HEX_RADIUS * 2.2}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            color={foreground}
            raycast={() => null}
          >
            {text}
          </Text>
        </group>
      )}
    </>
  )
}

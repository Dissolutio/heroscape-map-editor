import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { Path, Shape } from 'three'
import type { ObjectiveMarker } from '../../data/objectiveMarkers'
import useBoundStore from '../../store/store'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import { pressObjectiveMarkerForDrag } from '../drag/objectiveMarkerDragController'
import {
  type ObjectiveMarker3DPosition,
  getObjectiveMarker3DPosition,
  getObjectiveMarker3DTextPosition,
  getObjectiveMarkerOutlinePoints,
  getObjectiveMarkerShapeOptions,
  getObjectiveMarkerTextFontSize,
  isObjectiveMarkerVisibleAtLevel,
} from './objectiveMarker3D'

const EMPTY_MARKERS: ObjectiveMarker[] = []
const MARKER_SHAPE_OPTIONS = getObjectiveMarkerShapeOptions()

function makeMarkerShape(
  markerSize: ObjectiveMarker['size'],
  hexScale: number,
  bridgeWidthRatio: number,
  bridgeOverlap: number,
) {
  const points = getObjectiveMarkerOutlinePoints(markerSize, {
    hexScale,
    bridgeWidthRatio,
    bridgeOverlap,
  })
  const shape = new Shape()
  const [first, ...rest] = points
  if (!first) return shape
  shape.moveTo(first.x, first.z)
  for (const { x, z } of rest) shape.lineTo(x, z)
  shape.closePath()
  return shape
}

function makeSelectionRingShape(markerSize: ObjectiveMarker['size']) {
  const outer = makeMarkerShape(
    markerSize,
    MARKER_SHAPE_OPTIONS.hexScale * 1.14,
    MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
    MARKER_SHAPE_OPTIONS.bridgeOverlap * 1.14,
  )
  const innerPoints = getObjectiveMarkerOutlinePoints(markerSize, {
    ...MARKER_SHAPE_OPTIONS,
    hexScale: MARKER_SHAPE_OPTIONS.hexScale,
  }).reverse()
  const hole = new Path()
  const [first, ...rest] = innerPoints
  if (first) {
    hole.moveTo(first.x, first.z)
    for (const { x, z } of rest) hole.lineTo(x, z)
    hole.closePath()
    outer.holes.push(hole)
  }
  return outer
}

export default function ObjectiveMarkers3D() {
  const markers = useBoundStore((state) => state.hexMap.objectiveMarkers)
  const boardHexes = useBoundStore((state) => state.boardHexes)
  const viewingLevel = useBoundStore((state) => state.viewingLevel)
  const isHighQualityRender = useBoundStore(
    (state) => state.isHighQualityRender,
  )

  return (
    <>
      {(markers ?? EMPTY_MARKERS).map((marker) => {
        if (!isObjectiveMarkerVisibleAtLevel(marker, viewingLevel)) return null
        const position = getObjectiveMarker3DPosition(
          marker,
          boardHexes,
          isHighQualityRender,
        )
        if (!position) return null
        return (
          <ObjectiveMarkerToken
            key={marker.uid}
            marker={marker}
            position={position}
          />
        )
      })}
    </>
  )
}

function ObjectiveMarkerToken({
  marker,
  position,
}: {
  marker: ObjectiveMarker
  position: ObjectiveMarker3DPosition
}) {
  const selectedUID = useBoundStore((state) => state.selectedObjectiveMarkerUID)
  const setSelectedObjectiveMarkerUID = useBoundStore(
    (state) => state.setSelectedObjectiveMarkerUID,
  )
  const toggleSelectedPieceID = useBoundStore(
    (state) => state.toggleSelectedPieceID,
  )
  const isSelected = selectedUID === marker.uid
  const background = marker.style === 'black' ? '#111111' : '#ffffff'
  const foreground = marker.style === 'black' ? '#ffffff' : '#111111'
  const text = useMemo(
    () =>
      marker.content.kind === 'number'
        ? String(marker.content.value)
        : marker.content.value,
    [marker.content],
  )
  const fontSize = getObjectiveMarkerTextFontSize(marker)
  const textPosition = getObjectiveMarker3DTextPosition(marker, position)
  const borderShape = useMemo(
    () =>
      makeMarkerShape(
        marker.size,
        MARKER_SHAPE_OPTIONS.hexScale,
        MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
        MARKER_SHAPE_OPTIONS.bridgeOverlap,
      ),
    [marker.size],
  )
  const faceShape = useMemo(
    () =>
      makeMarkerShape(
        marker.size,
        MARKER_SHAPE_OPTIONS.hexScale * 0.92,
        MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
        MARKER_SHAPE_OPTIONS.bridgeOverlap * 0.92,
      ),
    [marker.size],
  )
  const selectionShape = useMemo(
    () => makeSelectionRingShape(marker.size),
    [marker.size],
  )
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    toggleSelectedPieceID('')
    setSelectedObjectiveMarkerUID(marker.uid)
  }

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[0, position.rotationY, 0]}
      userData={{ objectiveMarkerUID: marker.uid }}
    >
      <mesh
        position={[0, -0.0125, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(event) =>
          pressObjectiveMarkerForDrag(event, marker.uid)
        }
        onPointerUp={handlePointerUp}
        castShadow={false}
        receiveShadow={false}
      >
        <extrudeGeometry
          args={[borderShape, { depth: 0.025, bevelEnabled: false }]}
        />
        <meshBasicMaterial color={foreground} toneMapped={false} />
      </mesh>
      <mesh
        position={[0, 0.0015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
        castShadow={false}
        receiveShadow={false}
      >
        <extrudeGeometry
          args={[faceShape, { depth: 0.025, bevelEnabled: false }]}
        />
        <meshBasicMaterial color={background} toneMapped={false} />
      </mesh>
      <mesh
        position={[0, 0.026, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
        renderOrder={40}
        visible={isSelected}
        castShadow={false}
        receiveShadow={false}
      >
        <extrudeGeometry
          args={[selectionShape, { depth: 0.01, bevelEnabled: false }]}
        />
        <meshBasicMaterial color="#00c8ff" toneMapped={false} />
      </mesh>
      <Text
        position={[textPosition.x, 0.029, textPosition.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        font="/fonts/Inter_18pt-Bold.ttf"
        fontSize={fontSize}
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
  )
}

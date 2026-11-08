import { Billboard, Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { Path, Shape } from 'three'
import { shouldRenderObjectiveMarker } from '../../data/objectiveMarkerVisibility'
import type { ObjectiveMarker } from '../../data/objectiveMarkers'
import useBoundStore from '../../store/store'
import { SELECT_PEN_MODE } from '../../types'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import { pressObjectiveMarkerForDrag } from '../drag/objectiveMarkerDragController'
import {
  type ObjectiveMarker3DPosition,
  getObjectiveMarker3DPosition,
  getObjectiveMarker3DTextTransform,
  getObjectiveMarkerOutlinePoints,
  getObjectiveMarkerShapeOptions,
  getObjectiveMarkerTextFontSize,
  isObjectiveMarkerVisibleAtLevel,
} from './objectiveMarker3D'

const EMPTY_MARKERS: ObjectiveMarker[] = []
const MARKER_SHAPE_OPTIONS = getObjectiveMarkerShapeOptions()
const OBJECTIVE_MARKER_EXTRUSION_DEPTH = 0.025

function makeMarkerShape(
  markerSize: ObjectiveMarker['size'],
  hexScale: number,
  bridgeWidthRatio: number,
  bridgeOverlap: number,
  outlineScale = 1,
) {
  const points = getObjectiveMarkerOutlinePoints(
    markerSize,
    {
      hexScale,
      bridgeWidthRatio,
      bridgeOverlap,
    },
    markerSize === 1 ? hexScale : undefined,
  )
  const shape = new Shape()
  const [first, ...rest] = points
  if (!first) return shape
  shape.moveTo(first.x * outlineScale, first.z * outlineScale)
  for (const { x, z } of rest) {
    shape.lineTo(x * outlineScale, z * outlineScale)
  }
  shape.closePath()
  return shape
}

function makeSelectionRingShape(markerSize: ObjectiveMarker['size']) {
  const markerRadius = markerSize === 1 ? 0.76 : MARKER_SHAPE_OPTIONS.hexScale
  const outer = makeMarkerShape(
    markerSize,
    markerRadius,
    MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
    MARKER_SHAPE_OPTIONS.bridgeOverlap,
    1.14,
  )
  const innerPoints = getObjectiveMarkerOutlinePoints(
    markerSize,
    {
      ...MARKER_SHAPE_OPTIONS,
      hexScale: markerRadius,
    },
    markerSize === 1 ? markerRadius : undefined,
  )
    .map(({ x, z }) => ({ x: x * 1.04, z: z * 1.04 }))
    .reverse()
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
  const isShowObjectiveMarkers = useBoundStore(
    (state) => state.isShowObjectiveMarkers,
  )
  const faceCamera = useBoundStore(
    (state) => state.isObjectiveMarkerNumbersFaceCamera,
  )

  return (
    <>
      {shouldRenderObjectiveMarker(isShowObjectiveMarkers) &&
        (markers ?? EMPTY_MARKERS).map((marker) => {
          if (!isObjectiveMarkerVisibleAtLevel(marker, viewingLevel)) {
            return null
          }
          const position = getObjectiveMarker3DPosition(marker, boardHexes)
          if (!position) return null
          return (
            <ObjectiveMarkerToken
              key={marker.uid}
              marker={marker}
              position={position}
              faceCamera={faceCamera}
            />
          )
        })}
    </>
  )
}

function ObjectiveMarkerToken({
  marker,
  position,
  faceCamera,
}: {
  marker: ObjectiveMarker
  position: ObjectiveMarker3DPosition
  faceCamera: boolean
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
  const textTransform = getObjectiveMarker3DTextTransform(
    marker,
    position,
    faceCamera,
  )
  const borderShape = useMemo(
    () =>
      makeMarkerShape(
        marker.size,
        marker.size === 1 ? 0.76 : MARKER_SHAPE_OPTIONS.hexScale,
        MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
        MARKER_SHAPE_OPTIONS.bridgeOverlap,
      ),
    [marker.size],
  )
  const faceShape = useMemo(
    () =>
      makeMarkerShape(
        marker.size,
        marker.size === 1 ? 0.76 * 0.92 : MARKER_SHAPE_OPTIONS.hexScale * 0.92,
        MARKER_SHAPE_OPTIONS.bridgeWidthRatio,
        MARKER_SHAPE_OPTIONS.bridgeOverlap * 0.92,
      ),
    [marker.size],
  )
  const selectionShape = useMemo(
    () => makeSelectionRingShape(marker.size),
    [marker.size],
  )
  const label = (
    <Text
      userData={{
        objectiveMarkerTextUID: marker.uid,
        isBillboard: textTransform.isBillboard,
      }}
      font="/fonts/Inter_18pt-Bold.ttf"
      fontSize={fontSize}
      maxWidth={HEXGRID_HEX_RADIUS * 2.2}
      anchorX="center"
      anchorY={textTransform.isBillboard ? 'bottom' : 'middle'}
      textAlign="center"
      color={foreground}
      raycast={() => null}
      castShadow={false}
    >
      {text}
    </Text>
  )
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.button !== 0) return
    toggleSelectedPieceID('')
    setSelectedObjectiveMarkerUID(marker.uid)
    const state = useBoundStore.getState()
    if (state.penMode !== SELECT_PEN_MODE) {
      state.togglePenMode(SELECT_PEN_MODE)
    }
  }

  return (
    <>
      <group
        position={textTransform.groupPosition}
        rotation={textTransform.groupRotation}
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
            args={[
              borderShape,
              { depth: OBJECTIVE_MARKER_EXTRUSION_DEPTH, bevelEnabled: false },
            ]}
          />
          <meshBasicMaterial color={foreground} toneMapped={false} />
        </mesh>
        <mesh
          position={[0, 0.0015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ objectiveMarkerFaceUID: marker.uid }}
          raycast={() => null}
          castShadow={false}
          receiveShadow={false}
        >
          <extrudeGeometry
            args={[
              faceShape,
              { depth: OBJECTIVE_MARKER_EXTRUSION_DEPTH, bevelEnabled: false },
            ]}
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
            args={[
              selectionShape,
              { depth: OBJECTIVE_MARKER_EXTRUSION_DEPTH, bevelEnabled: false },
            ]}
          />
          <meshBasicMaterial color="#00c8ff" toneMapped={false} />
        </mesh>
        {!textTransform.isBillboard && (
          <group
            position={textTransform.textPosition}
            rotation={textTransform.textRotation}
          >
            {label}
          </group>
        )}
      </group>
      {textTransform.isBillboard && (
        <Billboard
          position={[
            position.x + textTransform.textPosition[0],
            position.y + textTransform.textPosition[1],
            position.z + textTransform.textPosition[2],
          ]}
        >
          {label}
        </Billboard>
      )}
    </>
  )
}

import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { ObjectiveMarker } from '../../data/objectiveMarkers'
import useBoundStore from '../../store/store'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'
import { pressObjectiveMarkerForDrag } from '../drag/objectiveMarkerDragController'
import {
  getObjectiveMarker3DPosition,
  getObjectiveMarkerTextPosition,
  getObjectiveMarkerTextFontSize,
  type ObjectiveMarker3DPosition,
  isObjectiveMarkerVisibleAtLevel,
} from './objectiveMarker3D'

const EMPTY_MARKERS: ObjectiveMarker[] = []

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
  const lengthScale = position.lengthScale
  const textPosition = getObjectiveMarkerTextPosition(marker, position)
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
      <group scale={[lengthScale, 1, 1]}>
        <mesh
          onPointerDown={(event) =>
            pressObjectiveMarkerForDrag(event, marker.uid)
          }
          onPointerUp={handlePointerUp}
          castShadow={false}
          receiveShadow={false}
        >
          <cylinderGeometry
            args={[position.radius, position.radius, 0.025, 6]}
          />
          <meshBasicMaterial
            color={marker.style === 'black' ? '#ffffff' : '#111111'}
            toneMapped={false}
          />
        </mesh>
        <mesh
          position={[0, 0.014, 0]}
          raycast={() => null}
          castShadow={false}
          receiveShadow={false}
        >
          <cylinderGeometry
            args={[position.radius * 0.92, position.radius * 0.92, 0.025, 6]}
          />
          <meshBasicMaterial color={background} toneMapped={false} />
        </mesh>
        <mesh
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
          renderOrder={40}
          visible={isSelected}
          castShadow={false}
          receiveShadow={false}
        >
          <ringGeometry
            args={[position.radius * 1.04, position.radius * 1.14, 6]}
          />
          <meshBasicMaterial
            color="#00c8ff"
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
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

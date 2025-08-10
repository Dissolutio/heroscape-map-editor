import { Instance, Instances, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'
import { terrainCapColors } from '../terrainCapColors'
import { CylinderGeometry } from 'three'

const baseSolidCapCylinderArgs: CylinderGeometryArgs = [
  0.8515,
  0.8615,
  HEXGRID_HEXCAP_HEIGHT,
  6,
  undefined,
  false,
  Math.PI / 6,
  undefined,
]

const SolidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const ref = React.useRef<InstanceRefType>(null)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes, materials } = useGLTF('/rock-cap-leafit.glb') as any
  // const { nodes, materials } = useGLTF('/grass-cap-leafit.glb') as any

  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length
  const basicCapGeometry = new CylinderGeometry(...baseSolidCapCylinderArgs)
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={range}
      ref={ref}
      frustumCulled={false}
      // geometry={
      //   isHighQualityRender ? nodes.GrassCapLeafit.geometry : basicCapGeometry
      // }
      geometry={
        isHighQualityRender ? nodes.RockCapLeafit.geometry : basicCapGeometry
      }
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      // material={materials.GrassCap}
      material={materials.RockCap}
    >
      {/* {isHighQualityRender ? <meshStandardMaterial /> : <meshMatcapMaterial />} */}
      {!isHighQualityRender && <meshMatcapMaterial />}
      {/* <cylinderGeometry args={baseSolidCapCylinderArgs} /> */}
      {boardHexArr.map((hex, i) => (
        <SolidCapInstance
          key={hex.id}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isVisible={range >= i}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
          isHighQualityRender={isHighQualityRender}
        />
      ))}
    </Instances>
  )
}
// useGLTF.preload('/grass-cap-leafit.glb')
useGLTF.preload('/rock-cap-leafit.glb')

export default SolidCaps

function SolidCapInstance({
  boardHex,
  onPointerUp,
  isVisible,
  isLightsAndShadowsRender,
  isHighQualityRender,
}: BoardHexPieceProps & {
  isVisible: boolean
  isLightsAndShadowsRender: boolean
  isHighQualityRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color = isHighQualityRender ? 'yellow' : terrainCapColors[boardHex.terrain]
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(color)
    // ref.current.position.set(x, y + HEXGRID_HEXCAP_HEIGHT / 2, z)
    ref.current.position.set(
      x,
      // small adjustment down for realistic caps, to show the subterrain through the cracks
      // y,
      y - (isHighQualityRender ? 4 * HEXGRID_HEXCAP_HEIGHT : 0),
      z,
    )
    ref.current.rotation.set(
      0,
      Math.PI / 6 + (getRandomInteger(1, 6) * Math.PI) / 3,
      0,
    )
  }, [boardHex, isHighQualityRender, color])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === boardHex.pieceID) {
      ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
      // ref.current.color.set('yellow')
    }
  }, [boardHex.pieceID, hoveredPieceID, color])

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref.current.color.set('yellow')
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // if (hoveredPieceID !== boardHex.pieceID) {
    ref.current.color.set('yellow')
    onPointerOut(e)
    // }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (e.button !== 0) {
      return
    }
    if (penMode === 'select') {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    } else {
      onPointerUp(e, boardHex)
    }
  }

  return (
    <Instance
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerOut}
      onPointerUp={handlePointerUp}
      frustumCulled={false}
      // receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

function getRandomInteger(min: number, max: number) {
  const minimum = Math.ceil(min) // Ensure min is rounded up to the nearest whole number
  const maximum = Math.floor(max) // Ensure max is rounded down to the nearest whole number
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { useDisposableGLTF } from '../../models/useDisposableGLTF'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { calculateFocusOpacity } from '../../../utils/focus-opacity'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'
import { CylinderGeometry } from 'three'
import type { Material } from 'three'
import { terrainCapColors } from '../hexColors'

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

const SolidCaps = ({
  boardHexArr,
  onPointerUp,
  onContextMenu,
  focusedPieceUID,
  focusStartTime,
}: DreiCapProps) => {
  const ref = React.useRef<InstanceRefType>(null)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/classic1-cap.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)

  // Apply material opacity based on focus state
  useFrame(() => {
    const material = ref.current?.material
    if (!material) return

    const opacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
    )

    // Handle both single material and array of materials
    const materials = Array.isArray(material) ? material : [material]
    for (const mat of materials) {
      if (!mat || typeof mat !== 'object') continue
      const m = mat as Material

      // Only update if opacity changed significantly (avoid thrashing)
      if (Math.abs((m.opacity ?? 1) - opacity) > 0.001) {
        m.opacity = opacity
        m.transparent = opacity < 1
        m.depthWrite = opacity >= 1
        m.needsUpdate = true
      }
    }
  })

  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length
  const basicCapGeometry = new CylinderGeometry(...baseSolidCapCylinderArgs)
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={range}
      ref={ref}
      frustumCulled={false}
      geometry={
        isHighQualityRender ? nodes.Classic1_Cap.geometry : basicCapGeometry
      }
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    >
      {isHighQualityRender ? <meshStandardMaterial /> : <meshMatcapMaterial />}
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
// useGltf.preload('/classic1-cap.glb')

export default SolidCaps

function SolidCapInstance({
  boardHex,
  onPointerUp,
  onContextMenu,
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
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color = terrainCapColors[boardHex.terrain]

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(color)
    // ref.current.position.set(x, y + HEXGRID_HEXCAP_HEIGHT / 2, z)
    ref.current.position.set(
      x,
      // small adjustment down for realistic caps, to show the subterrain through the cracks
      y - (isHighQualityRender ? HEXGRID_HEXCAP_HEIGHT : 0),
      z,
    )
    ref.current.rotation.set(
      0,
      Math.PI / 6 + (getRandomInteger(1, 6) * Math.PI) / 3,
      0,
    )
  }, [boardHex, color, isHighQualityRender])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === boardHex?.boardPieceUID) {
      // ref.current.color.set('yellow')
    } else {
      ref?.current?.color?.set?.(color)
    }
  }, [boardHex.boardPieceUID, hoveredPieceID, color])

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref?.current?.color?.set?.('yellow')
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // if (hoveredPieceID !== boardHex.pieceID) {
    ref?.current?.color?.set?.(color)
    onPointerOut(e)
    // }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    if (e.button === 0) {
      // Left click
      onPointerUp(e, boardHex)
    }
    // Ignore middle mouse (button 1) and other buttons
  }
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    if (e.button === 2 && onContextMenu) {
      // Right click - use onPointerDown to catch it before browser context menu
      e.nativeEvent.preventDefault()
      e.stopPropagation()
      onContextMenu(e, boardHex.id)
    }
  }

  return (
    <Instance
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerOut}
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

function getRandomInteger(min: number, max: number) {
  const minimum = Math.ceil(min) // Ensure min is rounded up to the nearest whole number
  const maximum = Math.floor(max) // Ensure max is rounded down to the nearest whole number
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { Color, CylinderGeometry, type Material } from 'three'
import { setPieceSubterrainHovered } from '../../../hooks/useInstanceHighlightSync'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import type { BoardHex } from '../../../types'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { calculateFocusOpacity } from '../../../utils/focus-opacity'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { useDisposableGLTF } from '../../models/useDisposableGLTF'
import { terrainCapColors } from '../hexColors'
import type {
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'

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

// Create geometry once at module level to avoid GPU memory leaks
const basicCapGeometry = new CylinderGeometry(...baseSolidCapCylinderArgs)

// The PositionMesh proxy for whichever instance the pointer is currently interacting with
type CapInstanceObject = { userData: { boardHex?: BoardHex }; color: Color }

const SolidCaps = ({
  boardHexArr,
  onPointerUp,
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
  const { onPointerEnter, onPointerOut } = usePieceHoverState()

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

  // Single set of handlers shared by every solid cap in this batch, registered once on the
  // parent InstancedMesh instead of per-hex (drei still resolves the exact instance that was
  // hit via its PositionMesh proxy). We read the current hex straight off that instance's
  // userData -- kept in sync by each SolidCapInstance's own position/color effect below --
  // rather than an instance index, so a hex that's been re-terrained, rotated, or moved
  // always resolves to its correct, current coordinates and color.
  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as CapInstanceObject
    const boardHex = target.userData.boardHex
    if (!boardHex) return
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    target.color.set('yellow')
    setPieceSubterrainHovered(boardHex.boardPieceUID, true)
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as CapInstanceObject
    const boardHex = target.userData.boardHex
    if (boardHex) {
      target.color.set(terrainCapColors[boardHex.terrain])
      setPieceSubterrainHovered(boardHex.boardPieceUID, false)
    }
    onPointerOut(e)
  }
  const handlePointerUpLocal = (e: ThreeEvent<PointerEvent>) => {
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (e.button !== 0) return
    const target = e.object as unknown as CapInstanceObject
    const boardHex = target.userData.boardHex
    if (!boardHex) return
    onPointerUp(e, boardHex)
  }

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
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerOut}
      onPointerUp={handlePointerUpLocal}
    >
      {isHighQualityRender ? <meshStandardMaterial /> : <meshMatcapMaterial />}
      {/* <cylinderGeometry args={baseSolidCapCylinderArgs} /> */}
      {boardHexArr.map((hex) => (
        <SolidCapInstance
          key={hex.id}
          boardHex={hex}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
          isHighQualityRender={isHighQualityRender}
        />
      ))}
    </Instances>
  )
}
// useGltf.preload('/classic1-cap.glb')

// Create a single dummy color object at the module level to reuse for updates
const _colorTemp = new Color()

export default SolidCaps

function SolidCapInstance({
  boardHex,
  isLightsAndShadowsRender,
  isHighQualityRender,
}: {
  boardHex: BoardHex
  isLightsAndShadowsRender: boolean
  isHighQualityRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const color = terrainCapColors[boardHex.terrain]

  // Effect: Initial color/position, and keep userData.boardHex current for the
  // parent's pointer handlers (re-runs whenever this hex's terrain/coords change).
  // Caps only ever highlight from their own direct hover (see handlePointerEnter/Out
  // above), never from the shared piece uid, so the resting color here is always the
  // plain terrain color, regardless of whether the parent subterrain is hovered.
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
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
    ref.current.userData.boardHex = boardHex
    ref.current.color.set(color)
  }, [boardHex, color, isHighQualityRender])

  return (
    <Instance
      ref={ref}
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

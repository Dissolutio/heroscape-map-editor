import { Instance, Instances, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import type { BufferGeometry } from 'three'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
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
import { HexTerrain } from '../../../types'

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

type GLTFNodes = Record<string, { geometry?: BufferGeometry }>


function isRoadStyleTerrain(terrain: string) {
  return terrain === HexTerrain.road || terrain === HexTerrain.wallWalk
}

const SolidCaps = ({
  boardHexArr,
  onPointerUp,
  focusedPieceUID,
  focusStartTime,
}: DreiCapProps) => {
  const classicRef = React.useRef<InstanceRefType>(null)
  const roadRef = React.useRef<InstanceRefType>(null)
  const { nodes } = useGLTF('/classic1-cap.glb') as { nodes: GLTFNodes }
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes: rockNodes, materials: rockMaterials } = useGLTF('/rock-cap-leafit.glb') as any
  // const { nodes, materials } = useGLTF('/grass-cap-leafit.glb') as any

  const { nodes: roadNodes, materials: roadMaterials } = useGLTF('/road-cap-textured.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)

  const visibleHexes = boardHexArr.filter((bh) => bh.altitude <= viewingLevel)
  const roadHexes = visibleHexes.filter((bh) => isRoadStyleTerrain(bh.terrain))
  const nonRoadHexes = visibleHexes.filter(
    (bh) => !isRoadStyleTerrain(bh.terrain),
  )

  const basicCapGeometry = React.useMemo(
    () => new CylinderGeometry(...baseSolidCapCylinderArgs),
    [],
  )
  const classicHighQualityGeometry = nodes.Classic1_Cap.geometry
  const roadHighQualityGeometry = roadNodes.RoadCapTextured.geometry
  const roadHighQualityMaterial = roadMaterials.Material

  // Apply material opacity based on focus state
  useFrame(() => {
    const opacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
    )

    for (const instancesRef of [classicRef, roadRef]) {
      const material = instancesRef.current?.material
      if (!material) continue

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
    }
  })

  if (boardHexArr.length === 0) return null

  const renderCaps = (
    hexes: typeof boardHexArr,
    geometry: BufferGeometry,
    ref: React.RefObject<InstanceRefType>,
  ) => (
    <Instances
      limit={INSTANCE_LIMIT}
      range={hexes.length}
      ref={ref}
      frustumCulled={false}
      geometry={geometry}
      material={roadHighQualityMaterial}
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
      {isHighQualityRender ? <></> : <meshMatcapMaterial />}
      {hexes.map((hex) => (
        <SolidCapInstance
          key={hex.id}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
          isHighQualityRender={isHighQualityRender}
        />
      ))}
    </Instances>
  )

  if (!isHighQualityRender) {
    return renderCaps(visibleHexes, basicCapGeometry, classicRef)
  }

  if (!classicHighQualityGeometry) {
    return renderCaps(visibleHexes, basicCapGeometry, classicRef)
  }

  return (
    <>
      {nonRoadHexes.length > 0 &&
        renderCaps(nonRoadHexes, classicHighQualityGeometry, classicRef)}
      {roadHexes.length > 0 &&
        renderCaps(
          roadHexes,
          roadHighQualityGeometry,
          roadRef,
        )}
    </>
  )
}

export default SolidCaps

function SolidCapInstance({
  boardHex,
  onPointerUp,
  isLightsAndShadowsRender,
  isHighQualityRender,
}: BoardHexPieceProps & {
  isLightsAndShadowsRender: boolean
  isHighQualityRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color = isHighQualityRender ? '#EBEBEB' : terrainCapColors[boardHex.terrain]

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
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref?.current?.color?.set?.('yellow')
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    // if (hoveredPieceID !== boardHex.pieceID) {
    ref?.current?.color?.set?.(color)
    onPointerOut(e)
    // }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (e.button !== 0) {
      return
    }
    onPointerUp(e, boardHex)
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

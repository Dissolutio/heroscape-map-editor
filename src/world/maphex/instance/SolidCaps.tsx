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
import { getOnionSkinOpacity } from '../../../utils/onion-skin'
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
  focusedPieceUID,
  focusStartTime,
}: DreiCapProps) => {
  const refMap = React.useRef<Record<number, InstanceRefType | null>>({})
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/classic1-cap.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isOnionSkinMode = useBoundStore((s) => s.isOnionSkinMode)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)

  const hexGroups = React.useMemo(() => {
    const groups = new Map<number, typeof boardHexArr>()
    if (!isOnionSkinMode) {
      groups.set(0, boardHexArr)
      return groups
    }
    for (const hex of boardHexArr) {
      const distance = Math.abs(hex.altitude - viewingLevel)
      const bucket = groups.get(distance)
      if (bucket) {
        bucket.push(hex)
      } else {
        groups.set(distance, [hex])
      }
    }
    return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]))
  }, [boardHexArr, viewingLevel, isOnionSkinMode])

  useFrame(() => {
    const opacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
    )

    for (const [distance, ref] of Object.entries(refMap.current)) {
      const instance = ref
      if (!instance) continue
      const groupOpacity = isOnionSkinMode
        ? opacity * getOnionSkinOpacity(Number(distance))
        : opacity

      const material = instance.material
      if (!material) continue
      const materials = Array.isArray(material) ? material : [material]
      for (const mat of materials) {
        if (!mat || typeof mat !== 'object') continue
        const m = mat as Material
        if (Math.abs((m.opacity ?? 1) - groupOpacity) > 0.001) {
          m.opacity = groupOpacity
          m.transparent = groupOpacity < 1
          m.depthWrite = groupOpacity >= 1
          m.needsUpdate = true
        }
      }
    }
  })

  if (boardHexArr.length === 0) return null
  const basicCapGeometry = new CylinderGeometry(...baseSolidCapCylinderArgs)
  return (
    <>
      {Array.from(hexGroups.entries()).map(([distance, hexGroup]) => {
        const opacity = isOnionSkinMode
          ? getOnionSkinOpacity(distance)
          : 1
        return (
          <Instances
            key={distance}
            limit={INSTANCE_LIMIT}
            range={hexGroup.length}
            ref={(element) => {
              refMap.current[distance] = element
            }}
            frustumCulled={false}
            geometry={
              isHighQualityRender ? nodes.Classic1_Cap.geometry : basicCapGeometry
            }
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
          >
            {isHighQualityRender ? (
              <meshStandardMaterial transparent opacity={opacity} />
            ) : (
              <meshMatcapMaterial transparent opacity={opacity} />
            )}
            {/* <cylinderGeometry args={baseSolidCapCylinderArgs} /> */}
            {hexGroup.map((hex, i) => (
              <SolidCapInstance
                key={`${hex.id}-${distance}`}
                boardHex={hex}
                onPointerUp={onPointerUp}
                isVisible={hexGroup.length >= i}
                isLightsAndShadowsRender={isLightsAndShadowsRender}
                isHighQualityRender={isHighQualityRender}
              />
            ))}
          </Instances>
        )
      })}
    </>
  )
}
// useGltf.preload('/classic1-cap.glb')

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

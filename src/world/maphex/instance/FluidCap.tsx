import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { calculateFocusOpacity } from '../../../utils/focus-opacity'
import { getOnionSkinOpacity } from '../../../utils/onion-skin'
import { hexTerrainColor } from '../hexColors'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'
import type { Material } from 'three'

const baseFluidCapCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.9,
  0.001,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
export const FLUID_CAP_OPACITY = 0.85
const FluidCaps = ({
  boardHexArr,
  onPointerUp,
  focusedPieceUID,
  focusStartTime,
}: DreiCapProps) => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isOnionSkinMode = useBoundStore((s) => s.isOnionSkinMode)
  const refMap = React.useRef<Record<number, InstanceRefType | null>>({})

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

  // Apply material opacity based on focus state
  useFrame(() => {
    const focusOpacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
    )

    for (const [distance, instance] of Object.entries(refMap.current)) {
      if (!instance) continue
      const onionOpacity = isOnionSkinMode
        ? getOnionSkinOpacity(Number(distance))
        : 1
      const targetOpacity =
        (focusOpacity < 1 ? focusOpacity : FLUID_CAP_OPACITY) * onionOpacity

      const material = instance.material
      if (!material) continue
      const materials = Array.isArray(material) ? material : [material]
      for (const mat of materials) {
        if (!mat || typeof mat !== 'object') continue
        const m = mat as Material
        if (Math.abs((m.opacity ?? FLUID_CAP_OPACITY) - targetOpacity) > 0.001) {
          m.opacity = targetOpacity
          m.transparent = targetOpacity < 1
          m.depthWrite = targetOpacity >= 1
          m.needsUpdate = true
        }
      }
    }
  })

  if (boardHexArr.length === 0) return null
  return (
    <>
      {Array.from(hexGroups.entries()).map(([distance, hexGroup]) => {
        const opacity = isOnionSkinMode
          ? getOnionSkinOpacity(distance)
          : FLUID_CAP_OPACITY
        return (
          <Instances
            key={distance}
            limit={INSTANCE_LIMIT}
            range={hexGroup.length}
            ref={(element) => {
              refMap.current[distance] = element
            }}
            frustumCulled={false}
            receiveShadow={isLightsAndShadowsRender}
          >
            <cylinderGeometry args={baseFluidCapCylinderArgs} />
            {isLightsAndShadowsRender ? (
              <meshStandardMaterial transparent opacity={opacity} />
            ) : (
              <meshLambertMaterial transparent opacity={opacity} />
            )}
            {hexGroup.map((hex, i) => (
              <FluidCap
                key={`${hex.id}-${distance}fluid`}
                boardHex={hex}
                onPointerUp={onPointerUp}
                isVisible={hexGroup.length >= i}
                isLightsAndShadowsRender={isLightsAndShadowsRender}
              />
            ))}
          </Instances>
        )
      })}
    </>
  )
}

export default FluidCaps

function FluidCap({
  boardHex,
  onPointerUp,
  isVisible,
  isLightsAndShadowsRender,
}: BoardHexPieceProps & {
  isVisible: boolean
  isLightsAndShadowsRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color =
    hexTerrainColor[boardHex.terrain as keyof typeof hexTerrainColor]

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(
      hexTerrainColor[boardHex.terrain as keyof typeof hexTerrainColor],
    )
    ref.current.position.set(
      x,
      y -
      (HEXGRID_HEX_HEIGHT - HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE) +
      0.001,
      z,
    )
  }, [boardHex])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === boardHex?.boardPieceUID) {
      // ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
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
    ref?.current?.color?.set?.(color)
    onPointerOut(e)
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
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import type { Color, Material } from 'three'
import { setPieceSubterrainHovered } from '../../../hooks/useInstanceHighlightSync'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import type { BoardHex } from '../../../types'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { calculateFocusOpacity } from '../../../utils/focus-opacity'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { hexTerrainColor } from '../hexColors'
import type {
  CylinderGeometryArgs,
  DreiCapProps,
  InstanceRefType,
} from '../instance-hex'

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

// The PositionMesh proxy for whichever instance the pointer is currently interacting with
type CapInstanceObject = { userData: { boardHex?: BoardHex }; color: Color }

const FluidCaps = ({
  boardHexArr,
  onPointerUp,
  focusedPieceUID,
  focusStartTime,
}: DreiCapProps) => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const ref = React.useRef<InstanceRefType>(null)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()

  // Apply material opacity based on focus state
  useFrame(() => {
    const material = ref.current?.material
    if (!material) return

    // Calculate opacity: base 0.85 for fluid caps, reduced if another piece is focused
    const focusOpacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
    )
    const targetOpacity = focusOpacity < 1 ? focusOpacity : FLUID_CAP_OPACITY

    // Handle both single material and array of materials
    const materials = Array.isArray(material) ? material : [material]
    for (const mat of materials) {
      if (!mat || typeof mat !== 'object') continue
      const m = mat as Material

      // Only update if opacity changed significantly (avoid thrashing)
      if (Math.abs((m.opacity ?? FLUID_CAP_OPACITY) - targetOpacity) > 0.001) {
        m.opacity = targetOpacity
        m.needsUpdate = true
      }
    }
  })

  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length

  // Single set of handlers shared by every fluid cap in this batch, registered once on the
  // parent InstancedMesh instead of per-hex (drei still resolves the exact instance that was
  // hit via its PositionMesh proxy). We read the current hex straight off that instance's
  // userData -- kept in sync by each FluidCap's own position/color effect below -- rather
  // than an instance index, so a hex that's been re-terrained, rotated, or moved always
  // resolves to its correct, current coordinates and color.
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
      target.color.set(
        hexTerrainColor[boardHex.terrain as keyof typeof hexTerrainColor],
      )
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
      range={range} // no way there would be this many fluid caps, but with an overhang on every other hex, maybe
      ref={ref}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      onPointerEnter={handlePointerEnter}
      onPointerOut={handlePointerOut}
      onPointerUp={handlePointerUpLocal}
    >
      <cylinderGeometry args={baseFluidCapCylinderArgs} />
      {isLightsAndShadowsRender ? (
        <meshStandardMaterial transparent opacity={FLUID_CAP_OPACITY} />
      ) : (
        <meshLambertMaterial transparent opacity={FLUID_CAP_OPACITY} />
      )}
      {boardHexArr.map((hex, i) => (
        <FluidCap
          key={`${hex.id + i}fluid`}
          boardHex={hex}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      ))}
    </Instances>
  )
}

export default FluidCaps

function FluidCap({
  boardHex,
  isLightsAndShadowsRender,
}: {
  boardHex: BoardHex
  isLightsAndShadowsRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const color =
    hexTerrainColor[boardHex.terrain as keyof typeof hexTerrainColor]

  // Effect: Initial color/position, and keep userData.boardHex current for the
  // parent's pointer handlers (re-runs whenever this hex's terrain/coords change).
  // Caps only ever highlight from their own direct hover (see handlePointerEnter/Out
  // above), never from the shared piece uid, so the resting color here is always the
  // plain terrain color, regardless of whether the parent subterrain is hovered.
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.position.set(
      x,
      y -
        (HEXGRID_HEX_HEIGHT - HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE) +
        0.001,
      z,
    )
    ref.current.userData.boardHex = boardHex
    ref.current.color.set(color)
  }, [boardHex, color])

  return (
    <Instance
      ref={ref}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

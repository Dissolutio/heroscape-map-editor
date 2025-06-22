import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import {
  HEXGRID_HEXCAP_FLUID_SCALE,
  HEXGRID_HEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { hexTerrainColor } from '../hexColors'
import type {
  BoardHexPieceProps,
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
const FluidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const ref = React.useRef<InstanceRefType>(null)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={range} // no way there would be this many fluid caps, but with an overhang on every other hex, maybe
      ref={ref}
      frustumCulled={false}
      receiveShadow={isHighQualityRender}
    >
      <cylinderGeometry args={baseFluidCapCylinderArgs} />
      {isHighQualityRender ? <meshStandardMaterial transparent opacity={FLUID_CAP_OPACITY} /> : <meshLambertMaterial transparent opacity={FLUID_CAP_OPACITY} />}
      {boardHexArr.map((hex, i) => (
        <FluidCap
          key={`${hex.id + i}fluid`}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isVisible={range >= i}
          isHighQualityRender={isHighQualityRender}
        />
      ))}
    </Instances>
  )
}

export default FluidCaps

function FluidCap({
  boardHex,
  onPointerUp,
  isVisible,
  isHighQualityRender
}: BoardHexPieceProps & { isVisible: boolean, isHighQualityRender: boolean }) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerOut } = usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const penMode = useBoundStore((s) => s.penMode)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color = hexTerrainColor[boardHex.terrain]
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(hexTerrainColor[boardHex.terrain])
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
    if (hoveredPieceID === boardHex.pieceID) {
      // ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
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
    ref.current.color.set(color)
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
    if (penMode === 'select') {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    } else {
      onPointerUp(e, boardHex)
    }
  }

  return (
    <Instance
      ref={ref}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
    />
  )
}

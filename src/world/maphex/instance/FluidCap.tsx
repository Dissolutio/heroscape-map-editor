import { Instance, Instances } from '@react-three/drei'
import React from 'react'
import {
  CylinderGeometryArgs,
  DreiCapProps,
  DreiInstanceCapProps,
  InstanceRefType,
} from '../instance-hex'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import {
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { hexTerrainColor } from '../hexColors'
import { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'

const baseFluidCapCylinderArgs: CylinderGeometryArgs = [
  1,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

const FluidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const ref = React.useRef<InstanceRefType>(undefined!)
  if (boardHexArr.length === 0) return null
  return (
    <Instances
      limit={INSTANCE_LIMIT}
      range={boardHexArr.length} // no way there would be this many fluid caps, but with an overhang on every other hex, maybe
      ref={ref}
      frustumCulled={false}
    >
      <cylinderGeometry args={baseFluidCapCylinderArgs} />
      <meshLambertMaterial transparent opacity={0.85} />
      {boardHexArr.map((hex, i) => (
        <FluidCap
          key={hex.id + i + 'fluid'}
          boardHex={hex}
          onPointerUp={onPointerUp}
          pieceID={hex?.pieceID ?? ''}
        />
      ))}
    </Instances>
  )
}

export default FluidCaps

function FluidCap({
  boardHex,
  onPointerUp,
  pieceID,
}: DreiInstanceCapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = React.useRef<any>(undefined!)
  const hoveredPieceID = useBoundStore(s => s.hoveredPieceID)
  const color = hexTerrainColor[boardHex.terrain]

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, z } = getBoardHex3DCoords(boardHex)
    const y =
      (boardHex.altitude - 1) * HEXGRID_HEX_HEIGHT +
      HEXGRID_HEXCAP_FLUID_HEIGHT / 2
    ref.current.color.set(hexTerrainColor[boardHex.terrain])
    ref.current.position.set(x, y, z)
  }, [boardHex])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID === pieceID) {
      ref.current.color.set('yellow')
    } else {
      ref.current.color.set(color)
    }
  }, [pieceID, hoveredPieceID, color])

  const {
    onPointerEnter,
    onPointerOut,
  } = usePieceHoverState()
  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    ref.current.color.set('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (hoveredPieceID !== boardHex.pieceID) {
      ref.current.color.set(color)
      onPointerOut(e)
    }
  }
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    onPointerUp(e, boardHex)
  }

  return (
    <Instance
      ref={ref}
      onPointerUp={handleUp}
      onPointerEnter={handleEnter}
      onPointerOut={handleOut}
      frustumCulled={false}
    />
  )
}

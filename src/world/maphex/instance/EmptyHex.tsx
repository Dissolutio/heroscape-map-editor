import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import { HexTerrain } from '../../../types'
import {
  HEXGRID_EMPTYHEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { hexTerrainColor } from '../hexColors'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
} from '../instance-hex'
import useBoundStore from '../../../store/store'

const baseEmptyCapCylinderArgs: CylinderGeometryArgs = [
  0.999,
  0.997,
  HEXGRID_EMPTYHEX_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]
const emptyHexColor = hexTerrainColor[HexTerrain.empty]

const EmptyHexes = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  if (boardHexArr.length === 0) return null
  return (
    <Instances
      range={boardHexArr.length}
      limit={INSTANCE_LIMIT}
      frustumCulled={false} // BUG: otherwise they disappear from view at unexpected angless
      receiveShadow={isLightsAndShadowsRender}
    >
      <cylinderGeometry args={baseEmptyCapCylinderArgs} />
      {isLightsAndShadowsRender ? (
        <meshStandardMaterial transparent opacity={0.5} />
      ) : (
        <meshLambertMaterial transparent opacity={0.5} />
      )}
      {boardHexArr.map((hex, i) => (
        <EmptyHex
          key={`${hex.id + i}empty`}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      ))}
    </Instances>
  )
}

export default EmptyHexes

function EmptyHex({
  boardHex,
  onPointerUp,
  isLightsAndShadowsRender,
}: BoardHexPieceProps & { isLightsAndShadowsRender: boolean }) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnterHex, onPointerOut } = usePieceHoverState()

  // Effect: Initial color/position
  React.useLayoutEffect(() => {
    const { x, z, y } = getBoardHex3DCoords(boardHex)
    if (ref.current) {
      ref.current?.color?.set?.(emptyHexColor)
      ref.current.position.set(x, y, z)
      ref.current.opacity = 0.5
    }
  }, [boardHex])

  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnterHex(e, boardHex)
    ref?.current?.color?.set?.('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (ref.current) {
      ref.current?.color?.set?.(emptyHexColor)
    }
    onPointerOut(e)
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
      // frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

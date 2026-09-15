import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import type { Color } from 'three'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { HexTerrain } from '../../../types'
import type { BoardHex } from '../../../types'
import {
  HEXGRID_EMPTYHEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import { hexTerrainColor } from '../hexColors'
import type { CylinderGeometryArgs, DreiCapProps } from '../instance-hex'

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

// The PositionMesh proxy for whichever instance the pointer is currently interacting with
type CapInstanceObject = { userData: { boardHex?: BoardHex }; color: Color }

const EmptyHexes = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  if (boardHexArr.length === 0) return null

  // Single set of handlers shared by every empty hex in this batch, registered once on the
  // parent InstancedMesh instead of per-hex. We read the current hex straight off the hit
  // instance's userData -- kept in sync by each EmptyHex's own position effect below --
  // rather than an instance index, so a hex that's moved/changed always resolves correctly.
  const handleEnter = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as CapInstanceObject
    const boardHex = target.userData.boardHex
    if (!boardHex) return
    e.stopPropagation() // prevent this hover from passing through and affecting behind
    onPointerEnter(e, boardHex)
    target.color.set('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as CapInstanceObject
    target.color.set(emptyHexColor)
    onPointerOut(e)
  }
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    const target = e.object as unknown as CapInstanceObject
    const boardHex = target.userData.boardHex
    if (!boardHex) return
    onPointerUp(e, boardHex)
  }

  return (
    <Instances
      range={boardHexArr.length}
      limit={INSTANCE_LIMIT}
      frustumCulled={false} // BUG: otherwise they disappear from view at unexpected angless
      receiveShadow={isLightsAndShadowsRender}
      onPointerEnter={handleEnter}
      onPointerOut={handleOut}
      onPointerUp={handleUp}
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
          isLightsAndShadowsRender={isLightsAndShadowsRender}
        />
      ))}
    </Instances>
  )
}

export default EmptyHexes

function EmptyHex({
  boardHex,
  isLightsAndShadowsRender,
}: {
  boardHex: BoardHex
  isLightsAndShadowsRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)

  // Effect: Initial color/position, and keep userData.boardHex current for the
  // parent's pointer handlers
  React.useLayoutEffect(() => {
    const { x, z, y } = getBoardHex3DCoords(boardHex)
    if (ref.current) {
      ref.current?.color?.set?.(emptyHexColor)
      ref.current.position.set(x, y, z)
      ref.current.opacity = 0.5
      ref.current.userData.boardHex = boardHex
    }
  }, [boardHex])

  return (
    <Instance
      ref={ref}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

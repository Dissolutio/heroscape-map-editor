import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import { findVoidMatAtTableHex } from '../../../data/voidMat'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { type BoardHex, HexTerrain, SELECT_PEN_MODE } from '../../../types'
import {
  HEXGRID_EMPTYHEX_HEIGHT,
  INSTANCE_LIMIT,
} from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import {
  pressPieceForDrag,
  reportDragTargetHex,
} from '../../drag/dragController'
import { hexTerrainColor } from '../hexColors'
import type {
  BoardHexPieceProps,
  CylinderGeometryArgs,
  DreiCapProps,
} from '../instance-hex'

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

const EmptyHexes = ({
  boardHexArr,
  onPointerUp,
  onClick,
}: DreiCapProps & {
  onClick: (event: ThreeEvent<MouseEvent>, boardHex: BoardHex) => void
}) => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  if (boardHexArr.length === 0) return null
  return (
    <group userData={{ voidMatDragTable: true }}>
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
            onClick={onClick}
            isLightsAndShadowsRender={isLightsAndShadowsRender}
          />
        ))}
      </Instances>
    </group>
  )
}

export default EmptyHexes

function EmptyHex({
  boardHex,
  onPointerUp,
  onClick,
  isLightsAndShadowsRender,
}: BoardHexPieceProps & {
  onClick: (event: ThreeEvent<MouseEvent>, boardHex: BoardHex) => void
  isLightsAndShadowsRender: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerEnterPID, onPointerOut, onPointerMove } =
    usePieceHoverState()
  const voidMatAtHex = () => {
    const { boardPieces, boardHexes } = useBoundStore.getState()
    return findVoidMatAtTableHex(boardPieces, boardHexes, boardHex)
  }

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
    // Only the select pen hovers the mat under this hex (to select or drag
    // it). Every other pen hovers the hex itself, so its placement preview
    // shows on top of the mat like on any empty hex.
    const mat =
      useBoundStore.getState().penMode === SELECT_PEN_MODE
        ? voidMatAtHex()
        : undefined
    if (mat) {
      onPointerEnterPID(e, mat.uid)
    } else {
      onPointerEnter(e, boardHex)
    }
    ref?.current?.color?.set?.('yellow')
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (ref.current) {
      ref.current?.color?.set?.(emptyHexColor)
    }
    if (voidMatAtHex()) {
      useBoundStore.getState().toggleHoveredPieceID('')
    }
    onPointerOut(e)
  }
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    onPointerUp(e, boardHex)
  }

  return (
    <Instance
      ref={ref}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        const mat = voidMatAtHex()
        if (mat) pressPieceForDrag(e, mat.uid)
      }}
      onPointerUp={handleUp}
      onClick={(e: ThreeEvent<MouseEvent>) => onClick(e, boardHex)}
      onPointerEnter={handleEnter}
      onPointerOut={handleOut}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        onPointerMove(e, boardHex)
        if (
          reportDragTargetHex(boardHex, undefined, {
            x: e.point.x,
            z: e.point.z,
          })
        ) {
          e.stopPropagation()
        }
      }}
      frustumCulled={false}
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
    />
  )
}

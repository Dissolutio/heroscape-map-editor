import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import { Color, CylinderGeometry } from 'three'
import { isE2EDeterministic } from '../../../e2e/isE2E'
import { hashToUnit } from '../../../e2e/seededRandom'
import usePieceHoverState from '../../../hooks/usePieceHoverState'
import useBoundStore from '../../../store/store'
import { type BoardHex, HexTerrain } from '../../../types'
import { HEXGRID_HEXCAP_HEIGHT, INSTANCE_LIMIT } from '../../../utils/constants'
import { getBoardHex3DCoords } from '../../../utils/map-utils'
import {
  isDragPassThrough,
  pressPieceForDrag,
  reportDragTargetHex,
} from '../../drag/dragController'
import { useDisposableGLTF } from '../../models/useDisposableGLTF'
import { terrainCapColors } from '../hexColors'
import type {
  BoardHexPieceProps,
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

const SolidCaps = ({ boardHexArr, onPointerUp }: DreiCapProps) => {
  const ref = React.useRef<InstanceRefType>(null)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/classic1-cap.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const genericSolidCapColor = useBoundStore((s) => s.genericSolidCapColor)

  if (boardHexArr.length === 0) return null
  const range = boardHexArr.filter((bh) => bh.altitude <= viewingLevel).length
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
    >
      {isHighQualityRender ? <meshStandardMaterial /> : <meshMatcapMaterial />}
      {boardHexArr.map((hex, i) => (
        <SolidCapInstance
          key={hex.id}
          boardHex={hex}
          onPointerUp={onPointerUp}
          isVisible={range >= i}
          isLightsAndShadowsRender={isLightsAndShadowsRender}
          isHighQualityRender={isHighQualityRender}
          genericSolidCapColor={genericSolidCapColor}
        />
      ))}
    </Instances>
  )
}

// Create a single dummy color object at the module level to reuse for updates
const _colorTemp = new Color()

export default SolidCaps

function SolidCapInstance({
  boardHex,
  onPointerUp,
  isVisible,
  isLightsAndShadowsRender,
  isHighQualityRender,
  genericSolidCapColor,
}: BoardHexPieceProps & {
  isVisible: boolean
  isLightsAndShadowsRender: boolean
  isHighQualityRender: boolean
  genericSolidCapColor: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <Type too weird>
  const ref = React.useRef<any>(null)
  const { onPointerEnter, onPointerOut, onPointerMove } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const color =
    boardHex.terrain === HexTerrain.generic
      ? genericSolidCapColor
      : terrainCapColors[boardHex.terrain]

  // Effect: Initial color/position
  React.useEffect(() => {
    const { x, y, z } = getBoardHex3DCoords(boardHex)
    ref.current.color.set(color)
    ref.current.position.set(
      x,
      // small adjustment down for realistic caps, to show the subterrain through the cracks
      y - (isHighQualityRender ? HEXGRID_HEXCAP_HEIGHT : 0),
      z,
    )
    // under ?e2e, a stable per-hex value so screenshots repeat
    const unit = isE2EDeterministic ? hashToUnit(boardHex.id) : Math.random()
    ref.current.rotation.set(
      0,
      Math.PI / 6 + (getRandomInteger(1, 6, unit) * Math.PI) / 3,
      0,
    )
  }, [boardHex, color, isHighQualityRender])

  // update color when piece is hovered
  React.useEffect(() => {
    if (hoveredPieceID !== boardHex?.boardPieceUID) {
      ref?.current?.color?.set?.(color)
    }
  }, [boardHex.boardPieceUID, hoveredPieceID, color])

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    // the pointer sees through a piece being dragged
    if (isDragPassThrough(boardHex.boardPieceUID)) return
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
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerOut}
      onPointerUp={handlePointerUp}
      onPointerDown={(e: ThreeEvent<PointerEvent>) =>
        isVisible && pressPieceForDrag(e, boardHex.boardPieceUID)
      }
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!isVisible) return
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

function getRandomInteger(min: number, max: number, unit = Math.random()) {
  const minimum = Math.ceil(min) // Ensure min is rounded up to the nearest whole number
  const maximum = Math.floor(max) // Ensure max is rounded down to the nearest whole number
  return Math.floor(unit * (maximum - minimum + 1)) + minimum
}

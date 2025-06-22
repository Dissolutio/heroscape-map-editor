import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'
import ObstacleBase from './ObstacleBase'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

// These were made after the castle walls and are VERY SIMILAR. TODO: DRY
export default function CastleBases({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const { x, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const pieceID = boardHex.pieceID
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  // onPointerEnter={e => isVisible ? onPointerEnter(e, boardHex) : noop()}
  // onPointerOut={e => isVisible ? onPointerOut(e) : noop()}
  const isHighlighted = isHovered || isSelected
  const yellowColor = 'yellow'
  const bodyGeometry = pieceID.includes(Pieces.castleBaseEnd)
    ? nodes.CastleWallEndBody.geometry
    : pieceID.includes(Pieces.castleBaseStraight)
      ? nodes.CastleWallStraightBody.geometry
      : nodes.CastleWallCornerBody.geometry
  const capGeometry = pieceID.includes(Pieces.castleBaseEnd)
    ? nodes.CastleWallEndCap.geometry
    : pieceID.includes(Pieces.castleBaseStraight)
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation()
    onPointerEnter(e, boardHex)
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    e.stopPropagation()
    onPointerOut(e)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const material = isHighQualityRender ? (
    <meshStandardMaterial color={color} />
  ) : (
    <meshMatcapMaterial color={color} />
  )
  return (
    <>
      <group
        position={[x, yBase, z]}
        rotation={[0, (boardHex.pieceRotation * -Math.PI) / 3, 0]}
      >
        {selectedPieceID === boardHex.pieceID && (
          <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />
        )}
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={bodyGeometry}
          onPointerUp={onPointerUpBody}
          onPointerEnter={(e) => onPointerEnter(e, boardHex)}
          onPointerOut={onPointerOut}
        >
          {material}
        </mesh>

        {/* Each wall has a WallCap mesh, then each wall-type adds on its little directional indicator mesh */}
        <group
          onPointerUp={(e) => onPointerUp(e, boardHex)}
          onPointerEnter={onPointerEnterCap}
          onPointerOut={onPointerOutCap}
        >
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={nodes.WallCap.geometry}
            onPointerEnter={onPointerEnterCap}
            onPointerOut={onPointerOutCap}
          >
            {material}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={capGeometry}
          >
            {material}
          </mesh>
        </group>
      </group>
      <ObstacleBase x={x} y={yBaseCap} z={z} color={color} />
    </>
  )
}

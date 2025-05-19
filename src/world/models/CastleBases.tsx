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
  underHexTerrain: string
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

// These were made after the castle walls and are VERY SIMILAR. TODO: DRY
export default function CastleBases({
  boardHex,
  underHexTerrain,
  onPointerUp,
}: Props) {
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const [capColor, setCapColor] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const { x, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const pieceID = boardHex.pieceID
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
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
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setCapColor('yellow')
    e.stopPropagation()
    onPointerEnter(e, boardHex)
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setCapColor(hexTerrainColor[HexTerrain.castle])
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
          geometry={bodyGeometry}
          onPointerUp={onPointerUpBody}
          onPointerEnter={(e) => onPointerEnter(e, boardHex)}
          onPointerOut={onPointerOut}
        >
          <meshMatcapMaterial
            color={
              isHighlighted ? yellowColor : hexTerrainColor[boardHex.terrain]
            }
          />
        </mesh>

        {/* Each wall has a WallCap mesh, then each wall-type adds on its little directional indicator mesh */}
        <group
          onPointerUp={(e) => onPointerUp(e, boardHex)}
          onPointerEnter={onPointerEnterCap}
          onPointerOut={onPointerOutCap}
        >
          <mesh
            geometry={nodes.WallCap.geometry}
            onPointerEnter={onPointerEnterCap}
            onPointerOut={onPointerOutCap}
          >
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : capColor}
            />
          </mesh>
          <mesh geometry={capGeometry}>
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : capColor}
            />
          </mesh>
        </group>
      </group>
      <ObstacleBase
        x={x}
        y={yBaseCap}
        z={z}
        color={isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]}
      />
    </>
  )
}

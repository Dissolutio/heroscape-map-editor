import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import { Vector3 } from 'three'

import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'
import { getBoardHex3DCoords } from '../../utils/map-utils'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'
import ObstacleBase from './ObstacleBase'

type Props = {
  boardHex: BoardHex
  underHexTerrain: string
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleWall({ boardHex, underHexTerrain, onPointerUp }: Props) {
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const [capColor, setCapColor] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const { x, z, yBase, yBaseCap } = getBoardHex3DCoords(boardHex)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const isHighlighted = isHovered || isSelected
  const yellowColor = 'yellow'
  const castleColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.castle]
  const rotation = boardHex?.pieceRotation ?? 0
  const scaleYAdjust = 0.01 // just a little to get it out of the subterrain
  // castle walls are 10 levels tall, UNLESS stacked on another wall, then they are 9 (they have a 1-level bottom base when on land)
  const scaleY = (boardHex?.obstacleHeight ?? 9) + (1 - scaleYAdjust)
  const scale = new Vector3(1, scaleY, 1)
  const pieceID = boardHex.pieceID
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setCapColor('yellow')
    e.stopPropagation()
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    setCapColor(hexTerrainColor[HexTerrain.castle])
    e.stopPropagation()
  }
  const bodyGeometry = pieceID.includes(Pieces.castleWallEnd)
    ? nodes.CastleWallEndBody.geometry
    : pieceID.includes(Pieces.castleWallStraight)
      ? nodes.CastleWallStraightBody.geometry
      : nodes.CastleWallCornerBody.geometry
  const capGeometry = pieceID.includes(Pieces.castleWallEnd)
    ? nodes.CastleWallEndCap.geometry
    : pieceID.includes(Pieces.castleWallStraight)
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
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
        position={[x, yBase - 0.005, z]}
        rotation={[0, (rotation * -Math.PI) / 3, 0]}
      >
        {selectedPieceID === boardHex.pieceID && (
          <DeletePieceBillboard pieceID={boardHex.pieceID} y={1} />
        )}
        <mesh
          scale={scale}
          geometry={bodyGeometry}
          onPointerUp={onPointerUpBody}
          onPointerEnter={(e) => onPointerEnter(e, boardHex)}
          onPointerOut={(e) => onPointerOut(e)}
        >
          <meshMatcapMaterial color={castleColor} />
        </mesh>
        <>
          <mesh
            geometry={nodes.WallCap.geometry}
            position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
            onPointerUp={(e) => onPointerUp(e, boardHex)}
            onPointerEnter={onPointerEnterCap}
            onPointerOut={onPointerOutCap}
          >
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : capColor}
            />
          </mesh>
          <mesh
            geometry={capGeometry}
            position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
            onPointerUp={(e) => onPointerUp(e, boardHex)}
          >
            <meshMatcapMaterial
              color={isHighlighted ? yellowColor : capColor}
            />
          </mesh>
        </>
      </group>
      {boardHex.obstacleHeight === 9 && ( // when it's 8, castle is wall-on-wall and no base is shown
        <ObstacleBase
          x={x}
          y={yBaseCap}
          z={z}
          color={isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]}
        />
      )}
    </>
  )
}
useGLTF.preload('/adjustable-castle-walls.glb')

import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import React from 'react'
import { Vector3 } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import {
  HEXGRID_HEX_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function CastleWall({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const [capColor, setCapColor] = React.useState(
    hexTerrainColor[HexTerrain.castle],
  )
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted =
    hoveredPieceID === boardHex.pieceID || selectedPieceID === boardHex.pieceID
  const yellowColor = 'yellow'
  const scaleYAdjust = 0.01 // just a little to get it out of the subterrain
  // castle walls are 10 levels tall, UNLESS stacked on another wall, then they are 9 (they have a 1-level bottom base when on land)
  const scaleY = (boardHex?.obstacleHeight ?? 9) + (1 - scaleYAdjust)
  const scale = new Vector3(1, scaleY, 1)
  const pieceID = boardHex.pieceID
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.castle]
  const onPointerEnterCap = (e: ThreeEvent<PointerEvent>) => {
    setCapColor('yellow')
    e.stopPropagation()
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
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
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      selectedPieceID === boardHex.pieceID ? '' : boardHex.pieceID,
    )
  }

  return (
    <>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        scale={scale}
        geometry={bodyGeometry}
        onPointerUp={onPointerUpBody}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {basicModelMaterial(color, isHighQualityRender)}
      </mesh>
      <group
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={onPointerEnterCap}
        onPointerOut={onPointerOutCap}
      >
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.WallCap.geometry}
          position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
        >
          {basicModelMaterial(capColor, isHighQualityRender)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={capGeometry}
          position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
          onPointerUp={(e) => onPointerUp(e, boardHex)}
        >
          {basicModelMaterial(capColor, isHighQualityRender)}
        </mesh>
      </group>
    </>
  )
}
export function CastleWallPreview({
  opacity,
  isCastleEnd,
  isCastleStraight,
  isCastleUnder,
}: {
  opacity?: number
  isCastleEnd?: boolean
  isCastleStraight?: boolean
  isCastleUnder?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const capColor = hexTerrainColor[HexTerrain.castle]
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const scaleYAdjust = 0.01 // just a little to get it out of the subterrain
  // castle walls are 10 levels tall, UNLESS stacked on another wall, then they are 9 (they have a 1-level bottom base when on land)
  const scaleY = (isCastleUnder ? 9 : 10) + (1 - scaleYAdjust)
  const scale = new Vector3(1, scaleY, 1)
  const color = hexTerrainColor[HexTerrain.castle]
  const bodyGeometry = isCastleEnd
    ? nodes.CastleWallEndBody.geometry
    : isCastleStraight
      ? nodes.CastleWallStraightBody.geometry
      : nodes.CastleWallCornerBody.geometry
  const capGeometry = isCastleEnd
    ? nodes.CastleWallEndCap.geometry
    : isCastleStraight
      ? nodes.CastleWallStraightCap.geometry
      : nodes.CastleWallCornerCap.geometry
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        scale={scale}
        geometry={bodyGeometry}
      >
        {basicModelMaterial(color, isHighQualityRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.WallCap.geometry}
        position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
      >
        {basicModelMaterial(capColor, isHighQualityRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={capGeometry}
        position={[0, (scaleY - 1) * HEXGRID_HEX_HEIGHT, 0]}
      >
        {basicModelMaterial(capColor, isHighQualityRender, opacityLevel)}
      </mesh>
    </>
  )
}
useGLTF.preload('/adjustable-castle-walls.glb')

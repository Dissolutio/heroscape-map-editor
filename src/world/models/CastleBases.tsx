import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain, Pieces } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

type Props = {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

// These were made after the castle walls and are VERY SIMILAR. TODO: DRY
export default function CastleBase({ boardHex, onPointerUp }: Props) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const pieceID = boardHex.pieceID
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
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
    e.stopPropagation()
    onPointerEnter(e, boardHex)
  }
  const onPointerOutCap = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onPointerOut(e)
  }
  const onPointerUpBody = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  return (
    <>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={bodyGeometry}
        onPointerUp={onPointerUpBody}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={onPointerOut}
      >
        {basicModelMaterial(color, isHighQualityRender)}
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
          {basicModelMaterial(color, isHighQualityRender)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={capGeometry}
        >
          {basicModelMaterial(color, isHighQualityRender)}
        </mesh>
      </group>
    </>
  )
}
export function CastleBasePreview({
  opacity,
  isCastleEnd,
  isCastleStraight,
}: {
  opacity?: number
  isCastleEnd?: boolean
  isCastleStraight?: boolean
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/adjustable-castle-walls.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
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
  const color = hexTerrainColor[HexTerrain.castle]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={bodyGeometry}
      >
        {basicModelMaterial(color, isHighQualityRender)}
      </mesh>

      {/* Each wall has a WallCap mesh, then each wall-type adds on its little directional indicator mesh */}
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.WallCap.geometry}
      >
        {basicModelMaterial(color, isHighQualityRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={capGeometry}
      >
        {basicModelMaterial(color, isHighQualityRender, opacityLevel)}
      </mesh>
    </>
  )
}

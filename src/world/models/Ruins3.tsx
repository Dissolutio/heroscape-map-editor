import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function Ruins3({
  boardHex,
}: {
  boardHex: BoardHex
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ruins3.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.ruin]
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
      geometry={nodes.Ruin_Large_Scanned.geometry}
    >
      {basicModelMaterial(color, isHighQualityRender)}
    </mesh>
  )
}
export function Ruins3Preview() {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ruins3.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const color = hexTerrainColor[HexTerrain.ruin]
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      geometry={nodes.Ruin_Large_Scanned.geometry}
    >
      {basicModelMaterial(color, isHighQualityRender, PIECE_PREVIEW_OPACITY)}
    </mesh>
  )
}

useGLTF.preload('/ruins3.glb')

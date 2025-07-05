import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function Battlement({ pid }: { pid: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/handmade-battlement.glb') as any
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.battlement]
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pid)
  }
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      geometry={nodes.Battlement.geometry}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {basicModelMaterial(color, isHighQualityRender)}
    </mesh>
  )
}
export function BattlementPreview({ opacity }: { opacity?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/handmade-battlement.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const color = hexTerrainColor[HexTerrain.battlement]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <mesh
      receiveShadow={isHighQualityRender}
      castShadow={isHighQualityRender}
      geometry={nodes.Battlement.geometry}
    >
      {basicModelMaterial(color, isHighQualityRender, opacityLevel)}
    </mesh>
  )
}

useGLTF.preload('/handmade-battlement.glb')

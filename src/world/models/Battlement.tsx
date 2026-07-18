import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export function Battlement({ pid, onContextMenu }: { pid: string; onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/handmade-battlement.glb') as any
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.battlement]
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Battlement.geometry}
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender)}
    </mesh>
  )
}
export function BattlementPreview({ opacity }: { opacity?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/handmade-battlement.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor[HexTerrain.battlement]
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Battlement.geometry}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}

// useGltf.preload('/handmade-battlement.glb')

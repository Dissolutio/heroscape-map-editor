import { useDisposableGLTF } from './useDisposableGLTF'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export function FortifiedWall({
  pid,
  onContextMenu,
}: {
  pid: string
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/FortifiedWall.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.ruin]
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
      geometry={nodes.FortifiedWall.geometry}
    >
      {basicModelMaterial(color, isLightsAndShadowsRender)}
    </mesh>
  )
}
export function FortifiedWallPreview() {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/FortifiedWall.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const color = hexTerrainColor[HexTerrain.ruin]
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.FortifiedWall.geometry}
    >
      {basicModelMaterial(
        color,
        isLightsAndShadowsRender,
        PIECE_PREVIEW_OPACITY,
      )}
    </mesh>
  )
}

// useGltf.preload('/FortifiedWall.glb')

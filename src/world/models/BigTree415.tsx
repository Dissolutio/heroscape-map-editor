import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export function BigTree415({
  pid,
  opacity,
}: { pid?: string; opacity?: number }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/big-tree-415.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPiece, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = hoveredPieceID === pid || isSelected
  const treeColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.tree]
  const rockColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.ruin]
  const opacityLevel = (opacity ?? pid) ? 1 : PIECE_PREVIEW_OPACITY
  const pointerHandlers = pid
    ? {
      onPointerUp: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (e.button !== 0) return
        toggleSelectedPieceID(isSelected ? '' : pid)
      },
      onPointerEnter: (e: ThreeEvent<PointerEvent>) =>
        onPointerEnterPiece(e, pid),
      onPointerOut: (e: ThreeEvent<PointerEvent>) => onPointerOut(e),
    }
    : {}
  return (
    <group {...pointerHandlers}>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBoulders.geometry}
      >
        {basicModelMaterial(rockColor, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeTree.geometry}
      >
        {basicDoubleSideModelMaterial(
          treeColor,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBase.geometry}
      >
        {basicModelMaterial(
          hexTerrainColor.treeBase,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
    </group>
  )
}

useGLTF.preload('/big-tree-415.glb')

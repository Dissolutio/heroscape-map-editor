import type { ThreeEvent } from '@react-three/fiber'
import { noop } from 'lodash'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function BigTree415({ pid }: { pid?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/big-tree-415.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (pid) {
      toggleSelectedPieceID(
        pid,
        event.shiftKey || event.ctrlKey || event.metaKey,
      )
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid ?? '')
  const isHighlighted = hoveredPieceID === pid || isSelected
  const treeColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.tree]
  const rockColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.ruin]
  const baseColor = isHighlighted ? yellowColor : hexTerrainColor.treeBase

  return (
    <group
      onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
      onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
      onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBoulders.geometry}
        material={
          pid
            ? basicModelMaterial(rockColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                rockColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeTree.geometry}
        material={
          pid
            ? basicModelMaterial(treeColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                treeColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBase.geometry}
        material={
          pid
            ? basicModelMaterial(baseColor, isLightsAndShadowsRender)
            : basicModelMaterial(
                baseColor,
                isLightsAndShadowsRender,
                PIECE_PREVIEW_OPACITY,
              )
        }
      />
    </group>
  )
}

// useGltf.preload('/forest-tree15-colored-lowpoly.glb')

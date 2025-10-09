import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function BigTree415({ boardHex }: { boardHex?: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/big-tree-415.glb') as any
  console.log("🚀 ~ BigTree415 ~ nodes:", nodes)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (boardHex) {
      toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
    }
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex?.pieceID
  const isHighlighted = hoveredPieceID === boardHex?.pieceID || isSelected
  const treeColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.tree]
  const rockColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.ruin]

  return (
    <group
      onPointerUp={(e) => (boardHex ? onPointerUp(e) : noop())}
      onPointerEnter={(e) => (boardHex ? onPointerEnter(e, boardHex) : noop())}
      onPointerOut={(e) => (boardHex ? onPointerOut(e) : noop())}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBoulders.geometry}
      >
        {boardHex
          ? basicModelMaterial(rockColor, isLightsAndShadowsRender)
          : basicModelMaterial(
            rockColor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeTree.geometry}
      >
        {boardHex
          ? basicDoubleSideModelMaterial(treeColor, isLightsAndShadowsRender)
          : basicDoubleSideModelMaterial(
            treeColor,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBase.geometry}
      >
        {boardHex
          ? basicModelMaterial(hexTerrainColor.treeBase, isLightsAndShadowsRender)
          : basicModelMaterial(
            hexTerrainColor.treeBase,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </group>
  )
}

useGLTF.preload('/big-tree-415.glb')

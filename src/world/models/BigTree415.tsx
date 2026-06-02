import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'

export default function BigTree415({ pid }: { pid?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/forest-tree15-colored-lowpoly.glb') as any
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
      toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = pid ? selectedPieceIDs.includes(pid) : false
  const isHighlighted = hoveredPieceID === pid || isSelected
  const treeColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.tree]
  const rockColor = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.ruin]

  return (
    <group
      onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
      onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
      onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
    >
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Tree_large_rocks_scanned001_1.geometry}
      >
        {pid
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
        geometry={nodes.Tree_large_rocks_scanned001_2.geometry}
      >
        {pid
          ? basicModelMaterial(treeColor, isLightsAndShadowsRender)
          : basicModelMaterial(
              treeColor,
              isLightsAndShadowsRender,
              PIECE_PREVIEW_OPACITY,
            )}
      </mesh>
    </group>
  )
}

// useGltf.preload('/forest-tree15-colored-lowpoly.glb')

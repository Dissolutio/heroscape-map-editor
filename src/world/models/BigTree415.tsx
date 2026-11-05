import type { ThreeEvent } from '@react-three/fiber'
import { noop } from 'lodash'
import type { MeshStandardMaterial } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { useTexturedModelMaterial } from './texturedModelMaterial'
import { useDisposableGLTF } from './useDisposableGLTF'

export default function BigTree415({ pid }: { pid?: string }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF('/big-tree-415-textured.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const effectiveGraphicsTier = useBoundStore((s) => s.effectiveGraphicsTier)
  const textureLoadStatus = useBoundStore((s) => s.textureLoadStatus)
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
        { x: event.point.x, z: event.point.z },
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
  const bouldersMaterial = useTexturedModelMaterial({
    sourceMaterial: nodes.BigTreeBoulders.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
  })
  const treeMaterial = useTexturedModelMaterial({
    sourceMaterial: nodes.BigTreeTree.material as MeshStandardMaterial,
    tier: effectiveGraphicsTier,
    textureLoadStatus,
    isHighlighted,
    pid,
    highRoughness: 0.5,
  })

  return (
    <group
      onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
      onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
      onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
    >
      <mesh
        userData={{
          evergreenTreeUID: pid ?? null,
          evergreenTreePart: 'boulders',
        }}
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBoulders.geometry}
        material={
          bouldersMaterial ??
          basicModelMaterial(
            rockColor,
            isLightsAndShadowsRender,
            pid === undefined ? PIECE_PREVIEW_OPACITY : undefined,
          )
        }
      />
      <mesh
        userData={{ evergreenTreeUID: pid ?? null, evergreenTreePart: 'tree' }}
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeTree.geometry}
        scale={[1, 0.875, 1]}
        material={
          treeMaterial ??
          basicModelMaterial(
            treeColor,
            isLightsAndShadowsRender,
            pid === undefined ? PIECE_PREVIEW_OPACITY : undefined,
          )
        }
      />
      <mesh
        userData={{ evergreenTreeUID: pid ?? null, evergreenTreePart: 'base' }}
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

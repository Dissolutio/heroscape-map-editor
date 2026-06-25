import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { noop } from 'lodash'
import { useEffect } from 'react'

export default function ForestTree({ pid }: { pid?: string }) {
  const gltf = useGLTF(
    '/forgotten-forest-tree-low-poly-colored.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const { nodes } = gltf
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)

  useEffect(() => {
    return () => {
      // We don't implement this step because we want the JS cache
      // useGLTF.clear('/forgotten-forest-tree-low-poly-colored.glb') // free JS cache

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          const mats = Array.isArray(child.material)
            ? child.material : [child.material]
          for (const mat of mats) {
            for (const key of Object.keys(mat)) {
              if (mat[key]?.isTexture) mat[key].dispose()
            }
            mat.dispose()
          }
        }
        if (child.skeleton) child.skeleton.dispose()
      })
    }
  }, [gltf])

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
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.tree]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Tree10_scanned.geometry}
        onPointerUp={(e) => (pid ? onPointerUp(e) : noop())}
        onPointerEnter={(e) => (pid ? onPointerEnterPID(e, pid ?? '') : noop())}
        onPointerOut={(e) => (pid ? onPointerOut(e) : noop())}
      >
        {pid
          ? basicModelMaterial(color, isLightsAndShadowsRender)
          : basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY,
          )}
      </mesh>
    </>
  )
}

// useGltf.preload('/forgotten-forest-tree-low-poly-colored.glb')

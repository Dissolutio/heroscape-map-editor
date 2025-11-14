
import { useGLTF } from '@react-three/drei'
import { basicModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'

export function ForestTree({
  color,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  const { nodes } = useGLTF(
    '/forgotten-forest-tree-low-poly-colored.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Tree10_scanned.geometry}
    >
      {basicModelMaterial(
        currentColor,
        !!isLightsAndShadowsRender,
        opacity ?? 1,
      )}
    </mesh>
  )
}

useGLTF.preload('/forgotten-forest-tree-low-poly-colored.glb')
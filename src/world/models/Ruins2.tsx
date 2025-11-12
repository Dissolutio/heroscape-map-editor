import { useGLTF } from '@react-three/drei'
import { basicModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'
export function Ruins2({
  color,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ruins2.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.Ruin_Small_Scanned.geometry}
    >
      {basicModelMaterial(
        currentColor,
        !!isLightsAndShadowsRender,
        opacity ?? 1,
      )}
    </mesh>
  )
}
useGLTF.preload('/ruins2.glb')

import { useGLTF } from '@react-three/drei'
import { basicModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'

export function Outcrop3({
  color,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/uncolored-decimated-glacier-outcrop-3.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const opacityLevel = opacity ?? 1
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      castShadow={isLightsAndShadowsRender}
      geometry={nodes.glacier_3_with_holes.geometry}
    >
      {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
    </mesh>
  )
}
useGLTF.preload('/uncolored-decimated-glacier-outcrop-3.glb')

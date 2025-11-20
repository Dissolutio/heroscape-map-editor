import { useGLTF } from '@react-three/drei'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import type { ModelComponentProps } from './ModelComponentProps'

export function BigTree415({
  color,
  secondaryColor = color,
  colorBase = color,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/big-tree-415.glb') as any
  const currentColor =
    (isHighlighted?.(boardPiece?.uid ?? '') && highlightColor)
      ? highlightColor
      : color
  const currentColorBase =
    (isHighlighted?.(boardPiece?.uid ?? '') && highlightColor)
      ? highlightColor
      : colorBase || color
  const currentSecondaryColor =
    (isHighlighted?.(boardPiece?.uid ?? '') && highlightColor)
      ? highlightColor
      : secondaryColor
        ? secondaryColor
        : color
  const opacityLevel = opacity ?? 1
  return (
    <>
      {/* 
        Scaled to match reality: 
        9-hex-heights clears the upper pillar edge,
        13-hex-heights totally clears the pillars top X-arch 
        */}
      {/* PILLAR TOP ARCH */}
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBoulders.geometry}
      >
        {basicModelMaterial(currentSecondaryColor, !!isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeTree.geometry}
      >
        {basicDoubleSideModelMaterial(
          currentColor,
          !!isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.BigTreeBase.geometry}
      >
        {basicModelMaterial(
          currentColorBase,
          !!isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
    </>
  )
}
useGLTF.preload('/big-tree-415.glb')

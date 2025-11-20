import { useGLTF } from '@react-three/drei'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'
import type { ModelComponentProps } from './ModelComponentProps'

export function LaurWallPillar({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-pillar-from-hs-blendfile.glb') as any
  const currentColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : color
  const currentSecondaryColor =
    isHighlighted?.(boardPiece?.uid ?? '') && highlightColor
      ? highlightColor
      : secondaryColor
        ? secondaryColor
        : color
  const opacityLevel = opacity ?? 1
  return (
    <>
      <group>
        {/* 
        Scaled to match reality: 
        9-hex-heights clears the upper pillar edge,
        13-hex-heights totally clears the pillars top X-arch 
        */}
        {/* PILLAR TOP ARCH */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarTop.geometry}
        >
          {basicModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        {/* PILLAR TOP CORE */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarSubDecorCore.geometry}
        >
          {basicModelMaterial(
            currentSecondaryColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        {/* PILLAR EXTERIOR */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarFacade.geometry}
        >
          {basicModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        {/* PILLAR LOWER INTERIOR */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarFacadeInner.geometry}
        >
          {basicModelMaterial(
            currentSecondaryColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        {/* PILLAR BASE */}
        <group position={[0, 0, 0]}>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
          >
            <cylinderGeometry args={laurBaseCylinderArgs} />
            {basicModelMaterial(
              currentColor,
              !!isLightsAndShadowsRender,
              opacityLevel,
            )}
          </mesh>
        </group>
      </group>
    </>
  )
}
useGLTF.preload('/laur-pillar-from-hs-blendfile.glb')

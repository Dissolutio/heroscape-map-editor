import { useGLTF } from '@react-three/drei'
import { HEXGRID_OBSTACLE_BASE_HEIGHT } from '../../utils/constants'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'
import type { ModelComponentProps } from './ModelComponentProps'

export function LaurWallTrianglePillar({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: ModelComponentProps) {
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
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
        {/* Scaled to match reality: 9 clears the upper pillar edge,
         13 totally clears the pillars top X-arch */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TrianglePillarTop.geometry}
        >
          {basicModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleSubDecorCore.geometry}
        >
          {basicModelMaterial(
            currentSecondaryColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacade.geometry}
        >
          {basicModelMaterial(
            currentColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacadeInner.geometry}
        >
          {basicModelMaterial(
            currentSecondaryColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        <group position={[0, -HEXGRID_OBSTACLE_BASE_HEIGHT / 2, 0]}>
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

useGLTF.preload('/laur-triangle-pillar-from-hs-blendfile.glb')

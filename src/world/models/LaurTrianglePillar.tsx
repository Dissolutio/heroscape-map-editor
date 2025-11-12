
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardPiece } from '../../types'
import { HEXGRID_OBSTACLE_BASE_HEIGHT } from '../../utils/constants'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

export function LaurWallTrianglePillar({
  color,
  secondaryColor,
  highlightColor,
  boardPiece,
  onPointerUp,
  onPointerEnter,
  onPointerOut,
  opacity,
  isHighlighted,
  isLightsAndShadowsRender,
}: {
  color: string
  secondaryColor: string
  highlightColor?: string
  boardPiece?: BoardPiece
  onPointerUp?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>, uid: string) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
  opacity?: number
  isHighlighted?: (uid: string) => boolean
  selectedPieceID?: string
  hoveredPieceID?: string
  isLightsAndShadowsRender?: boolean
}) {
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const currentColor = isHighlighted?.(boardPiece?.uid ?? '') && highlightColor ? highlightColor : color
  const interiorColor = isHighlighted?.(boardPiece?.uid ?? '') && highlightColor ? highlightColor : secondaryColor
  const opacityLevel = opacity ?? 1
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp && boardPiece ? onPointerUp(e, boardPiece.uid) : null}
        onPointerEnter={(e) => onPointerEnter && boardPiece ? onPointerEnter(e, boardPiece.uid) : null}
        onPointerOut={(e) => onPointerOut && boardPiece ? onPointerOut(e) : null}
        scale={isHighlighted?.(boardPiece?.uid ?? '') ? [1.01, 1.01, 1.01] : [1, 1, 1]}
      >
        {/* Scaled to match reality: 9 clears the upper pillar edge,
         13 totally clears the pillars top X-arch */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TrianglePillarTop.geometry}
        >
          {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleSubDecorCore.geometry}
        >
          {basicModelMaterial(
            interiorColor,
            !!isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacade.geometry}
        >
          {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacadeInner.geometry}
        >
          {basicModelMaterial(
            interiorColor,
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
            {basicModelMaterial(currentColor, !!isLightsAndShadowsRender, opacityLevel)}
          </mesh>
        </group>
      </group>
    </>
  )
}

useGLTF.preload('/laur-triangle-pillar-from-hs-blendfile.glb')

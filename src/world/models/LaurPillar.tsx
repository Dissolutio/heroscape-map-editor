import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

export default function LaurWallPillar({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-pillar-from-hs-blendfile.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex?.boardPieceUID
  const isHighlighted = hoveredPieceID === boardHex?.boardPieceUID || isSelected
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const color = isHighlighted ? yellowColor : pillarColor
  const interiorColor = isHighlighted ? yellowColor : interiorPillarColor
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {/* Scaled to match reality: 9 clears the upper pillar edge, 13 totally clears the pillars top X-arch */}
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarTop.geometry}
        >
          {basicModelMaterial(color, isLightsAndShadowsRender)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarSubDecorCore.geometry}
        >
          {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarFacade.geometry}
        >
          {basicModelMaterial(color, isLightsAndShadowsRender)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.PillarFacadeInner.geometry}
        >
          {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
        </mesh>
        <group position={[0, -HEXGRID_OBSTACLE_BASE_HEIGHT / 2, 0]}>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
          >
            <cylinderGeometry args={laurBaseCylinderArgs} />
            {basicModelMaterial(color, isLightsAndShadowsRender)}
          </mesh>
        </group>
      </group>
    </>
  )
}
export function LaurWallPillarPreview({
  opacity,
}: {
  opacity?: number
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-pillar-from-hs-blendfile.glb') as any
  // const { nodes } = useGLTF('/laurwall-pillar.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const color = pillarColor
  const interiorColor = interiorPillarColor
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PillarTop.geometry}
      >
        {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PillarSubDecorCore.geometry}
      >
        {basicModelMaterial(
          interiorColor,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PillarFacade.geometry}
      >
        {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PillarFacadeInner.geometry}
      >
        {basicModelMaterial(
          interiorColor,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <group position={[0, -HEXGRID_OBSTACLE_BASE_HEIGHT / 2, 0]}>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
        >
          <cylinderGeometry args={laurBaseCylinderArgs} />
          {basicModelMaterial(color, isLightsAndShadowsRender)}
        </mesh>
      </group>
    </>
  )
}
// // useGltf.preload('/laurwall-pillar.glb')

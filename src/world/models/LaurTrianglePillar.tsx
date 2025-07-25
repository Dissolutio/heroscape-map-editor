import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { BackSide, DoubleSide } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

export default function LaurWallTrianglePillar({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
  ) as any
  // const { nodes } = useGLTF('/laur-triangle-pillar.glb') as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2
  const helpMaterialNeedsBlenderWork = isLightsAndShadowsRender ? (
    <meshStandardMaterial
      color={interiorColor}
      side={DoubleSide}
      shadowSide={BackSide}
    />
  ) : (
    <meshMatcapMaterial side={DoubleSide} color={interiorColor} />
  )
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp?.(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <group scale={[1, 0.98, 1]}>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.TrianglePillarTop.geometry}
          >
            {helpMaterialNeedsBlenderWork}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.TriangleSubDecorCore.geometry}
          >
            {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.TriangleFacade.geometry}
          >
            {basicModelMaterial(color, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.TriangleFacadeInner.geometry}
          >
            {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
          </mesh>
        </group>
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
export function LaurWallTrianglePillarPreview({
  opacity,
}: {
  opacity?: number
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
  ) as any
  // const { nodes } = useGLTF('/laur-triangle-pillar.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const color = pillarColor
  const interiorColor = interiorPillarColor
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  const helpMaterialNeedsBlenderWork = isLightsAndShadowsRender ? (
    <meshStandardMaterial
      color={interiorColor}
      side={DoubleSide}
      shadowSide={BackSide}
    />
  ) : (
    <meshMatcapMaterial side={DoubleSide} color={interiorColor} />
  )
  return (
    <>
      <group scale={[1, 0.98, 1]}>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TrianglePillarTop.geometry}
        >
          {helpMaterialNeedsBlenderWork}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleSubDecorCore.geometry}
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
          geometry={nodes.TriangleFacade.geometry}
        >
          {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
        </mesh>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacadeInner.geometry}
        >
          {basicModelMaterial(
            interiorColor,
            isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
      </group>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
      >
        <cylinderGeometry args={laurBaseCylinderArgs} />
        {basicModelMaterial(color, isLightsAndShadowsRender)}
      </mesh>
    </>
  )
}
useGLTF.preload('/laur-triangle-pillar.glb')

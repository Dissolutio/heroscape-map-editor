import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { FrontSide, DoubleSide } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, type BoardPiece, HexTerrain } from '../../types'
import {
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

export default function LaurWallTrianglePillar({
  bp,
  onPointerUp,
  pieceRotation,
}: {
  bp: BoardPiece
  pieceRotation: number
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  // const { nodes } = useGLTF('/laur-triangle-pillar.glb') as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === bp.uid
  const isHighlighted = hoveredPieceID === bp.uid || isSelected
  const partialHex = {
    ...bp.pieceCoords,
    boardPieceUID: bp.uid,
    altitude: bp.altitude + 1,
    inventoryID: bp.inventoryID,
    pieceID: '',
    pieceRotation: bp.rotation,
  } as BoardHex
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
      shadowSide={FrontSide}
    />
  ) : (
    <meshMatcapMaterial side={DoubleSide} color={interiorColor} />
  )
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp?.(e, partialHex)}
        onPointerEnter={(e) => onPointerEnterPID(e, bp.uid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
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
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={nodes.TriangleFacadeInner.geometry}
        >
          {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
        </mesh>
        <group
          position={[0, -HEXGRID_OBSTACLE_BASE_HEIGHT / 2, 0]}
          rotation={[0, -pieceRotation, 0]}
        >
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
export function LaurWallTrianglePillarPreview({
  opacity,
  pieceRotation,
}: {
  pieceRotation: number
  opacity?: number
}) {
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
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
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TrianglePillarTop.geometry}
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
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        rotation={[0, pieceRotation, 0]}
      >
        <cylinderGeometry args={laurBaseCylinderArgs} />
        {basicModelMaterial(color, isLightsAndShadowsRender)}
      </mesh>
    </>
  )
}
// useGltf.preload('/laur-triangle-pillar-from-hs-blendfile.glb')

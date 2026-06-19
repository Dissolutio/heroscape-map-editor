import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../../types'
import {
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

export default function LaurWallPillar({
  bp,
  onPointerUp,
}: {
  bp: BoardPiece
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laur-pillar-from-hs-blendfile.glb') as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(bp.uid)
  const isHighlighted = hoveredPieceID === bp.uid || isSelected
  const partialHex = {
    ...bp.pieceCoords,
    boardPieceUID: bp.uid,
    altitude: bp.altitude,
    inventoryID: bp.inventoryID,
    pieceID: '',
    pieceRotation: bp.rotation,
    terrain: HexTerrain.laurWall,
  } as BoardHex
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const color = isHighlighted ? yellowColor : pillarColor
  const interiorColor = isHighlighted ? yellowColor : interiorPillarColor
  const hasSupportingPillar = boardPieces.some((piece) => {
    const isPillarType =
      piece.inventoryID === Pieces.laurWallSquarePillar ||
      piece.inventoryID === Pieces.laurWallTrianglePillar
    return (
      isPillarType &&
      piece.pieceCoords.q === bp.pieceCoords.q &&
      piece.pieceCoords.r === bp.pieceCoords.r &&
      piece.pieceCoords.s === bp.pieceCoords.s &&
      piece.altitude === bp.altitude - 9
    )
  })
  const isShowBaseMesh = !hasSupportingPillar
  return (
    <>
      <group
        onPointerUp={(e) => onPointerUp(e, partialHex)}
        onPointerEnter={(e) => onPointerEnter(e, partialHex)}
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
        {isShowBaseMesh && (
          <group position={[0, -HEXGRID_OBSTACLE_BASE_HEIGHT / 2, 0]}>
            <mesh
              receiveShadow={isLightsAndShadowsRender}
              castShadow={isLightsAndShadowsRender}
            >
              <cylinderGeometry args={laurBaseCylinderArgs} />
              {basicModelMaterial(color, isLightsAndShadowsRender)}
            </mesh>
          </group>
        )}
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

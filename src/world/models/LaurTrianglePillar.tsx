import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { FrontSide, DoubleSide } from 'three'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_OBSTACLE_BASE_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import { laurBaseCylinderArgs } from './ObstacleBase'

type LaurWallTrianglePillarProps = {
  opacity?: number
  // If boardHex and pointer handlers are provided, component is interactive
  boardHex?: BoardHex
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}

export function LaurWallTrianglePillar({
  opacity,
  boardHex,
  onPointerUp,
}: LaurWallTrianglePillarProps) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { nodes } = useGLTF(
    '/laur-triangle-pillar-from-hs-blendfile.glb',
    // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  ) as any
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()

  // Determine highlight and color logic only if boardHex is provided (interactive mode)
  const isSelected = boardHex && selectedPieceID === boardHex.pieceID
  const isHighlighted =
    boardHex && (hoveredPieceID === boardHex.pieceID || isSelected)
  const yellowColor = 'yellow'
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.laurWall]
  const interiorColor = isHighlighted
    ? yellowColor
    : hexTerrainColor.laurModelColor2

  // For preview mode (no boardHex), use default colors
  const previewColor = hexTerrainColor[HexTerrain.laurWall]
  const previewInteriorColor = hexTerrainColor.laurModelColor2

  const finalColor = boardHex ? color : previewColor
  const finalInteriorColor = boardHex ? interiorColor : previewInteriorColor
  const opacityLevel = opacity ?? (boardHex ? 1 : PIECE_PREVIEW_OPACITY)

  // For interactive mode, wrap in a group with pointer handlers
  const content = (
    <>
      <group
        onPointerUp={(e) => onPointerUp?.(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
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
        {basicDoubleSideModelMaterial(
          finalInteriorColor,
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
          finalInteriorColor,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TriangleFacade.geometry}
      >
        {basicModelMaterial(finalColor, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TriangleFacadeInner.geometry}
      >
        {basicModelMaterial(
          finalInteriorColor,
          isLightsAndShadowsRender,
          opacityLevel,
        )}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.TriangleFacadeInner.geometry}
      >
        {basicModelMaterial(
          finalInteriorColor,
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
          {basicModelMaterial(
            finalColor,
            isLightsAndShadowsRender,
            opacityLevel,
          )}
        </mesh>
      </group>
    </>
  )

  if (boardHex) {
    return (
      <group
        onPointerUp={(e) => onPointerUp?.(e, boardHex)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        {content}
      </group>
    )
  }
  return content
}

useGLTF.preload('/laur-triangle-pillar-from-hs-blendfile.glb')

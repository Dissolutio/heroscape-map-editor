import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'
import { basicModelMaterial } from './materials'

const baseCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

export default function LaurWallPillar({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laurwall-pillar.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
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
        <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
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
            geometry={nodes.SubDecorCore.geometry}
          >
            {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.Facade.geometry}
          >
            {basicModelMaterial(color, isLightsAndShadowsRender)}
          </mesh>
          <mesh
            receiveShadow={isLightsAndShadowsRender}
            castShadow={isLightsAndShadowsRender}
            geometry={nodes.FacadeInner.geometry}
          >
            {basicModelMaterial(interiorColor, isLightsAndShadowsRender)}
          </mesh>
        </group>
        <mesh
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
        >
          <cylinderGeometry args={baseCylinderArgs} />
          {basicModelMaterial(color, isLightsAndShadowsRender)}
        </mesh>
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
  const { nodes } = useGLTF('/laurwall-pillar.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const pillarColor = hexTerrainColor[HexTerrain.laurWall]
  const interiorPillarColor = hexTerrainColor.laurModelColor2
  const color = pillarColor
  const interiorColor = interiorPillarColor
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
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
        geometry={nodes.SubDecorCore.geometry}
      >
        {basicModelMaterial(interiorColor, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Facade.geometry}
      >
        {basicModelMaterial(color, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.FacadeInner.geometry}
      >
        {basicModelMaterial(interiorColor, isLightsAndShadowsRender, opacityLevel)}
      </mesh>
    </group>
  )
}
useGLTF.preload('/laurwall-pillar.glb')

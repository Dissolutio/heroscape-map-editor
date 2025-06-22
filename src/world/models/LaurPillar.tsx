import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
} from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import type { CylinderGeometryArgs } from '../maphex/instance-hex'
import { basicModelMaterial } from './materials'
import { noop } from 'lodash'

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
  isPreview
}: {
  boardHex: BoardHex
  isUnderHexFluid: boolean
  onPointerUp?: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
  isPreview?: boolean
}) {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/laurwall-pillar.glb') as any
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = (hoveredPieceID === boardHex.pieceID) || isSelected
  const color = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.laurWall]
  const interiorColor = isHighlighted ? yellowColor : hexTerrainColor.laurModelColor2
  return (
    <>
      <group
        onPointerUp={isPreview ? noop : (e) => onPointerUp?.(e, boardHex)}
        onPointerEnter={isPreview ? noop : (e) => onPointerEnter(e, boardHex)}
        onPointerOut={isPreview ? noop : (e) => onPointerOut(e)}
      >
        <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={nodes.PillarTop.geometry}
          >
            {basicModelMaterial(color, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={nodes.SubDecorCore.geometry}
          >
            {basicModelMaterial(interiorColor, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={nodes.Facade.geometry}
          >
            {basicModelMaterial(color, isHighQualityRender)}
          </mesh>
          <mesh
            receiveShadow={isHighQualityRender}
            castShadow={isHighQualityRender}
            geometry={nodes.FacadeInner.geometry}
          >
            {basicModelMaterial(interiorColor, isHighQualityRender)}
          </mesh>
        </group>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
        >
          <cylinderGeometry args={baseCylinderArgs} />
          {basicModelMaterial(color, isHighQualityRender)}
        </mesh>
      </group>
    </>
  )
}

useGLTF.preload('/laurwall-pillar.glb')

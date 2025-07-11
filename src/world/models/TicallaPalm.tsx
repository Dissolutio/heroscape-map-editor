import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export default function TicallaPalm({ boardHex }: { boardHex: BoardHex }) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : boardHex.pieceID)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <TicallaPalmPreview color={isHighlighted ? 'yellow' : ''} />
    </group>
  )
}
export function TicallaPalmPreview({
  opacity = 1,
  color = '',
}: {
  opacity?: number
  color?: string
}) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ticalla-palm.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes: nodesNewPalm } = useGLTF('/handmade-palm.glb') as any
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const colorTrunk = color || hexTerrainColor.ticallaPalmModel1
  const colorBrush = color || hexTerrainColor.ticallaBrush2
  const colorPalmLeaf = color || hexTerrainColor.ticallaPalmModel3
  const colorBase = color || hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodesNewPalm.Palm_Trunk.geometry}
      >
        {basicModelMaterial(colorTrunk, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodesNewPalm.Palm_Canopy.geometry}
      >
        {basicModelMaterial(colorPalmLeaf, isLightsAndShadowsRender, opacity)}
      </mesh>

      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.PalmBrush.geometry}
      >
        {basicModelMaterial(colorBrush, isLightsAndShadowsRender, opacity)}
      </mesh>
      <mesh
        receiveShadow={isLightsAndShadowsRender}
        castShadow={isLightsAndShadowsRender}
        geometry={nodes.Interlock6.geometry}
      >
        {basicModelMaterial(colorBase, isLightsAndShadowsRender, opacity)}
      </mesh>
    </>
  )
}

useGLTF.preload('/ticalla-palm.glb')
useGLTF.preload('/handmade-palm.glb')

import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export default function TicallaPalm({ boardHex }: { boardHex: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ticalla-palm.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes: nodesNewPalm } = useGLTF('/handmade-palm.glb') as any
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
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
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = (hoveredPieceID === boardHex.pieceID) || isSelected
  const colorTrunk = isHighlighted
    ? yellowColor
    : hexTerrainColor.ticallaPalmModel1
  const colorBrush = isHighlighted ? yellowColor : hexTerrainColor.ticallaBrush2
  const colorPalmLeaf = isHighlighted
    ? yellowColor
    : hexTerrainColor.ticallaPalmModel3
  const colorBase = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.swamp]
  return (
    <group
      onPointerUp={(e) => onPointerUp(e)}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodesNewPalm.Palm_Trunk.geometry}
      >
        {basicModelMaterial(colorTrunk, isHighQualityRender)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodesNewPalm.Palm_Canopy.geometry}
      >
        {basicModelMaterial(colorPalmLeaf, isHighQualityRender)}
      </mesh>

      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.PalmBrush.geometry}
      >
        {basicModelMaterial(colorBrush, isHighQualityRender)}
      </mesh>
      <mesh
        receiveShadow={isHighQualityRender}
        castShadow={isHighQualityRender}
        geometry={nodes.Interlock6.geometry}
      >
        {basicModelMaterial(colorBase, isHighQualityRender)}
      </mesh>
    </group>
  )
}

useGLTF.preload('/ticalla-palm.glb')
useGLTF.preload('/handmade-palm.glb')

import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

export default function TicallaPalm({ boardHex }: { boardHex: BoardHex }) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useGLTF('/ticalla-palm.glb') as any
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes: nodesNewPalm } = useGLTF('/handmade-palm.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnter, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
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
  const isHighlighted = isHovered || isSelected
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
  const material = (c: string) =>
    isHighQualityRender ? (
      <meshStandardMaterial color={c} />
    ) : (
      <meshMatcapMaterial color={c} />
    )
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={boardHex.pieceID} y={3} />}
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
          {material(colorTrunk)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodesNewPalm.Palm_Canopy.geometry}
        >
          {material(colorPalmLeaf)}
        </mesh>

        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.PalmBrush.geometry}
        >
          {material(colorBrush)}
        </mesh>
        <mesh
          receiveShadow={isHighQualityRender}
          castShadow={isHighQualityRender}
          geometry={nodes.Interlock6.geometry}
        >
          {material(colorBase)}
        </mesh>
      </group>
    </>
  )
}

useGLTF.preload('/ticalla-palm.glb')

export function NewPalm3D() {
  return <></>
}
useGLTF.preload('/handmade-palm.glb')

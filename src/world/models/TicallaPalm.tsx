import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

export default function TicallaPalm({ boardHex }: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/ticalla-palm.glb') as any
  const { nodes: nodesNewPalm } = useGLTF('/handmade-palm.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
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
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={boardHex.pieceID} y={3} />}
      <group
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnter(e, boardHex)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <mesh geometry={nodesNewPalm.Palm_Trunk.geometry}>
          <meshMatcapMaterial color={colorTrunk} />
        </mesh>
        <mesh geometry={nodesNewPalm.Palm_Canopy.geometry}>
          {/* <meshMatcapMaterial transparent opacity={0.95} color={colorPalmLeaf} /> */}
          <meshMatcapMaterial color={colorPalmLeaf} />
        </mesh>

        <mesh geometry={nodes.PalmBrush.geometry}>
          <meshMatcapMaterial color={colorBrush} />
        </mesh>
        <mesh geometry={nodes.Interlock6.geometry}>
          <meshMatcapMaterial color={colorBase} />
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

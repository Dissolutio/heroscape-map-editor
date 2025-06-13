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
        <mesh
          receiveShadow
          castShadow
          geometry={nodesNewPalm.Palm_Trunk.geometry}
        >
          <meshStandardMaterial color={colorTrunk} />
        </mesh>
        <mesh
          receiveShadow
          castShadow
          geometry={nodesNewPalm.Palm_Canopy.geometry}
        >
          <meshStandardMaterial
            transparent
            opacity={0.95}
            color={colorPalmLeaf}
          />
          {/* <meshStandardMaterial color={colorPalmLeaf} /> */}
        </mesh>

        <mesh receiveShadow castShadow geometry={nodes.PalmBrush.geometry}>
          <meshStandardMaterial color={colorBrush} />
        </mesh>
        <mesh receiveShadow castShadow geometry={nodes.Interlock6.geometry}>
          <meshStandardMaterial color={colorBase} />
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

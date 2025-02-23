import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'

export default function TicallaPalm({
  boardHex,
}: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/ticalla-palm.glb') as any
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const {
    isHovered,
    onPointerEnter,
    onPointerOut,
  } = usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore(s => s.toggleSelectedPieceID)
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
  const selectedPieceID = useBoundStore(s => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected
  const colorTrunk = isHighlighted ? yellowColor : hexTerrainColor.ticallaPalmModel1
  const colorBrush = isHighlighted ? yellowColor : hexTerrainColor.ticallaBrush2
  const colorPalmLeaf = isHighlighted ? yellowColor : hexTerrainColor.ticallaPalmModel3
  const colorBase = isHighlighted ? yellowColor : hexTerrainColor[HexTerrain.swamp]
  return (
    <>
      {(isSelected) && (
        <DeletePieceBillboard pieceID={boardHex.pieceID} y={3} />
      )}
      <group
        onPointerUp={e => onPointerUp(e)}
        onPointerEnter={e => onPointerEnter(e, boardHex)}
        onPointerOut={e => onPointerOut(e)}
      >
        <mesh geometry={nodes.PalmLeaf.geometry}>
          <meshMatcapMaterial color={colorPalmLeaf} />
        </mesh>
        <mesh geometry={nodes.PalmTrunk.geometry}>
          <meshMatcapMaterial color={colorTrunk} />
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

// useGLTF.preload('/ticalla-palm.glb')


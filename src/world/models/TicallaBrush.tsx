import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { BoardHex, HexTerrain } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'

export default function TicallaBrush({
  boardHex,
}: { boardHex: BoardHex }) {
  const { nodes } = useGLTF('/ticalla-brush.glb') as any
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
  const color1 = isHighlighted ? yellowColor : hexTerrainColor.ticallaBrush1
  const color2 = isHighlighted ? yellowColor : hexTerrainColor.ticallaBrush2
  const color3 = isHighlighted ? yellowColor : hexTerrainColor.ticallaBrush3
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
        <mesh geometry={nodes.FatFern.geometry}>
          <meshMatcapMaterial color={color1} />
        </mesh>
        <mesh geometry={nodes.PineappleFern.geometry}>
          <meshMatcapMaterial color={color2} />
        </mesh>
        <mesh geometry={nodes.Needler.geometry}>
          <meshMatcapMaterial color={color3} />
        </mesh>
        <mesh geometry={nodes.Interlock6.geometry}>
          <meshMatcapMaterial color={colorBase} />
        </mesh>
      </group>
    </>
  )
}

// useGLTF.preload('/ticalla-brush.glb')

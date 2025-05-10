import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import DeletePieceBillboard from '../maphex/DeletePieceBillboard'
import { hexTerrainColor } from '../maphex/hexColors'

export function Battlement({
  pid,
  isVisible,
}: { pid: string; isVisible: boolean }) {
  const { nodes } = useGLTF('/handmade-battlement.glb') as any
  const { isHovered, onPointerEnterPID, onPointerOut } =
    usePieceHoverState(isVisible)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === pid
  const isHighlighted = isHovered || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[HexTerrain.battlement]
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isVisible) {
      return
    }
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(isSelected ? '' : pid)
  }
  return (
    <>
      {isSelected && <DeletePieceBillboard pieceID={pid} y={1} />}
      <mesh
        geometry={nodes.Battlement.geometry}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerEnter={(e) => onPointerEnterPID(e, pid)}
        onPointerOut={(e) => onPointerOut(e)}
      >
        <meshMatcapMaterial color={color} />
      </mesh>
    </>
  )
}

useGLTF.preload('/handmade-battlement.glb')

import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'

export function StartZone3D({
  boardHex,
}: {
  boardHex: BoardHex
}) {
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
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = hoveredPieceID === boardHex.pieceID || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[boardHex.inventoryID as keyof typeof hexTerrainColor]
  return (
    <mesh
      onPointerUp={onPointerUp}
      onPointerEnter={(e) => onPointerEnter(e, boardHex)}
      onPointerOut={(e) => onPointerOut(e)}
      rotation={[0, Math.PI / 2, 0]}
    >
      <circleGeometry args={[HEXGRID_HEX_RADIUS / 2.1, 32]} />
      <meshMatcapMaterial color={color} />
      {/* <ringGeometry args={[HEXGRID_HEX_RADIUS / 3, HEXGRID_HEX_RADIUS / 2.1, 32]} /> */}
      {/* <meshStandardMaterial color={color} transparent opacity={0.2} /> */}
    </mesh>
  )
}

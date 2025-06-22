import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import { hexTerrainColor } from '../maphex/hexColors'
import { HEXGRID_HEX_RADIUS } from '../../utils/constants'

export function StartZone3D({
  boardHex,
  onPointerUp,
}: {
  boardHex: BoardHex
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isVisible = boardHex.altitude <= viewingLevel
  const { isHovered, onPointerEnterPID, onPointerOut } =
    usePieceHoverState(isVisible)
  const handleOnPointerUp = (event: ThreeEvent<PointerEvent>) => {
    onPointerUp(event, boardHex)
  }
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceID === boardHex.pieceID
  const isHighlighted = isHovered || isSelected
  const color = isHighlighted
    ? yellowColor
    : hexTerrainColor[boardHex.inventoryID]
  return (
    <mesh
      onPointerUp={handleOnPointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, boardHex.pieceID)}
      onPointerOut={(e) => onPointerOut(e)}
      rotation={[0, Math.PI / 2, 0]}
    >
      <circleGeometry args={[HEXGRID_HEX_RADIUS / 2.1, 32]} />
      <meshMatcapMaterial color={color} />
    </mesh>
  )
}

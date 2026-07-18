import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'

import { hexTerrainColor, svgColors } from '../maphex/hexColors'
import {
  HEXGRID_HEX_RADIUS,
  HEXGRID_HEXCAP_HEIGHT,
} from '../../utils/constants'
import { usePiecePointerHandler } from '../../hooks/usePiecePointerHandler'

export function StartZone3D({
  pid,
  inventoryID,
  onContextMenu,
}: {
  pid: string
  inventoryID: string
  onContextMenu?: (e: ThreeEvent<PointerEvent>, pieceID: string) => void
}) {
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
  }
  const { handlePointerUp } = usePiecePointerHandler({
    pieceID: pid,
    onLeftClick: (_, isMultiSelect) => {
      toggleSelectedPieceID(pid, isMultiSelect)
    },
    onRightClick: onContextMenu,
  })
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const colorScheme = useLegacyStartZones ? hexTerrainColor : svgColors
  const color = isHighlighted
    ? yellowColor
    : colorScheme[inventoryID as keyof typeof colorScheme]
  return (
    <mesh
      onPointerUp={handlePointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
      rotation={[0, Math.PI / 2, 0]}
    >
      {useLegacyStartZones ? (
        <circleGeometry args={[HEXGRID_HEX_RADIUS / 2.1, 32]} />
      ) : (
        <cylinderGeometry
          args={[0.6515, 0.6615, 0.2, 6, undefined, false, 0, undefined]}
        />
      )}
      <meshMatcapMaterial color={color} />
    </mesh>
  )
}

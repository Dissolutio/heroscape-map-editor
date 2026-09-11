import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'

import {
  HEXGRID_HEXCAP_HEIGHT,
  HEXGRID_HEX_RADIUS,
  PIECE_PREVIEW_OPACITY,
} from '../../utils/constants'
import { hexTerrainColor, svgColors } from '../maphex/hexColors'
import { basicModelMaterial } from './materials'

export function StartZone3D({
  pid,
  inventoryID,
}: {
  pid?: string
  inventoryID: string
}) {
  console.log('🚀 ~ StartZone3D ~ pid:', pid)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const useLegacyStartZones = useBoundStore((s) => s.useLegacyStartZones)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!pid) return
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(pid, event.shiftKey || event.ctrlKey || event.metaKey)
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const yellowColor = 'yellow'
  const isSelected = pid ? selectedPieceIDs.includes(pid) : false
  const isHighlighted = (pid && hoveredPieceID === pid) || isSelected
  const colorScheme = useLegacyStartZones ? hexTerrainColor : svgColors
  const color = isHighlighted
    ? yellowColor
    : colorScheme[inventoryID as keyof typeof colorScheme]
  return (
    <mesh
      onPointerUp={pid ? onPointerUp : undefined}
      onPointerEnter={pid ? (e) => onPointerEnterPID(e, pid) : undefined}
      onPointerOut={pid ? (e) => onPointerOut(e) : undefined}
    >
      {useLegacyStartZones ? (
        <circleGeometry args={[HEXGRID_HEX_RADIUS / 2.1, 32]} />
      ) : (
        <cylinderGeometry
          args={[0.6515, 0.6615, 0.2, 6, undefined, false, 0, undefined]}
        />
      )}
      {pid
        ? basicModelMaterial(color, isLightsAndShadowsRender)
        : basicModelMaterial(
            color,
            isLightsAndShadowsRender,
            PIECE_PREVIEW_OPACITY / 1.5,
          )}
      {/* <meshMatcapMaterial color={color} /> */}
    </mesh>
  )
}

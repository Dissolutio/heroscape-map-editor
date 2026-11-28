import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { HexTerrain } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { getFortressModelUrl, vsFitTarget } from './fortressModels'
import { VsModel } from './VsFortressMeshes'

export function Battlement({ pid }: { pid: string }) {
  const { onPointerEnterPID, onPointerOut } = usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const isSelected = selectedPieceIDs.includes(pid)
  const isHighlighted = hoveredPieceID === pid || isSelected
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    toggleSelectedPieceID(
      pid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  return (
    <VsModel
      url={getFortressModelUrl('fortressBattlement')}
      name="VsFortressBattlement"
      target={vsFitTarget('fortressBattlement')}
      color={hexTerrainColor[HexTerrain.battlement]}
      isHighlighted={isHighlighted}
      pid={pid}
      onPointerUp={onPointerUp}
      onPointerEnter={(e) => onPointerEnterPID(e, pid)}
      onPointerOut={(e) => onPointerOut(e)}
    />
  )
}
export function BattlementPreview({ opacity }: { opacity?: number }) {
  const opacityLevel = opacity ?? PIECE_PREVIEW_OPACITY
  return (
    <VsModel
      url={getFortressModelUrl('fortressBattlement')}
      name="VsFortressBattlement"
      target={vsFitTarget('fortressBattlement')}
      color={hexTerrainColor[HexTerrain.battlement]}
      isHighlighted={false}
      opacity={opacityLevel}
    />
  )
}

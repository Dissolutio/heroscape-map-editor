import type { ThreeEvent } from '@react-three/fiber'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import { type BoardHex, type BoardPiece, HexTerrain, Pieces } from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { getFortressModelUrl, vsFitTarget } from './fortressModels'
import { VsModel } from './VsFortressMeshes'

export function Ladder({
  bp,
  onPointerUp,
}: {
  bp: BoardPiece
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const penMode = useBoundStore((s) => s.penMode)
  const hoveredPieceID = useBoundStore((s) => s.hoveredPieceID)
  const { onPointerEnter, onPointerEnterPID, onPointerOut } =
    usePieceHoverState()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const partialHex = {
    ...bp.pieceCoords,
    boardPieceUID: bp.uid,
    altitude: bp.altitude + 1,
    inventoryID: bp.inventoryID,
    pieceID: '',
    pieceRotation: bp.rotation,
  } as BoardHex
  const handleOnPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation() // prevent pass through
    // Early out right clicks(event.button=2), middle mouse clicks(1)
    if (event.button !== 0) {
      return
    }
    if (penMode === Pieces.ladder) {
      onPointerUp(event, partialHex)
    } else {
      toggleSelectedPieceID(
        bp.uid,
        event.shiftKey || event.ctrlKey || event.metaKey,
        { x: event.point.x, z: event.point.z },
      )
    }
  }
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const isSelected = selectedPieceIDs.includes(bp.uid)
  const isHighlighted = hoveredPieceID === bp.uid || isSelected
  const onPointerEnterLadder = (e: ThreeEvent<PointerEvent>) =>
    penMode === Pieces.ladder
      ? onPointerEnter(e, partialHex)
      : onPointerEnterPID(e, bp.uid)
  return (
    <VsModel
      url={getFortressModelUrl('fortressLadder')}
      name="VsFortressLadder"
      target={vsFitTarget('fortressLadder')}
      color={hexTerrainColor[HexTerrain.ladder]}
      isHighlighted={isHighlighted}
      pid={bp.uid}
      onPointerUp={handleOnPointerUp}
      onPointerEnter={onPointerEnterLadder}
      onPointerOut={(e) => onPointerOut(e)}
    />
  )
}
export function LadderPreview() {
  return (
    <VsModel
      url={getFortressModelUrl('fortressLadder')}
      name="VsFortressLadder"
      target={vsFitTarget('fortressLadder')}
      color={hexTerrainColor[HexTerrain.ladder]}
      isHighlighted={false}
      opacity={PIECE_PREVIEW_OPACITY}
    />
  )
}

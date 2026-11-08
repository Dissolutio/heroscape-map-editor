import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { getPieceSizeOptionsForPenMode } from '../data/flatPieceSizes'
import { piecesSoFar } from '../data/pieces'
import { isGlyphBoardPiece } from '../data/startZoneVisibility'
import useBoundStore from '../store/store'
import { type BoardPiece, PICK_PEN_MODE, Pieces } from '../types'
import { CLICK_DRAG_TOLERANCE_PX } from '../utils/constants'

// These pieces have no pen mode of their own, they are painted via a listed variant
const penModePieceAlias: Record<string, string> = {
  [Pieces.laurWallRuin2]: Pieces.laurWallRuin1,
  [Pieces.laurWallRuin3]: Pieces.laurWallRuin1,
}

export function getPickedPenMode(inventoryID: string, landPrefix?: string) {
  return landPrefix ?? penModePieceAlias[inventoryID] ?? inventoryID
}

export function getPickedPenModeSettings(boardPiece: BoardPiece) {
  const piece = piecesSoFar[boardPiece.inventoryID]
  if (!piece) return null
  return {
    penMode: getPickedPenMode(boardPiece.inventoryID, piece.landPrefix),
    pieceSize: piece.pieceSizeFamily
      ? piece.variantOrder
      : piece.landPrefix || getPieceSizeOptionsForPenMode(piece.id).length
        ? piece.size
        : undefined,
    rotation: boardPiece.rotation,
  }
}

export function pickPieceAsPenMode(
  pieceUID: string,
  { preserveSelection = false }: { preserveSelection?: boolean } = {},
) {
  const state = useBoundStore.getState()
  const boardPiece = state.boardPieces.find((bp) => bp.uid === pieceUID)
  if (!boardPiece) return
  if (!state.isShowGlyphs && isGlyphBoardPiece(boardPiece)) return
  const settings = getPickedPenModeSettings(boardPiece)
  if (!settings) return

  state.togglePenMode(settings.penMode, { preserveSelection })
  const updatedState = useBoundStore.getState()
  if (settings.pieceSize !== undefined) {
    updatedState.togglePieceSize(settings.pieceSize)
  }
  updatedState.togglePenModeRotation(settings.rotation)
}

// Middle-drag is a camera dolly, left-drag orbits, so only a near-motionless
// click (within CLICK_DRAG_TOLERANCE_PX) is a pick

// Makes the currently hovered piece the pen mode (aka eyedropper/pick)
function pickHoveredPieceAsPenMode() {
  const state = useBoundStore.getState()
  if (!state.hoveredPieceID) return
  pickPieceAsPenMode(state.hoveredPieceID)
}

/*
  Middle-clicking a piece, or left-clicking it while in the pick pen mode, makes
  it the current pen mode. This listens on the canvas rather than on every model:
  models each stop propagation in their own pointer handlers, but they all report
  what is under the cursor through the shared hoveredPieceID state.
*/
export function useMiddleClickPickPenMode() {
  const domElement = useThree((s) => s.gl.domElement)
  useEffect(() => {
    let downPoint: { x: number; y: number } | null = null
    const isPickButton = (event: MouseEvent) =>
      event.button === 1 ||
      (event.button === 0 && useBoundStore.getState().penMode === PICK_PEN_MODE)
    const onMouseDown = (event: MouseEvent) => {
      if (!isPickButton(event)) return
      downPoint = { x: event.clientX, y: event.clientY }
      if (event.button === 1) {
        event.preventDefault() // no browser autoscroll
      }
    }
    const onMouseUp = (event: MouseEvent) => {
      if (!isPickButton(event)) return
      const start = downPoint
      downPoint = null
      if (!start) return
      const dragDistance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      )
      if (dragDistance > CLICK_DRAG_TOLERANCE_PX) return
      // deferred so any model click handlers (which see the pick pen mode and bail) run first
      setTimeout(pickHoveredPieceAsPenMode, 0)
    }
    domElement.addEventListener('mousedown', onMouseDown)
    domElement.addEventListener('mouseup', onMouseUp)
    return () => {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mouseup', onMouseUp)
    }
  }, [domElement])
}

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { PICK_PEN_MODE, Pieces } from '../types'

// These pieces have no pen mode of their own, they are painted via a listed variant
const penModePieceAlias: Record<string, string> = {
  [Pieces.laurWallRuin2]: Pieces.laurWallRuin1,
  [Pieces.laurWallRuin3]: Pieces.laurWallRuin1,
  [Pieces.laurWallShortStackable]: Pieces.laurWallShort,
  [Pieces.laurWallLongStackable]: Pieces.laurWallLong,
}

// Middle-drag is a camera dolly, left-drag orbits, so only a near-motionless click is a pick
const CLICK_DRAG_TOLERANCE_PX = 5

// Makes the currently hovered piece the pen mode (aka eyedropper/pick)
function pickHoveredPieceAsPenMode() {
  const state = useBoundStore.getState()
  if (!state.hoveredPieceID) return
  const boardPiece = state.boardPieces.find(
    (bp) => bp.uid === state.hoveredPieceID,
  )
  const piece = boardPiece ? piecesSoFar[boardPiece.inventoryID] : undefined
  if (!boardPiece || !piece) return
  // Land pieces select a terrain pen mode plus the size of the clicked piece
  const penMode =
    piece.landPrefix ??
    penModePieceAlias[boardPiece.inventoryID] ??
    boardPiece.inventoryID
  state.togglePenMode(penMode)
  if (piece.landPrefix) {
    useBoundStore.getState().togglePieceSize(piece.size)
  }
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

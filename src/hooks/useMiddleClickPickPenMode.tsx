import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { piecesSoFar } from '../data/pieces'
import useBoundStore from '../store/store'
import { Pieces } from '../types'

// These pieces have no pen mode of their own, they are painted via a listed variant
const penModePieceAlias: Record<string, string> = {
  [Pieces.laurWallRuin2]: Pieces.laurWallRuin1,
  [Pieces.laurWallRuin3]: Pieces.laurWallRuin1,
  [Pieces.laurWallShortStackable]: Pieces.laurWallShort,
  [Pieces.laurWallLongStackable]: Pieces.laurWallLong,
}

// Middle-drag is a camera dolly, so only treat a near-motionless middle click as a pick
const MIDDLE_CLICK_DRAG_TOLERANCE_PX = 5

/*
  Middle-clicking a piece makes it the current pen mode (aka eyedropper/pick).
  This listens on the canvas rather than on every model: models each stop
  propagation in their own pointer handlers, but they all report what is under
  the cursor through the shared hoveredPieceID state.
*/
export function useMiddleClickPickPenMode() {
  const domElement = useThree((s) => s.gl.domElement)
  useEffect(() => {
    let downPoint: { x: number; y: number } | null = null
    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 1) return
      downPoint = { x: event.clientX, y: event.clientY }
      event.preventDefault() // no browser autoscroll
    }
    const onMouseUp = (event: MouseEvent) => {
      if (event.button !== 1) return
      const start = downPoint
      downPoint = null
      if (!start) return
      const dragDistance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      )
      if (dragDistance > MIDDLE_CLICK_DRAG_TOLERANCE_PX) return
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
    domElement.addEventListener('mousedown', onMouseDown)
    domElement.addEventListener('mouseup', onMouseUp)
    return () => {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mouseup', onMouseUp)
    }
  }, [domElement])
}

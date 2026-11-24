import useBoundStore from '../store/store'

export function deleteSelectedPieces() {
  const state = useBoundStore.getState()
  const selectedPieceIDs = [...state.selectedPieceIDs]
  state.setPiecePreviews(null)
  state.pushPendingUndoSelectionRestore(selectedPieceIDs)

  // Keep the batched deletion in one undo step.
  for (const [index, pieceUID] of selectedPieceIDs.entries()) {
    if (index === 1) useBoundStore.temporal.getState().pause()
    state.unpaintTile(pieceUID)
  }

  if (selectedPieceIDs.length > 1) {
    useBoundStore.temporal.getState().resume()
  }
  state.toggleSelectedPieceID('')
}

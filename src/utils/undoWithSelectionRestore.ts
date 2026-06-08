import useBoundStore from '../store/store'

/**
 * Wraps zundo's `undo()` so that, when the next undoable action is a delete,
 * the restored piece IDs are automatically re-selected.
 *
 * Selection snapshots are stored in LIFO order and only consumed when undo
 * will increase piece count (i.e. a delete is being undone), so non-delete
 * undos do not eat or misapply saved delete selections.
 */
export function undoWithSelectionRestore() {
  const { toggleSelectedPieceID, popPendingUndoSelectionRestore, boardPieces } =
    useBoundStore.getState()
  const temporalState = useBoundStore.temporal.getState()
  const nextUndoState = temporalState.pastStates.at(-1)
  const nextUndoPieceCount = nextUndoState?.boardPieces?.length ?? 0
  const shouldRestoreSelection =
    !!nextUndoState && nextUndoPieceCount > boardPieces.length

  temporalState.undo()

  const ids = shouldRestoreSelection ? popPendingUndoSelectionRestore() : null

  if (ids?.length) {
    const { boardPieces: restoredBoardPieces } = useBoundStore.getState()
    const restoredIds = ids.filter((id) =>
      restoredBoardPieces.some((bp) => bp.uid === id),
    )
    if (restoredIds.length) {
      // Select first ID (clears any existing selection), then multi-select the rest
      toggleSelectedPieceID(restoredIds[0])
      for (const id of restoredIds.slice(1)) {
        toggleSelectedPieceID(id, true)
      }
    }
  }
}

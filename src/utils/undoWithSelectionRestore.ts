import useBoundStore from '../store/store'

/**
 * Wraps zundo's `undo()` so that, when the most recent undoable action was a
 * delete, the restored piece IDs are automatically re-selected.
 *
 * After undo() the restored boardPieces are checked synchronously — only IDs
 * that are actually present in the new state are selected, which means stale
 * `pendingUndoSelectionRestore` values (from a delete followed by other
 * actions) safely produce no spurious selections.
 */
export function undoWithSelectionRestore() {
  const {
    pendingUndoSelectionRestore,
    setPendingUndoSelectionRestore,
    toggleSelectedPieceID,
  } = useBoundStore.getState()

  // Snapshot the pending IDs before calling undo (undo may trigger re-renders)
  const ids = pendingUndoSelectionRestore ? [...pendingUndoSelectionRestore] : null
  setPendingUndoSelectionRestore(null)

  useBoundStore.temporal.getState().undo()

  if (ids?.length) {
    const { boardPieces } = useBoundStore.getState()
    const restoredIds = ids.filter((id) =>
      boardPieces.some((bp) => bp.uid === id),
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

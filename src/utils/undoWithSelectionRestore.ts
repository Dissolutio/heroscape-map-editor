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
  const {
    toggleSelectedPieceID,
    popPendingUndoSelectionRestore,
    pushPendingRedoSelectionRestore,
  } = useBoundStore.getState()
  const temporalState = useBoundStore.temporal.getState()
  const pieceCountBeforeUndo = useBoundStore.getState().boardPieces.length

  temporalState.undo()

  const pieceCountAfterUndo = useBoundStore.getState().boardPieces.length
  const isUndoingDelete = pieceCountAfterUndo > pieceCountBeforeUndo
  const ids = isUndoingDelete ? popPendingUndoSelectionRestore() : null
  if (ids?.length) {
    pushPendingRedoSelectionRestore(ids)
  }

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

/**
 * Wraps zundo's `redo()` and restores delete selection metadata so a
 * subsequent undo of that redone delete can re-select the affected pieces.
 */
export function redoWithSelectionRestore() {
  const {
    popPendingRedoSelectionRestore,
    pushPendingUndoSelectionRestoreFromRedo,
  } = useBoundStore.getState()
  const temporalState = useBoundStore.temporal.getState()
  const pieceCountBeforeRedo = useBoundStore.getState().boardPieces.length

  temporalState.redo()

  const pieceCountAfterRedo = useBoundStore.getState().boardPieces.length
  const isRedoingDelete = pieceCountAfterRedo < pieceCountBeforeRedo

  if (isRedoingDelete) {
    const ids = popPendingRedoSelectionRestore()
    if (ids?.length) {
      pushPendingUndoSelectionRestoreFromRedo(ids)
    }
  }
}

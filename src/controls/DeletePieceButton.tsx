import { Button } from '@mui/material'
import useBoundStore from '../store/store'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const DeletePieceButton = () => {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    // isMediumScreenWidth,
  } = useMuiMediaQuery()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)
  const pushPendingUndoSelectionRestore = useBoundStore(
    (s) => s.pushPendingUndoSelectionRestore,
  )
  const deletePiece = () => {
    setPiecePreviews(null)
    // Save the IDs so undo() can re-select them
    pushPendingUndoSelectionRestore([...selectedPieceIDs])
    // Zundo batching: let the first delete run normally so zundo records the
    // pre-batch snapshot into history, then pause so intermediate deletes are
    // not individually tracked. resume() after the loop collapses everything
    // into a single undo step.
    for (const [i, id] of selectedPieceIDs.entries()) {
      if (i === 1) useBoundStore.temporal.getState().pause()
      unpaintTile(id)
    }
    if (selectedPieceIDs.length > 1) useBoundStore.temporal.getState().resume()
    toggleSelectedPieceID('')
  }

  return (
    <Button
      // variant='contained'
      // color="error"
      size="small"
      onClick={deletePiece}
      onMouseEnter={() => setPiecePreviews([])}
      onMouseLeave={() => setPiecePreviews(null)}
      onFocus={() => setPiecePreviews([])}
      onBlur={() => setPiecePreviews(null)}
      title="Hotkey: delete"
      sx={{
        p: 0,
        fontSize: isSmallScreenWidth ? 10 : 12,
      }}
    >
      {`Delete Piece${selectedPieceIDs.length > 1 ? 's' : ''}`}
    </Button>
  )
}

export default DeletePieceButton

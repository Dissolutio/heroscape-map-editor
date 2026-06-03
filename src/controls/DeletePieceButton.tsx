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
  const deletePiece = () => {
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
      title="Hotkey: delete"
      sx={{
        p: 0,
        fontSize: isSmallScreenWidth ? 10 : 12,
      }}
    >
      Delete Piece
    </Button>
  )
}

export default DeletePieceButton

import { Button } from '@mui/material'
import useBoundStore from '../store/store'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const {
    // isLargeScreenLayout,
    isMobileScreenLayout,
    // isMediumScreenLayout,
  } = useMuiMediaQuery()
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  const deletePiece = () => {
    unpaintTile(selectedPieceID)
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
        fontSize: isMobileScreenLayout ? 10 : undefined
      }}
    >
      Delete Piece
    </Button>
  )
}

export default DeletePieceButton

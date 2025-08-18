import { Button } from '@mui/material'
import useBoundStore from '../store/store'

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
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
    >
      Delete Piece
    </Button>
  )
}

export default DeletePieceButton

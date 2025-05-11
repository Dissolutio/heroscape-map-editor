import { Button } from '@mui/material'
import { noop } from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import useBoundStore from '../store/store'

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const unpaintTile = useBoundStore((s) => s.unpaintTile)
  useHotkeys(
    'delete',
    () => (selectedPieceID ? deletePiece() : noop()) /*isEnabled*/,
  )
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
    >
      Delete Piece
    </Button>
  )
}

export default DeletePieceButton

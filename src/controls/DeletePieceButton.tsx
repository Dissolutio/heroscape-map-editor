import { Button } from '@mui/material'
import useBoundStore from '../store/store'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'
import { deleteSelectedPieces } from './deleteSelectedPieces'

const DeletePieceButton = () => {
  const selectedPieceIDs = useBoundStore((s) => s.selectedPieceIDs)
  const {
    // isLargeScreenWidth,
    isSmallScreenWidth,
    // isMediumScreenWidth,
  } = useMuiMediaQuery()
  const setPiecePreviews = useBoundStore((s) => s.setPiecePreviews)

  return (
    <Button
      // variant='contained'
      // color="error"
      size="small"
      onClick={deleteSelectedPieces}
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

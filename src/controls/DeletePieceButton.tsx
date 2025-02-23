import React from 'react'
import useBoundStore from '../store/store'
import { Button } from '@mui/material'
import { isPieceIDPiece } from '../utils/board-utils'
import { useHotkeys } from 'react-hotkeys-hook'
import { enqueueSnackbar } from 'notistack'
import { noop } from 'lodash'

type Props = {
  pieceID: string
}

const DeletePieceButton = ({ pieceID }: Props) => {
  const selectedPieceID = useBoundStore(s => s.selectedPieceID)
  const toggleSelectedPieceID = useBoundStore(s => s.toggleSelectedPieceID)
  const removePieceByPieceID = useBoundStore(s => s.removePieceByPieceID)
  useHotkeys('delete', () => selectedPieceID ? deletePiece() : noop(), /*isEnabled*/)
  const deletePiece = () => {
    if (isPieceIDPiece(pieceID)) {
      removePieceByPieceID(selectedPieceID)
      toggleSelectedPieceID('')
    }
    // else if(true){
    // console.log("🚀 ~ deletePiece ~ true:", true)
    // } 
    else {
      enqueueSnackbar({
        message: `Currently, can only delete battlements, roadwalls, and laur wall addons.`,
        variant: 'error',
        autoHideDuration: 3000,
      })
    }

  }
  return (
    <Button
      // variant='contained'
      // color="error"
      size="small"
      onClick={deletePiece}
    >Delete Piece</Button>
  )
}

export default DeletePieceButton
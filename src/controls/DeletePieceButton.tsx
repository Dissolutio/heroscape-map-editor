import React from 'react'
import useBoundStore from '../store/store'
import { Button } from '@mui/material'
import { isNoVerifyDeletePieceByPieceID, isPieceIDPiece } from '../utils/board-utils'
import { useHotkeys } from 'react-hotkeys-hook'
import { enqueueSnackbar } from 'notistack'
import { noop } from 'lodash'
import { decodePieceID } from '../utils/map-utils'

type Props = {
  pieceID: string
}

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore(s => s.selectedPieceID)
  const { pieceID: inventoryID } = decodePieceID(selectedPieceID)
  const toggleSelectedPieceID = useBoundStore(s => s.toggleSelectedPieceID)
  const removePieceByPieceID = useBoundStore(s => s.removePieceByPieceID)
  useHotkeys('delete', () => selectedPieceID ? deletePiece() : noop(), /*isEnabled*/)
  const deletePiece = () => {
    if (isPieceIDPiece(inventoryID)) {
      removePieceByPieceID(selectedPieceID)
      toggleSelectedPieceID('')
    }
    /* 
    0. Obstacles, Ruins, Land fluid
    1. Laur Pillars
    2. Land Solid (check stuff on top)
    3. Ladders
    4. Castle Pieces
    */
    else if (isNoVerifyDeletePieceByPieceID(inventoryID)) {
      console.log("🚀 ~ deletePiece ~ true:", true)
    }
    else {
      enqueueSnackbar({
        message: `Currently, can only delete battlements, roadwalls, and laur wall addons, ruins, and obstacles.`,
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
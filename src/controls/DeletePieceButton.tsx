import { Button } from '@mui/material'
import { noop } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import useBoundStore from '../store/store'
import {
  isNoVerifyDeletePieceByPieceID,
  isRenderedFromPieceIDPiece,
} from '../utils/board-utils'
import { decodePieceID } from '../utils/map-utils'

type Props = {
  pieceID: string
}

const DeletePieceButton = () => {
  const selectedPieceID = useBoundStore((s) => s.selectedPieceID)
  const { pieceID: inventoryID } = decodePieceID(selectedPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const removePieceByPieceID = useBoundStore((s) => s.removePieceByPieceID)
  useHotkeys(
    'delete',
    () => (selectedPieceID ? deletePiece() : noop()) /*isEnabled*/,
  )
  const deletePiece = () => {
    if (isRenderedFromPieceIDPiece(inventoryID)) {
      removePieceByPieceID(selectedPieceID)
      toggleSelectedPieceID('')
    } else if (isNoVerifyDeletePieceByPieceID(inventoryID)) {
      /* 
    0. Obstacles, Ruins
    1. Laur Pillars
    2. Land (check stuff on top)
    3. Ladders
    4. Castle Pieces
    */
      console.log('🚀 ~ deletePiece ~ true:', true)
    } else {
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
    >
      Delete Piece
    </Button>
  )
}

export default DeletePieceButton

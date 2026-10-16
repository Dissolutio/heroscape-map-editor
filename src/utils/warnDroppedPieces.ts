import type { ProviderContext } from 'notistack'
import { type DroppedBoardPiece, getDroppedPiecesWarning } from './map-utils'

/** Show one warning snackbar if a map load dropped unknown pieces. */
export function warnDroppedPieces(
  enqueueSnackbar: ProviderContext['enqueueSnackbar'],
  droppedPieces: DroppedBoardPiece[],
) {
  const message = getDroppedPiecesWarning(droppedPieces)
  if (!message) return
  console.warn('Dropped unknown pieces on load', droppedPieces)
  enqueueSnackbar({ message, variant: 'warning', autoHideDuration: 10000 })
}

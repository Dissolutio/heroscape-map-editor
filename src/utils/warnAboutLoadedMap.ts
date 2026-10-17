import type { ProviderContext } from 'notistack'
import type { JsonMapLoadResult } from '../data/buildupMap'
import { getFluidStackWarning, getTallestFluidStack } from './fluidStacks'
import { getDroppedPiecesWarning } from './map-utils'

type EnqueueSnackbar = ProviderContext['enqueueSnackbar']

/**
 * The warnings shown after a map loads: pieces this version did not
 * recognize (dropped), and fluid stacks taller than the tiles really line up.
 */
export function warnAboutLoadedMap(
  enqueueSnackbar: EnqueueSnackbar,
  map: JsonMapLoadResult,
) {
  const droppedMessage = getDroppedPiecesWarning(map.droppedPieces)
  if (droppedMessage) {
    console.warn('Dropped unknown pieces on load', map.droppedPieces)
    enqueueSnackbar({
      message: droppedMessage,
      variant: 'warning',
      autoHideDuration: 10000,
    })
  }
  warnIfTallFluidStack(enqueueSnackbar, getTallestFluidStack(map.boardHexes))
}

/** One warning if a straight run of stacked fluid tiles is too tall. */
export function warnIfTallFluidStack(
  enqueueSnackbar: EnqueueSnackbar,
  runLength: number,
) {
  const message = getFluidStackWarning(runLength)
  if (!message) return
  enqueueSnackbar({ message, variant: 'warning', autoHideDuration: 10000 })
}

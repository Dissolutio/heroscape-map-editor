import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from "@mui/material"
import { useSnackbar } from "notistack"
import useBoundStore from "../store/store"
import type { PieceInventory } from "../types"

export const EditPieceInventoryDialog = () => {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const toggleIsPieceInventoryDialogOpen = useBoundStore(
    (state) => state.toggleIsPieceInventoryDialogOpen,
  )
  const isPieceInventoryDialogOpen = useBoundStore(
    (state) => state.isPieceInventoryDialogOpen,
  )
  const handleClose = () => toggleIsPieceInventoryDialogOpen(false)
  const { enqueueSnackbar } = useSnackbar()

  // // biome-ignore lint/correctness/useExhaustiveDependencies: <Only reset when dialog opens or closes>
  // useEffect(() => {
  //   // reset vals to the current map when dialog opens/closes
  //   if (isPieceInventoryDialogOpen) {
  //   }
  // }, [isPieceInventoryDialogOpen])
  const onSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
    const formJson = Object.fromEntries((formData as any).entries())
    let newPieceInventory: PieceInventory = {}

    // changeMapName(newMapName)
    // changeAuthorName(newAuthorName)
    // changeMapNotes(newMapNotes)
    // addMapPortraitBase64(imgSrc)
    enqueueSnackbar({
      message: 'Updated Piece Inventory',
      autoHideDuration: 3000,
    })
    handleClose()
  }
  return (
    <Dialog
      open={isPieceInventoryDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth={!fullScreen}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: onSubmitForm,
        },
      }}
    >
      <DialogTitle>Edit Piece Inventory</DialogTitle>
      <DialogContent>


      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}
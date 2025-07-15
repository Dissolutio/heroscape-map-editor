import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from "@mui/material"
import { useSnackbar } from "notistack"
import useBoundStore from "../store/store"

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
  /* 
  const [file, setFile] = React.useState<File | undefined>(undefined)
  // update base64 map portrait when file uploaded
    React.useEffect(() => {
      let fileReader = undefined
      let isCancel = false
      if (file) {
        fileReader = new FileReader()
        fileReader.onload = (e) => {
          const reader = e.target as FileReader
          const result = reader.result
          if (result && !isCancel) {
            addMapPortraitBase64(result.toString())
          }
        }
        fileReader.readAsDataURL(file)
      }
      return () => {
        isCancel = true
        if (fileReader && fileReader.readyState === 1) {
          fileReader.abort()
        }
      }
    }, [file, addMapPortraitBase64])
    */

  // // biome-ignore lint/correctness/useExhaustiveDependencies: <Only reset when dialog opens or closes>
  // useEffect(() => {
  //   // reset vals to the current map when dialog opens/closes
  //   if (isPieceInventoryDialogOpen) {
  //   }
  // }, [isPieceInventoryDialogOpen])

  return (
    <Dialog
      open={isPieceInventoryDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth={!fullScreen}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            handleClose()
          },
        },
      }}
    >
      <DialogTitle>Edit Piece Inventory</DialogTitle>
      <DialogContent>
        <div>Put the form here!</div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}
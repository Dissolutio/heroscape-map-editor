import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import useBoundStore from '../store/store'
import { DIALOGS } from '../layout/dialogNames'
import InventoryForm from '../controls/InventoryForm'

export const EditPieceInventoryDialog = () => {
  const toggleIsPieceInventoryDialogOpen = useBoundStore(
    (state) => state.toggleIsPieceInventoryDialogOpen,
  )
  const isPieceInventoryDialogOpen =
    useBoundStore((state) => state.currentDialog) ===
    DIALOGS.editPersonalInventory
  const handleClose = () => toggleIsPieceInventoryDialogOpen(false)

  return (
    <Dialog
      open={isPieceInventoryDialogOpen}
      onClose={handleClose}
      fullWidth={true}
      maxWidth={'xl'}
    >
      <DialogTitle>Edit Personal Inventory</DialogTitle>
      <DialogContent>
        <InventoryForm />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

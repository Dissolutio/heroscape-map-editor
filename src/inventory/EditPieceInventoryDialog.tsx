import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  Box,
  Typography,
  TextField,
  Divider,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import type { PieceInventory } from '../types'
import * as pieceSets from '../data/inventories'
import { useState, useEffect } from 'react'
import { piecesSoFar } from '../data/pieces'
import { blankPieceInventory } from './blankInventory'

export const EditPieceInventoryDialog = () => {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const toggleIsPieceInventoryDialogOpen = useBoundStore(
    (state) => state.toggleIsPieceInventoryDialogOpen,
  )
  const isPieceInventoryDialogOpen = useBoundStore(
    (state) => state.isPieceInventoryDialogOpen,
  )
  const userPieceInventory = useBoundStore((state) => state.userPieceInventory)
  const updateUserPieceInventory = useBoundStore(
    (state) => state.updateUserPieceInventory,
  )
  const handleClose = () => toggleIsPieceInventoryDialogOpen(false)
  const { enqueueSnackbar } = useSnackbar()

  // Local state for editing
  const [localInventory, setLocalInventory] = useState<PieceInventory>(
    userPieceInventory || { ...blankPieceInventory },
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Reset local inventory when dialog opens>
  useEffect(() => {
    if (isPieceInventoryDialogOpen) {
      setLocalInventory(userPieceInventory || { ...blankPieceInventory })
    }
    // eslint-disable-next-line
  }, [isPieceInventoryDialogOpen])

  // Add all pieces from a set
  const handleAddSet = (set: PieceInventory) => {
    const newInventory = { ...localInventory }
    for (const pieceId of Object.keys(set)) {
      newInventory[pieceId] = (newInventory[pieceId] || 0) + set[pieceId]
    }
    setLocalInventory(newInventory)
  }

  // Handle individual piece change
  const handlePieceChange = (pieceId: string, value: number) => {
    setLocalInventory((prev) => ({
      ...prev,
      [pieceId]: value,
    }))
  }

  const onSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateUserPieceInventory(localInventory)
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
        <h3>Coming soon!</h3>
        {/* <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Object.entries(pieceSets).map(([setName, set]) => (
            <Button
              key={setName}
              variant="outlined"
              size="small"
              onClick={() => handleAddSet(set)}
            >
              Add {setName}
            </Button>
          ))}
        </Box>
        <Box key={group.label} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            {group.label}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {group.pieces.map((pieceId: string) => {
              const piece = piecesSoFar[pieceId]
              if (!piece) return null
              return (
                <Box key={pieceId} sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                  <TextField
                    label={piece.title || pieceId}
                    type="number"
                    size="small"
                    value={localInventory[pieceId] ?? 0}
                    onChange={(e) => handlePieceChange(pieceId, Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0, style: { width: 60 } }}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {piece.shortName || piece.title || pieceId}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box> */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}

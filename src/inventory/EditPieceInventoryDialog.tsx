import { useState, useEffect } from 'react'
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
import { piecesSoFar } from '../data/pieces'
import { blankPieceInventory } from './blankInventory'
import { terrainSets } from '../data/terrainSets'
import { pieceGroups } from '../data/pieceGroups'

export const EditPieceInventoryDialog = () => {
  // const fullScreen = useMediaQuery('(max-width:900px)')
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

  // Track how many times each set is added during this session
  const [setAddCounts, setSetAddCounts] = useState<{ [setId: string]: number }>(
    {},
  )

  // Reset counts when dialog opens
  useEffect(() => {
    if (isPieceInventoryDialogOpen) {
      setSetAddCounts({})
    }
    // eslint-disable-next-line
  }, [isPieceInventoryDialogOpen])

  // Add all pieces from a set and increment count
  const handleAddSet = (set: PieceInventory, setId: string) => {
    const newInventory = { ...localInventory }
    for (const pieceId of Object.keys(set)) {
      newInventory[pieceId] = (newInventory[pieceId] || 0) + set[pieceId]
    }
    setLocalInventory(newInventory)
    setSetAddCounts((prev) => ({
      ...prev,
      [setId]: (prev[setId] || 0) + 1,
    }))
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
      fullScreen={true}
      fullWidth={true}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: onSubmitForm,
        },
      }}
    >
      <DialogTitle>Edit Piece Inventory</DialogTitle>
      <DialogContent>
        {/* Display set add counts */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          {Object.values(terrainSets).map((set) => (
            <Box
              key={set.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleAddSet(set.inventory, set.id)}
              >
                Add {set.name}
              </Button>
              {setAddCounts[set.id] > 0 && (
                <Typography variant="caption" color="primary">
                  ×{setAddCounts[set.id]}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {pieceGroups.map((group) => (
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
                  <Box
                    key={pieceId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 200,
                    }}
                  >
                    <TextField
                      label={piece.title || pieceId}
                      type="number"
                      size="small"
                      value={localInventory[pieceId] ?? 0}
                      onChange={(e) =>
                        handlePieceChange(
                          pieceId,
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {piece.title || pieceId}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}

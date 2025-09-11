import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  useMediaQuery,
} from '@mui/material'
import React from 'react'
import { DIALOGS } from '../layout/dialogNames'
import useBoundStore from '../store/store'
import { terrainSetsByShortID } from '../data/terrainSets'
import { Box } from '@mui/system'
import { FcBiohazard } from 'react-icons/fc'
import { piecesSoFar } from '../data/pieces'

const ViewMapInventoryDialog = () => {
  const fullScreen = useMediaQuery('(max-width:900px)')
  // const fullScreen = true
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const isDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.viewMapInventory
  const handleClose = () => toggleIsNewMapDialogOpen(false)

  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)

  // Get combined inventory for all sets used
  function getCombinedInventory(setsUsed: string[]): Record<string, number> {
    const combined: Record<string, number> = {}
    for (const setID of setsUsed) {
      const set = terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
      for (const [pieceID, count] of Object.entries(set?.inventory ?? {})) {
        combined[pieceID] = (combined[pieceID] || 0) + (count as number)
      }
    }
    return combined
  }

  // Count pieces used in the map
  function countPiecesUsed(boardPieces: Record<string, string>): Record<string, number> {
    const used: Record<string, number> = {}
    for (const pieceID of Object.values(boardPieces)) {
      used[pieceID] = (used[pieceID] || 0) + 1
    }
    return used
  }

  const combinedInventory = getCombinedInventory(hexMap?.setsUsed ?? [])
  const piecesUsed = countPiecesUsed(boardPieces)

  return (
    <React.Fragment>
      <Dialog
        open={isDialogOpen}
        onClose={handleClose}
        fullScreen={fullScreen}
        fullWidth={!fullScreen}
      >
        <DialogTitle>View Map Inventory</DialogTitle>
        <DialogContent>
          <Box>
            {Object.entries(combinedInventory).map(([pieceID, available]) => {
              const usedCount = piecesUsed[pieceID] || 0
              const isOver = usedCount > available
              return (
                <Box key={pieceID} sx={{ color: isOver ? 'error.main' : 'inherit', display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span>{piecesSoFar[pieceID]?.title}: {usedCount} / {available}</span>
                  {isOver && (
                    <Icon sx={{ ml: 1 }}>
                      <FcBiohazard color="error" />
                    </Icon>
                  )}
                </Box>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

export default ViewMapInventoryDialog

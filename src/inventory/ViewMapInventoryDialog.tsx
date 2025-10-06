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
import { yellow } from '@mui/material/colors'

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
      const set =
        terrainSetsByShortID[setID as keyof typeof terrainSetsByShortID]
      for (const [pieceID, count] of Object.entries(set?.inventory ?? {})) {
        combined[pieceID] = (combined[pieceID] || 0) + (count as number)
      }
    }
    return combined
  }

  // Count pieces used in the map
  function countPiecesUsed(boardPieces: string[]): Record<string, number> {
    const used: Record<string, number> = {}
    for (const pieceID of boardPieces) {
      used[pieceID] = (used?.[pieceID] ?? 0) + 1
    }
    return used
  }

  const combinedInventory = getCombinedInventory(hexMap?.setsUsed ?? [])
  const piecesUsed = countPiecesUsed(boardPieces)

  // Merge all pieceIDs from combinedInventory and piecesUsed
  const allPieceIDs = Array.from(
    new Set([...Object.keys(combinedInventory), ...Object.keys(piecesUsed)]),
  )

  // Helper: check if piece is a Start Zone or Glyph
  function isStartZoneOrGlyph(pieceID: string) {
    const title = piecesSoFar[pieceID]?.title?.toLowerCase() || ''
    return title.includes('start zone') || title.includes('glyph')
  }

  // Sort: over-limit, not-allowed, available, depleted, glyphs/start zones at the very end
  const sortedPieceIDs = allPieceIDs.sort((a, b) => {
    const availableA = combinedInventory[a] || 0
    const usedA = piecesUsed[a] || 0
    const isExactA = usedA === availableA && availableA > 0
    const isOverA = usedA > availableA && availableA > 0
    const isNotAllowedA = availableA === 0 && usedA > 0
    const isSpecialA = isStartZoneOrGlyph(a)
    const availableB = combinedInventory[b] || 0
    const usedB = piecesUsed[b] || 0
    const isExactB = usedB === availableB && availableB > 0
    const isOverB = usedB > availableB && availableB > 0
    const isNotAllowedB = availableB === 0 && usedB > 0
    const isSpecialB = isStartZoneOrGlyph(b)
    // Glyphs/start zones always at the end
    if (isSpecialA && !isSpecialB) return 1
    if (!isSpecialA && isSpecialB) return -1
    // Over-limit first
    if (isOverA && !isOverB) return -1
    if (!isOverA && isOverB) return 1
    // Not-allowed next
    if (isNotAllowedA && !isNotAllowedB) return -1
    if (!isNotAllowedA && isNotAllowedB) return 1
    // Available next
    const isAvailableA = usedA < availableA && availableA > 0
    const isAvailableB = usedB < availableB && availableB > 0
    if (isAvailableA && !isAvailableB) return -1
    if (!isAvailableA && isAvailableB) return 1
    // Depleted (exact) next
    if (isExactA && !isExactB) return -1
    if (!isExactA && isExactB) return 1
    return 0
  })

  const hasConstraints =
    Array.isArray(hexMap?.setsUsed) && hexMap.setsUsed.length > 0

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
            {sortedPieceIDs.map((pieceID) => {
              const available = combinedInventory[pieceID] || 0
              const usedCount = piecesUsed[pieceID] || 0
              const isOver = usedCount > available && available > 0
              const isExact = usedCount === available && available > 0
              const isNotAllowed = available === 0 && usedCount > 0
              const skipAlert = isStartZoneOrGlyph(pieceID) || !hasConstraints
              let color = 'inherit'
              if ((isOver || isNotAllowed) && !skipAlert) color = 'error.main'
              else if (isExact && !skipAlert) color = yellow[700]
              return (
                <Box
                  key={pieceID}
                  sx={{
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <span>
                    {piecesSoFar[pieceID]?.title || pieceID}: {usedCount}{' '}
                    {available > 0 ? `/ ${available}` : ''}
                  </span>
                  {isNotAllowed && !skipAlert && (
                    <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                      (Not allowed by sets)
                    </span>
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

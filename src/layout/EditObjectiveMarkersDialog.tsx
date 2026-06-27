import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { piecesSoFar } from '../data/pieces'
import { DIALOGS } from './dialogNames'
import useBoundStore from '../store/store'
import {
  isObjectiveMarkerInventoryID,
  sanitizeObjectiveMarkerMetadataDraft,
} from '../utils/objective-markers'

export default function EditObjectiveMarkersDialog() {
  const currentDialog = useBoundStore((state) => state.currentDialog)
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const metadataByUID = useBoundStore(
    (state) => state.hexMap.objectiveMarkerMetadataByUID ?? {},
  )
  const updateObjectiveMarkerMetadata = useBoundStore(
    (state) => state.updateObjectiveMarkerMetadata,
  )
  const finalizeObjectiveMarkerMetadata = useBoundStore(
    (state) => state.finalizeObjectiveMarkerMetadata,
  )

  const handleClose = () => {
    finalizeObjectiveMarkerMetadata()
    toggleCurrentDialog('')
  }

  const isOpen = currentDialog === DIALOGS.editObjectiveMarkers
  const markers = useMemo(
    () =>
      boardPieces.filter((bp) => isObjectiveMarkerInventoryID(bp.inventoryID)),
    [boardPieces],
  )

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Objective Markers</DialogTitle>
      <DialogContent>
        {markers.length === 0 ? (
          <Typography sx={{ pt: 1 }}>
            No objective markers are currently placed on the map. You can place them like start zones or glyphs.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {markers.map((bp, index) => {
              const piece = piecesSoFar[bp.inventoryID]
              const metadata = sanitizeObjectiveMarkerMetadataDraft(
                metadataByUID[bp.uid] ?? {},
              )

              return (
                <Stack
                  key={bp.uid}
                  spacing={1}
                  sx={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Typography variant="subtitle2">
                    {`${index + 1}. ${piece?.title ?? bp.inventoryID}`}
                  </Typography>
                  <TextField
                    label="Icon Text"
                    value={metadata.iconText}
                    inputProps={{ maxLength: 2 }}
                    helperText="Up to 2 characters"
                    onChange={(event) => {
                      updateObjectiveMarkerMetadata(bp.uid, {
                        iconText: event.target.value,
                      })
                    }}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Label"
                    value={metadata.label}
                    inputProps={{ maxLength: 80 }}
                    helperText="Up to 80 characters"
                    onChange={(event) => {
                      updateObjectiveMarkerMetadata(bp.uid, {
                        label: event.target.value,
                      })
                    }}
                    size="small"
                    fullWidth
                  />
                </Stack>
              )
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

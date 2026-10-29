import { Box, useMediaQuery } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import * as React from 'react'
import { useSnackbar } from 'notistack'
import { terrainSetsByShortID } from '../data/terrainSets'
import useBoundStore from '../store/store'
import { clearMapShareUrlParams } from '../utils/mapShareUrl'
import {
  MAP_AUTHOR_FIELD_NAME,
  MAP_NOTES_FIELD_NAME,
  MapAuthorNotesFields,
} from './MapAuthorNotesFields'
import {
  InputSetsUsedCard,
  setsUsedInputNameForFormData,
} from './InputSetsUsedCard'
import { DIALOGS } from './dialogNames'

export default function EditMapFormDialog() {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const mapName = useBoundStore((state) => state.hexMap.name)
  const changeSetsUsed = useBoundStore((state) => state.changeSetsUsed)
  const terrainConstraintSource = useBoundStore(
    (state) => state.terrainConstraintSource,
  )
  const syncTerrainConstraintPenMode = useBoundStore(
    (state) => state.syncTerrainConstraintPenMode,
  )

  const changeMapName = useBoundStore((state) => state.changeMapName)
  const authorName = useBoundStore((state) => state.hexMap.author)
  const changeAuthorName = useBoundStore((state) => state.changeAuthorName)
  const hexMap = useBoundStore((state) => state.hexMap)
  const changeMapNotes = useBoundStore((state) => state.changeMapNotes)
  const mapNotes = hexMap?.mapNotes ?? ''
  const mapPortraitBase64 = hexMap?.mapPortraitBase64 ?? ''
  const openCropMapPortraitDialog = useBoundStore(
    (state) => state.openCropMapPortraitDialog,
  )
  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const isEditMapDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.editMap
  const currentDialog = useBoundStore((state) => state.currentDialog)
  const handleClose = () => toggleIsEditMapDialogOpen(false)
  const { enqueueSnackbar } = useSnackbar()
  const [newName, setNewName] = React.useState(mapName)
  const [newAuthor, setNewAuthor] = React.useState(authorName)
  const [newNotes, setNewNotes] = React.useState(mapNotes)
  const handleSubmitEditMapForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
    const formJson = Object.fromEntries((formData as any).entries())
    const newMapName = formJson.newMapName
    const newAuthorName = formJson[MAP_AUTHOR_FIELD_NAME]
    const newMapNotes = formJson[MAP_NOTES_FIELD_NAME]
    const getSetsUsedFormData = () => {
      const newSetsUsed: string[] = []
      Object.values(terrainSetsByShortID).map((set) => {
        const count = formJson[`${setsUsedInputNameForFormData}${set.id}`]
        for (let i = 0; i < count; i++) {
          newSetsUsed.push(set.id)
        }
      })
      return newSetsUsed
    }
    const newSetsUsed =
      terrainConstraintSource === 'setsUsed' ? getSetsUsedFormData() : []
    changeMapName(newMapName)
    changeAuthorName(newAuthorName)
    changeMapNotes(newMapNotes)
    changeSetsUsed(newSetsUsed)
    syncTerrainConstraintPenMode()
    clearMapShareUrlParams()
    enqueueSnackbar({
      message: 'Updated Map',
      variant: 'success',
    })
    handleClose()
  }

  const previousDialog = React.useRef(currentDialog)
  React.useEffect(() => {
    if (
      isEditMapDialogOpen &&
      previousDialog.current !== DIALOGS.cropMapPortrait
    ) {
      setNewName(mapName)
      setNewAuthor(authorName)
      setNewNotes(mapNotes)
    }
    previousDialog.current = currentDialog
  }, [currentDialog, isEditMapDialogOpen, mapName, authorName, mapNotes])

  return (
    <Dialog
      open={isEditMapDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth={!fullScreen}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmitEditMapForm,
        },
      }}
    >
      <DialogTitle>Edit Map</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: '1em 4px',
            // display: 'flex',
            // alignItems: 'center',
            // width: '100%',
          }}
        >
          <TextField
            id="newMapName"
            name="newMapName"
            autoFocus
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            margin="dense"
            label="Map Title"
            type="text"
            fullWidth
            variant="outlined"
          />
        </Box>

        {/* TERRAIN SETS */}
        <InputSetsUsedCard />

        <MapAuthorNotesFields
          authorName={newAuthor}
          onAuthorNameChange={setNewAuthor}
          mapNotes={newNotes}
          onMapNotesChange={setNewNotes}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          {mapPortraitBase64 ? (
            <img
              src={mapPortraitBase64}
              alt="Current map portrait"
              style={{ maxWidth: 160, maxHeight: 100, objectFit: 'contain' }}
            />
          ) : (
            <Box sx={{ color: 'text.secondary' }}>No map picture</Box>
          )}
          <Button type="button" onClick={() => openCropMapPortraitDialog(true)}>
            Crop or replace picture
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}

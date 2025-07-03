import { Box, IconButton, useMediaQuery } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useSnackbar } from 'notistack'
import * as React from 'react'
import { MdAutorenew } from 'react-icons/md'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'

export default function EditMapFormDialog() {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const changeMapName = useBoundStore((state) => state.changeMapName)
  const changeAuthorName = useBoundStore((state) => state.changeAuthorName)
  const mapName = useBoundStore((state) => state.hexMap.name)
  const authorName = useBoundStore((state) => state.hexMap.author)
  // const mapPortraitBase64 = useBoundStore((state) => state.mapPortraitBase64)
  const addMapPortraitBase64 = useBoundStore(
    (state) => state.addMapPortraitBase64,
  )
  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const isEditMapDialogOpen = useBoundStore(
    (state) => state.isEditMapDialogOpen,
  )
  const handleClose = () => toggleIsEditMapDialogOpen(false)
  const { enqueueSnackbar } = useSnackbar()
  const [newName, setNewName] = React.useState(mapName)
  const [newAuthor, setNewAuthor] = React.useState(authorName)
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

  // const onChangeMapPortrait = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event?.target?.files?.[0]
  //   if (!file) {
  //     return
  //   }
  //   setFile(file);
  // }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Only reset when dialog opens or closes>
  React.useEffect(() => {
    // reset vals to the current map when dialog opens/closes
    setNewName(mapName)
    setNewAuthor(authorName)
  }, [isEditMapDialogOpen])

  return (
    <React.Fragment>
      <Dialog
        open={isEditMapDialogOpen}
        onClose={handleClose}
        fullScreen={fullScreen}
        fullWidth={!fullScreen}
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
              const formJson = Object.fromEntries((formData as any).entries())
              const newMapName = formJson.newMapName
              const newAuthorName = formJson.newAuthorName
              changeMapName(newMapName)
              changeAuthorName(newAuthorName)
              enqueueSnackbar({
                message: `Updated Map Name: ${newMapName}`,
                autoHideDuration: 3000,
              })
              handleClose()
            },
          },
        }}
      >
        <DialogTitle>Edit Map</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: '1em 4px',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
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
            <IconButton
              title="Generate new random map name"
              type="button"
              sx={{ p: '10px' }}
              onClick={() => setNewName(genRandomMapName())}
            >
              <MdAutorenew />
            </IconButton>
          </Box>
          <Box
            sx={{
              p: '1em 4px',
            }}
          >
            <TextField
              id="newAuthorName"
              name="newAuthorName"
              required
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              margin="dense"
              label="Map Author"
              type="text"
              fullWidth
              variant="outlined"
            />
          </Box>
          {/* <label htmlFor='mapPortraitInput'>
            Map portrait:
            <input
              id="mapPortraitInput"
              type="file"
              accept="image/*"
              onChange={onChangeMapPortrait}
            />
          </label>
          <img
            alt="map portrait"
            src={mapPortraitBase64} /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Submit</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

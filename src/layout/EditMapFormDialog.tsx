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
import ReactCropExampleApp from '../react-image-crop/ReactCropExampleApp'
import 'react-image-crop/dist/ReactCrop.css'
import { terrainSetsByShortID } from '../data/terrainSets'

export default function EditMapFormDialog() {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const mapName = useBoundStore((state) => state.hexMap.name)
  const setsUsed = useBoundStore((state) => state.hexMap.setsUsed) ?? []
  const changeMapName = useBoundStore((state) => state.changeMapName)
  const authorName = useBoundStore((state) => state.hexMap.author)
  const changeAuthorName = useBoundStore((state) => state.changeAuthorName)
  const mapNotes = useBoundStore((state) => state.mapNotes)
  const changeMapNotes = useBoundStore((state) => state.changeMapNotes)
  const mapPortraitBase64 = useBoundStore((state) => state.mapPortraitBase64)
  const changeSetsUsed = useBoundStore((state) => state.changeSetsUsed)
  const [imgSrc, setImgSrc] = React.useState(mapPortraitBase64)
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

  const handleSubmitEditMapForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
    const formJson = Object.fromEntries((formData as any).entries())
    const newMapName = formJson.newMapName
    const newAuthorName = formJson.newAuthorName
    const newMapNotes = formJson.mapNotes
    const newSetsUsed: string[] = []
    Object.values(terrainSetsByShortID).map((set) => {
      const count = formJson[`terrainSet${set.id}`]
      for (let i = 0; i < count; i++) {
        newSetsUsed.push(set.id)
      }
    })
    changeMapName(newMapName)
    changeAuthorName(newAuthorName)
    changeMapNotes(newMapNotes)
    changeSetsUsed(newSetsUsed)
    addMapPortraitBase64(imgSrc)
    enqueueSnackbar({
      message: `Updated Map Name: ${newMapName}`,
      autoHideDuration: 3000,
    })
    handleClose()
  }

  // TODO: UPDATE BASE64 URL (and jpg)
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Only reset when dialog opens or closes>
  React.useEffect(() => {
    // reset vals to the current map when dialog opens/closes
    if (isEditMapDialogOpen) {
      setNewName(mapName)
      setNewAuthor(authorName)
      changeMapNotes(mapNotes)
      setImgSrc(mapPortraitBase64)
    }
  }, [isEditMapDialogOpen])

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

        {/* TERRAIN SETS */}
        <Box
          sx={
            {
              // border: '1px solid'
            }
          }
        >
          <h3>Terrain set constraints:</h3>
          {Object.values(terrainSetsByShortID).map((set) => (
            <TextField
              key={set.id}
              defaultValue={countStringInArrayLoop(setsUsed, set.id)}
              name={`terrainSet${set.id}`}
              // onChange={(e) => setNewAuthor(e.target.value)}
              margin="dense"
              label={set.name}
              type="number"
              variant="outlined"
            />
          ))}
        </Box>

        {/* MAP AUTHOR */}
        <Box
          sx={{
            p: '1em 4px',
          }}
        >
          <TextField
            id="newAuthorName"
            name="newAuthorName"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            margin="dense"
            label="Map Author"
            type="text"
            fullWidth
            variant="outlined"
          />
        </Box>

        {/* MAP NOTES */}
        <Box
          sx={{
            p: '1em 4px',
          }}
        >
          <TextField
            id="mapNotes"
            name="mapNotes"
            label="Map Notes"
            defaultValue={mapNotes}
            placeholder="Your notes here..."
            fullWidth
            multiline
            rows={4}
          />
        </Box>
        <ReactCropExampleApp imgSrc={imgSrc} setImgSrc={setImgSrc} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}

function countStringInArrayLoop(arr: string[], targetString: string) {
  let count = 0
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === targetString) {
      count++
    }
  }
  return count
}

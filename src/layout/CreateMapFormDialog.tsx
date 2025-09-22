import { Box, IconButton, useMediaQuery } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'
import { useSnackbar } from 'notistack'
import * as React from 'react'
import { MdAutorenew } from 'react-icons/md'
import { useLocation } from 'wouter'
import { ROUTES } from '../ROUTES'
import useBoundStore from '../store/store'
import {
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { genRandomMapName } from '../utils/genRandomMapName'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import { DIALOGS } from './dialogNames'
import { terrainSetsByShortID } from '../data/terrainSets'
import {
  InputSetsUsedCard,
  setsUsedInputNameForFormData,
} from './InputSetsUsedCard'

const hexagonMarks = [
  {
    value: 8,
    label: 'Small',
  },
  {
    value: 10,
    label: 'Medium',
  },
  {
    value: 14,
    label: 'Large',
  },
]
const rectangleMarks = [
  {
    value: 12,
    label: 'Small',
  },
  {
    value: 20,
    label: 'Medium',
  },
  {
    value: 25,
    label: 'Large',
  },
]

export default function CreateMapFormDialog() {
  const [, navigate] = useLocation()
  const fullScreen = useMediaQuery('(max-width:900px)')
  const loadMap = useBoundStore((state) => state.loadMap)
  // const { clear: clearUndoHistory } = useBoundStore.temporal.getState()
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const isNewMapDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.newMap
  const changeMapNotes = useBoundStore((state) => state.changeMapNotes)
  const addMapPortraitBase64 = useBoundStore(
    (state) => state.addMapPortraitBase64,
  )
  const handleClose = () => toggleIsNewMapDialogOpen(false)
  const { enqueueSnackbar } = useSnackbar()
  // new map form state
  const [mapName, setMapName] = React.useState(() => genRandomMapName())
  const [mapShape, setMapShape] = React.useState('rectangle')
  const handleChangeMapShape = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMapShape((event.target as HTMLInputElement).value)
  }
  const [mapWidth, setMapWidth] = React.useState(20)
  const [mapLength, setMapLength] = React.useState(20)
  const [mapSize, setMapSize] = React.useState(10)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // setsUsed is uncontrolled and extracted from form data
    const formData = new FormData(event.currentTarget)
    // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
    const formJson = Object.fromEntries((formData as any).entries())
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
    const newSetsUsed = getSetsUsedFormData()
    const blankMap =
      mapShape === 'rectangle'
        ? makeRectangleScenario({
            mapName,
            width: mapWidth,
            length: mapLength,
          })
        : makeHexagonScenario({
            mapName,
            size: mapSize,
          })
    const editedMapState = {
      ...blankMap,
      hexMap: {
        ...blankMap.hexMap,
        setsUsed: newSetsUsed,
      },
    }
    loadMap(editedMapState)
    changeMapNotes('')
    addMapPortraitBase64('')
    // clearUndoHistory is commented above, imported
    // clearUndoHistory()
    navigate(ROUTES.heroscapeHome)
    enqueueSnackbar({
      message: `Created new map: ${editedMapState.hexMap.name}`,
      autoHideDuration: 5000,
    })
  }

  return (
    <React.Fragment>
      <Dialog
        open={isNewMapDialogOpen}
        onClose={handleClose}
        fullScreen={fullScreen}
        fullWidth={!fullScreen}
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              handleSubmit(event)
              handleClose()
            },
          },
        }}
      >
        <DialogTitle>New Map</DialogTitle>
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
              autoFocus
              required
              value={mapName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setMapName(event.target.value)
              }}
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
              onClick={() => setMapName(genRandomMapName())}
            >
              <MdAutorenew />
            </IconButton>
          </Box>
          <FormControl>
            <FormLabel id="map-shape-label">Map Shape</FormLabel>
            <RadioGroup
              row
              aria-labelledby="map-shape-label"
              defaultValue="rectangle"
              name="map-shape-radio-buttons-group"
              value={mapShape}
              onChange={handleChangeMapShape}
            >
              <FormControlLabel
                value="rectangle"
                control={<Radio />}
                label="Rectangle"
              />
              <FormControlLabel
                value="hexagon"
                control={<Radio />}
                label="Hexagon"
              />
            </RadioGroup>
          </FormControl>
          {mapShape === 'rectangle' ? (
            <>
              <Box sx={{ marginY: '1em' }}>
                <div>Map length: </div>
                <Slider
                  // size='small'
                  min={1}
                  max={MAX_RECTANGLE_MAP_DIMENSION}
                  value={mapLength}
                  onChange={(_e: Event, value: number | number[]) => {
                    setMapLength(value as number)
                  }}
                  step={1}
                  valueLabelDisplay="on"
                  marks={rectangleMarks}
                />
              </Box>
              <Box sx={{ marginY: '1em' }}>
                <div>Map width: </div>
                <Slider
                  // size='small'
                  min={1}
                  max={MAX_RECTANGLE_MAP_DIMENSION}
                  value={mapWidth}
                  onChange={(_e: Event, value: number | number[]) => {
                    setMapWidth(value as number)
                  }}
                  step={1}
                  valueLabelDisplay="on"
                  marks={rectangleMarks}
                />
              </Box>
            </>
          ) : (
            <Box sx={{ marginY: '1em' }}>
              <Slider
                // size='small'
                min={1}
                max={MAX_HEXAGON_MAP_DIMENSION}
                value={mapSize}
                onChange={(_e: Event, value: number | number[]) => {
                  setMapSize(value as number)
                }}
                step={1}
                valueLabelDisplay="on"
                marks={hexagonMarks}
              />
            </Box>
          )}
          {/* TERRAIN SETS */}
          <InputSetsUsedCard isCreateNewMap />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

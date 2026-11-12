import { Box, Checkbox, useMediaQuery } from '@mui/material'
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
import { useSnackbar } from 'notistack'
import * as React from 'react'
import { useLocation } from 'wouter'
import { ROUTES } from '../ROUTES'
import useBoundStore from '../store/store'
import {
  DEFAULT_NEW_HEXAGON_MAP_SIZE,
  DEFAULT_NEW_RECTANGLE_MAP_LENGTH,
  DEFAULT_NEW_RECTANGLE_MAP_WIDTH,
  MAX_HEXAGON_MAP_DIMENSION,
  MAX_RECTANGLE_MAP_DIMENSION,
} from '../utils/constants'
import { genRandomMapName } from '../utils/genRandomMapName'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import type { MapPhysicalSizeInput } from '../utils/mapPhysicalSize'
import { DIALOGS } from './dialogNames'
import { MapSizeDisplay } from './MapSizeDisplay'
import { terrainSetsByShortID } from '../data/terrainSets'
import {
  InputSetsUsedCard,
  setsUsedInputNameForFormData,
} from './InputSetsUsedCard'
import {
  MAP_AUTHOR_FIELD_NAME,
  MAP_NOTES_FIELD_NAME,
  MapAuthorNotesFields,
} from './MapAuthorNotesFields'
import { MapNameField } from './MapNameField'

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
  // new map form state
  const [mapName, setMapName] = React.useState(() => genRandomMapName())
  const [mapShape, setMapShape] = React.useState<'rectangle' | 'hexagon'>(
    'rectangle',
  )
  const [mapWidth, setMapWidth] = React.useState(
    DEFAULT_NEW_RECTANGLE_MAP_WIDTH,
  )
  const [mapLength, setMapLength] = React.useState(
    DEFAULT_NEW_RECTANGLE_MAP_LENGTH,
  )
  const [mapSize, setMapSize] = React.useState(DEFAULT_NEW_HEXAGON_MAP_SIZE)
  const rememberedMapAuthor = useBoundStore(
    (state) => state.rememberedMapAuthor,
  )
  const setRememberedMapAuthor = useBoundStore(
    (state) => state.setRememberedMapAuthor,
  )
  const [mapAuthor, setMapAuthor] = React.useState(rememberedMapAuthor)
  const [mapNotes, setMapNotes] = React.useState('')
  const [rememberAuthor, setRememberAuthor] = React.useState(
    rememberedMapAuthor.length > 0,
  )
  const loadMap = useBoundStore((state) => state.loadMap)
  const terrainConstraintSource = useBoundStore(
    (state) => state.terrainConstraintSource,
  )
  const syncTerrainConstraintPenMode = useBoundStore(
    (state) => state.syncTerrainConstraintPenMode,
  )
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
  React.useEffect(() => {
    if (!isNewMapDialogOpen) return
    const author = useBoundStore.getState().rememberedMapAuthor
    setMapAuthor(author)
    setMapNotes('')
    setRememberAuthor(author.length > 0)
  }, [isNewMapDialogOpen])
  const handleAuthorChange = (author: string) => {
    setMapAuthor(author)
    if (rememberAuthor) setRememberedMapAuthor(author)
  }
  const handleRememberAuthorChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = event.target.checked
    setRememberAuthor(checked)
    setRememberedMapAuthor(checked ? mapAuthor : '')
  }
  const handleChangeMapShape = (event: React.ChangeEvent<HTMLInputElement>) => {
    const shape = event.target.value
    if (shape === 'rectangle' || shape === 'hexagon') setMapShape(shape)
  }
  const physicalSizeMap = React.useMemo<MapPhysicalSizeInput>(
    () => ({
      shape: mapShape,
      width: mapShape === 'hexagon' ? mapSize : mapWidth,
      length: mapShape === 'hexagon' ? mapSize : mapLength,
    }),
    [mapShape, mapLength, mapSize, mapWidth],
  )
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // setsUsed is uncontrolled react form state, we extract it from form data
    const formData = new FormData(event.currentTarget)
    // biome-ignore lint/suspicious/noExplicitAny: <form data not well understood>
    const formJson = Object.fromEntries((formData as any).entries())
    const newMapAuthor = formJson[MAP_AUTHOR_FIELD_NAME]
    const newMapNotes = formJson[MAP_NOTES_FIELD_NAME]
    const getSetsUsedFormData = () => {
      const newSetsUsed: string[] = []
      Object.values(terrainSetsByShortID).forEach((set) => {
        const count = formJson[`${setsUsedInputNameForFormData}${set.id}`]
        for (let i = 0; i < count; i++) {
          newSetsUsed.push(set.id)
        }
      })
      return newSetsUsed
    }
    const newSetsUsed =
      terrainConstraintSource === 'setsUsed' ? getSetsUsedFormData() : []
    const blankMap =
      mapShape === 'rectangle'
        ? makeRectangleScenario({
            mapName,
            width: mapWidth,
            length: mapLength,
            author: newMapAuthor,
            mapNotes: newMapNotes,
          })
        : makeHexagonScenario({
            mapName,
            size: mapSize,
            author: newMapAuthor,
            mapNotes: newMapNotes,
          })
    const editedMapState = {
      ...blankMap,
      hexMap: {
        ...blankMap.hexMap,
        setsUsed: newSetsUsed,
      },
    }
    loadMap(editedMapState)
    syncTerrainConstraintPenMode()
    changeMapNotes(newMapNotes)
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
          <MapNameField value={mapName} onChange={setMapName} />
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ width: '100%' }}>
              {mapShape === 'rectangle' ? (
                <>
                  <Box sx={{ marginY: '1em' }}>
                    <div>Map length: </div>
                    <Slider
                      aria-label="Map length"
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
                      aria-label="Map width"
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
                  <div>Map radius/side-length: </div>
                  <Slider
                    aria-label="Map radius"
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
            </Box>
            <MapSizeDisplay hexMap={physicalSizeMap} showDiagram />
          </Box>
          {/* TERRAIN SETS */}
          <InputSetsUsedCard isCreateNewMap />
          <MapAuthorNotesFields
            authorName={mapAuthor}
            onAuthorNameChange={handleAuthorChange}
            mapNotes={mapNotes}
            onMapNotesChange={setMapNotes}
            authorControl={
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberAuthor}
                    onChange={handleRememberAuthorChange}
                  />
                }
                label="Remember my name for new maps"
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

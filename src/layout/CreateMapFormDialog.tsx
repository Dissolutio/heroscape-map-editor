import * as React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Slider from '@mui/material/Slider';
import { Box, ListItemButton, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material'
import { genRandomMapName } from '../utils/genRandomMapName'
import { MdCreateNewFolder } from 'react-icons/md'
import useBoundStore from '../store/store'
import { useSnackbar } from 'notistack'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'

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
];
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
];


export default function CreateMapFormDialog() {
  const fullScreen = useMediaQuery('(max-width:600px)');
  const loadMap = useBoundStore((state) => state.loadMap)
  const { enqueueSnackbar } = useSnackbar()
  // dialog state
  const [open, setOpen] = React.useState(false)
  const handleClickOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }
  // new map form state
  const [mapName, setMapName] = React.useState(() => genRandomMapName());
  const [mapShape, setMapShape] = React.useState('rectangle');
  const handleChangeMapShape = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMapShape((event.target as HTMLInputElement).value);
  };
  const [mapWidth, setMapWidth] = React.useState(20);
  const [mapLength, setMapLength] = React.useState(20);
  const [mapSize, setMapSize] = React.useState(10);

  const handleSubmit = () => {
    const newMap = mapShape === 'rectangle' ? makeRectangleScenario({
      mapName,
      mapWidth,
      mapLength
      // mapShape
    }) : makeHexagonScenario({
      mapName,
      size: mapSize
      // mapShape
    })
    loadMap(newMap)
    enqueueSnackbar(`Created new map: ${newMap.hexMap.name}`)
  }

  return (
    <React.Fragment>
      {/* <Button variant="outlined" onClick={handleClickOpen}>
        Open form dialog
      </Button> */}
      <ListItemButton onClick={handleClickOpen}>
        <ListItemIcon
          sx={{
            color: 'inherit',
          }}
        >
          <MdCreateNewFolder />
        </ListItemIcon>
        <ListItemText primary={'Create New Map'} />
      </ListItemButton>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        fullWidth={!fullScreen}
        PaperProps={{
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            handleSubmit()
            handleClose()
          },
        }}
      >
        <DialogTitle>New Map</DialogTitle>
        <DialogContent>
          <Box sx={{ marginY: '1em' }}>
            <TextField
              autoFocus
              required
              value={mapName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setMapName(event.target.value);
              }}
              margin="dense"
              label="Map Title"
              type="text"
              fullWidth
              variant="outlined"
            />
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
                <div>Map Height: </div>
                <Slider
                  // size='small'
                  min={1}
                  max={30}
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
                <div>Map Width: </div>
                <Slider
                  // size='small'
                  min={1}
                  max={30}
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
            < Box sx={{ marginY: '1em' }}>
              <Slider
                // size='small'
                min={1}
                max={17}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}
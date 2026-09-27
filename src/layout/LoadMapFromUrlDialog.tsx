import { useMediaQuery } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useSnackbar } from 'notistack'
import * as React from 'react'
import { useLocation } from 'wouter'
import { ROUTES } from '../ROUTES'
import { buildupJsonFileMap } from '../data/buildupMap'
import { parseMapDataArrayFromCrushed } from '../data/jsonCrush'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'
import { inflateBoardPiecesFromIds } from '../utils/map-utils'
import {
  getViewModeFromQueryParam,
  parseMapShareUrlParams,
} from '../utils/mapShareUrl'
import { DIALOGS } from './dialogNames'

export default function LoadMapFromUrlDialog() {
  const fullScreen = useMediaQuery('(max-width:900px)')
  const [, navigate] = useLocation()
  const { enqueueSnackbar } = useSnackbar()
  const [pastedUrl, setPastedUrl] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')

  const loadMap = useBoundStore((state) => state.loadMap)
  const toggleIs2DOpen = useBoundStore((state) => state.toggleIs2DOpen)
  const toggleIsPdfOpen = useBoundStore((state) => state.toggleIsPdfOpen)
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
  const isDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.loadFromUrl

  const handleClose = () => {
    toggleCurrentDialog('')
    setPastedUrl('')
    setErrorMessage('')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { m, v } = parseMapShareUrlParams(pastedUrl)
    if (!m) {
      setErrorMessage(
        'Could not find map data ("m" parameter) in that URL. Paste a full Hexoscape share link.',
      )
      return
    }
    try {
      const { hexMap, boardPiecesEncodedArr } = parseMapDataArrayFromCrushed(m)
      const inflatedBoardPieces = inflateBoardPiecesFromIds(
        boardPiecesEncodedArr,
      )
      const jsonMap = buildupJsonFileMap(inflatedBoardPieces, hexMap)
      if (!jsonMap.hexMap.name) {
        jsonMap.hexMap.name = genRandomMapName()
      }
      loadMap(jsonMap)
      const viewMode = getViewModeFromQueryParam(v)
      toggleIsPdfOpen(viewMode === 'pdf')
      toggleIs2DOpen(viewMode === '2d')
      navigate(ROUTES.heroscapeHome)
      enqueueSnackbar({
        message: `Loaded map from URL: ${jsonMap.hexMap.name}`,
        variant: 'success',
      })
      handleClose()
      // biome-ignore lint/suspicious/noExplicitAny: <error could be anything>
    } catch (error: any) {
      setErrorMessage(error?.message ?? String(error))
    }
  }

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth={!fullScreen}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
        },
      }}
    >
      <DialogTitle>Load Map from URL</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Paste a Hexoscape share link — from the website or the desktop app —
          to load that map.
        </DialogContentText>
        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={3}
          margin="dense"
          label="Hexoscape Map URL"
          value={pastedUrl}
          onChange={(event) => {
            setPastedUrl(event.target.value)
            setErrorMessage('')
          }}
          error={!!errorMessage}
          helperText={errorMessage || ' '}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          Load Map
        </Button>
      </DialogActions>
    </Dialog>
  )
}

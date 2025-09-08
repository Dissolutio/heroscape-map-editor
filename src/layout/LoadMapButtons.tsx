import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import React, { type ChangeEvent } from 'react'
import { MdFolderZip, MdOutlineHexagon } from 'react-icons/md'
import { useLocation } from 'wouter'
import { ROUTES } from '../ROUTES'
import buildupVSFileMap, { buildupJsonFileMap } from '../data/buildupMap'
import readVirtualscapeMapFile, {
  readGzipMapFile,
} from '../data/readVirtualscapeMapFile'
import useBoundStore from '../store/store'
import type { MapFileState } from '../types'

const uploadElementID = 'upload'
const jsonUploadElementID = 'jsonupload'
const virtualScapeUploadElementID = 'vsupload'

export const useLoadMapButtons = () => {
  const handleClickGzipFileSelect = () => {
    const element = document.getElementById(uploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickJsonFileSelect = () => {
    const element = document.getElementById(jsonUploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickVSFileSelect = async () => {
    const element = document.getElementById(virtualScapeUploadElementID)
    if (element) {
      element.click()
    }
  }

  return {
    handleClickGzipFileSelect,
    handleClickJsonFileSelect,
    handleClickVSFileSelect,
  }
}

const LoadMapButtons = () => {
  const handleClickGzipFileSelect = () => {
    const element = document.getElementById(uploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickJsonFileSelect = () => {
    const element = document.getElementById(jsonUploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickVSFileSelect = async () => {
    const element = document.getElementById(virtualScapeUploadElementID)
    if (element) {
      element.click()
    }
  }

  return (
    <>
      <ListItemButton sx={{ pl: 4 }} onClick={handleClickGzipFileSelect}>
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Load file (.gz)" />
      </ListItemButton>
      <ListItemButton sx={{ pl: 4 }} onClick={handleClickJsonFileSelect}>
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Load file (.json)" />
      </ListItemButton>
      <ListItemButton sx={{ pl: 4 }} onClick={handleClickVSFileSelect}>
        <ListItemIcon>
          <MdOutlineHexagon />
        </ListItemIcon>
        <ListItemText primary="Load Virtualscape file (.hsc)" />
      </ListItemButton>
    </>
  )
}

export const LoadMapInputs = () => {
  const loadMap = useBoundStore((state) => state.loadMap)
  // const { clear } = useBoundStore.temporal.getState()
  const [, navigate] = useLocation()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const closeSnackbarIDAction: SnackbarAction = (snackbarId: SnackbarKey) => (
    <>
      {/* <button onClick={() => { alert(`I belong to snackbar with id ${snackbarId}`); }}>
        Undo
      </button> */}
      <button
        type='button'
        onClick={() => {
          closeSnackbar(snackbarId)
        }}
      >
        Dismiss
      </button>
    </>
  )
  const readGzipFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }
    try {
      const data = await readGzipMapFile(file)
      const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
      if (!jsonMap.hexMap.name) {
        jsonMap.hexMap.name = file.name
      }
      loadMap(jsonMap)
      enqueueSnackbar({
        message: `Loaded map: ${jsonMap.hexMap.name}`,
        variant: 'success',
        autoHideDuration: 3000,
      })
      navigate(ROUTES.heroscapeHome)
      // clear() // clear undo history, initial load should not be undoable
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading json map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }

  const readJsonFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }
    try {
      const data: MapFileState = await new Response(file).json()
      const jsonMap = buildupJsonFileMap(data.boardPieces, data.hexMap)
      if (!jsonMap.hexMap.name) {
        jsonMap.hexMap.name = file.name
      }
      loadMap(jsonMap)
      enqueueSnackbar({
        message: `Loaded map: ${jsonMap.hexMap.name}`,
        variant: 'success',
        autoHideDuration: 3000,
      })
      navigate(ROUTES.heroscapeHome)
      // clear() // clear undo history, initial load should not be undoable
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading json map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }
  const readVSFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }

    try {
      const vsMap = await readVirtualscapeMapFile(file)
      const loadedMap = buildupVSFileMap(vsMap.tiles, vsMap.name || file.name)
      loadMap(loadedMap)
      enqueueSnackbar({
        message: `Loaded map: ${loadedMap.hexMap.name}`,
        variant: 'success',
        autoHideDuration: 3000,
      })
      navigate(ROUTES.heroscapeHome)
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error)
      enqueueSnackbar({
        message: `Error loading virtualscape map: ${errorMessage}`,
        variant: 'error',
        action: closeSnackbarIDAction,
      })
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }
  return (
    <>
      <input
        id={uploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".gz"
        onChange={readGzipFile}
      />
      <input
        id={jsonUploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".json"
        onChange={readJsonFile}
      />
      <input
        id={virtualScapeUploadElementID}
        type="file"
        style={hiddenStyle}
        accept=".hsc"
        onChange={readVSFile}
      />
    </>
  )
}

export default LoadMapButtons

const hiddenStyle = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1',
  overflow: 'hidden',
  position: 'absolute' as const,
  bottom: '0',
  left: '0',
  whiteSpace: 'nowrap',
  width: '1',
}

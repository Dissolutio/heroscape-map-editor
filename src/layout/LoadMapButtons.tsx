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
import { jsonUploadElementID, uploadElementID, virtualScapeUploadElementID } from './LoadFileHiddenInputs'

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


export default LoadMapButtons

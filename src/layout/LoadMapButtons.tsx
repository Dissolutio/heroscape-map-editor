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
import {
  jsonUploadElementID,
  uploadElementID,
  virtualScapeUploadElementID,
} from './LoadFileHiddenInputs'
import { ControlTabsListItemButton, ControlTabsListItemText } from '../controls/ControlTabsListItemButton'

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
      <ControlTabsListItemButton
        primary="Load file (.json)"
        onClick={handleClickJsonFileSelect}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        primary="Load file (.gz)"
        onClick={handleClickGzipFileSelect}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        primary="Load Virtualscape file (.hsc)"
        onClick={handleClickVSFileSelect}
        icon={<MdOutlineHexagon />}
      />
    </>
  )
}

export default LoadMapButtons

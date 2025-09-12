import { Box, ClickAwayListener, Collapse, List } from '@mui/material'
import JSONCrush from 'jsoncrush'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import React from 'react'
import { FcAddImage, FcDownload, FcLink, FcUpload } from 'react-icons/fc'
import { MdExpandLess, MdExpandMore, MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import DownloadMapFileButtons from '../layout/DownloadMapFileButtons'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import { DIALOGS } from '../layout/dialogNames'
import { LoadMapButtons } from '../layout/LoadMapButtons'

export const FileControlsTab = () => {
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const mapPortraitBase64 = useBoundStore((s) => s.mapPortraitBase64)
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false)
  const [isDownloadPhotoOpen, setIsDownloadPhotoOpen] = React.useState(false)
  const isNewMapDialogOpen =
    useBoundStore((state) => state.currentDialog) === DIALOGS.newMap
  // const toggleIsPieceInventoryDialogOpen = useBoundStore(
  //   (state) => state.toggleIsPieceInventoryDialogOpen,
  // )
  const handleClickUploadMap = (e: React.MouseEvent<HTMLDivElement> | undefined) => {
    e?.stopPropagation()
    setIsUploadOpen(!isUploadOpen)
  }
  const handleClickDownload = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsDownloadOpen(!isDownloadOpen)
  }
  const handleDownloadPng = () => {
    const link = document.createElement('a')
    link.download = `${hexMap.name}.png`
    link.href = mapPortraitBase64
    // document.body.appendChild(link)
    link.click()
    // document.body.removeChild(link)
  }
  const handleDownloadJpg = () => {
    const link = document.createElement('a')
    link.download = `${hexMap.name}.jpg`
    link.href = mapPortraitBase64
    // document.body.appendChild(link)
    link.click()
    // document.body.removeChild(link)
  }
  // const handleClickUploadPersonalInventoryTsv = (e: React.MouseEvent<HTMLDivElement> | undefined) => {
  //   e?.stopPropagation()
  //   const element = document.getElementById(personalInventoryTsvUploadElementID)
  //   if (element) {
  //     element.click()
  //   }
  // }
  const onClickCopy = async () => {
    const myUrl = encodeURI(
      JSONCrush.crush(
        JSON.stringify([
          hexMap, // 1
          ...Object.keys(boardPieces),
        ]),
      ),
    )
    const fullUrl = `${window.location.origin + window.location.pathname}?m=${myUrl}`
    if (fullUrl.length > 2082) {
      enqueueSnackbar({
        message:
          'Map is too large to be stored in a URL. You can try downloading your map as a file and sharing the file.',
        variant: 'error',
        autoHideDuration: 3000,
      })
      return
    }
    try {
      await navigator.clipboard.writeText(fullUrl)
      enqueueSnackbar({
        message: 'Copied shareable map URL to clipboard!',
        variant: 'success',
        autoHideDuration: 3000,
      })
    } catch (err) {
      console.log('Attempted clipboard write, failed:', err)
      const action: SnackbarAction = (snackbarId: SnackbarKey) => (
        <>
          <button
            type="button"
            onClick={() => {
              closeSnackbar(snackbarId)
            }}
          >
            Dismiss
          </button>
        </>
      )
      enqueueSnackbar({
        message: 'Failed to copy url to clipboard',
        // message: `${err?.message ?? ''}`,
        variant: 'error',
        // autoHideDuration: 30000,
        action: action,
      })
    }
  }
  const handleClickDownloadPhoto = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsDownloadPhotoOpen(!isDownloadPhotoOpen)
  }
  const handleClickAway = () => {
    setIsUploadOpen(false)
    setIsDownloadOpen(false)
    setIsDownloadPhotoOpen(false)
  }
  return (
    <Box role="presentation" onClick={handleClickAway}>
      <ClickAwayListener onClickAway={handleClickAway}>
        <List>
          {/* OPEN EDIT MY PIECE INVENTORY DIALOG */}
          {/* <ListItemButton
              onClick={() => toggleIsPieceInventoryDialogOpen(true)}
            >
              <ListItemIcon>
                <FcRules />
              </ListItemIcon>
              <ListItemText primary={'Edit My Piece Inventory'} />
            </ListItemButton> */}

          {/* COPY URL */}
          <ControlTabsListItemButton
            primary="Copy Shareable URL"
            onClick={onClickCopy}
            icon={<FcLink />}
          />

          {/* EXPAND DOWNLAD MAP FILE BTNS */}
          <ControlTabsListItemButton
            primary="Download Map File"
            onClick={handleClickDownload}
            icon={<FcDownload />}
            endIcon={isDownloadOpen ? <MdExpandLess /> : <MdExpandMore />}
          />
          <Collapse in={isDownloadOpen} timeout="auto">
            <List component="div">
              <DownloadMapFileButtons />
            </List>
          </Collapse>

          {/* EXPAND DOWNLAD MAP PHOTO BTNS */}
          <ControlTabsListItemButton
            primary="Download Map Picture"
            onClick={handleClickDownloadPhoto}
            icon={<FcDownload />}
            endIcon={isDownloadOpen ? <MdExpandLess /> : <MdExpandMore />}
          />
          <Collapse in={isDownloadPhotoOpen} timeout="auto">
            <List component="div">
              <ControlTabsListItemButton
                primary="Download map picture as .JPG"
                onClick={handleDownloadJpg}
                icon={<MdFolderZip />}
              />
              <ControlTabsListItemButton
                primary="Download map picture as .PNG"
                onClick={handleDownloadPng}
                icon={<MdFolderZip />}
              />
            </List>
          </Collapse>

          {/* OPEN CREATE MAP DIALOG */}
          <ControlTabsListItemButton
            primary={'Create New Map'}
            onClick={() => toggleIsNewMapDialogOpen(!isNewMapDialogOpen)}
            icon={<FcAddImage />}
          />

          {/* EXPAND LOAD MAP BTNS */}
          <ControlTabsListItemButton
            primary="Load Map"
            onClick={handleClickUploadMap}
            icon={<FcUpload />}
            endIcon={isUploadOpen ? <MdExpandLess /> : <MdExpandMore />}
          />
          <Collapse in={isUploadOpen} timeout="auto">
            <List component="div">
              <LoadMapButtons />
            </List>
          </Collapse>
        </List>
      </ClickAwayListener>
    </Box>
  )
}

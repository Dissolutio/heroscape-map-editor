import {
  Box,
  ClickAwayListener,
  Collapse,
  Divider,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import JSONCrush from 'jsoncrush'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import React, { type ChangeEvent } from 'react'
import {
  FcAddImage,
  FcDownload,
  FcLink,
  FcRules,
  FcUpload,
  FcVlc,
} from 'react-icons/fc'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import useBoundStore from '../store/store'
import DownloadMapFileButtons from '../layout/DownloadMapFileButtons'
import { LoadFileHiddenInputs } from '../layout/LoadFileHiddenInputs'
import LoadMapButtons from '../layout/LoadMapButtons'

export const FileControlsTab = () => {
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false)
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const isNewMapDialogOpen = useBoundStore((state) => state.isNewMapDialogOpen)
  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const toggleIsPieceInventoryDialogOpen = useBoundStore(
    (state) => state.toggleIsPieceInventoryDialogOpen,
  )
  const handleClick = (e: React.MouseEvent<HTMLDivElement> | undefined) => {
    e?.stopPropagation()
    setIsUploadOpen(!isUploadOpen)
  }
  const handleClickDownload = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsDownloadOpen(!isDownloadOpen)
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
          {/* <button onClick={() => { alert(`I belong to snackbar with id ${snackbarId}`); }}>
            Undo
          </button> */}
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
        message: `Failed to copy url to clipboard, here it is: ${fullUrl}`,
        variant: 'error',
        autoHideDuration: 30000,
        action: action,
      })
    }
  }
  const handleClickAway = () => {
    setIsUploadOpen(false)
    setIsDownloadOpen(false)
  }
  return (
    <Box
      sx={{ width: 350, height: '100%' }}
      role="presentation"
      onClick={() => {
        setIsDownloadOpen(false)
        setIsUploadOpen(false)
      }}
    >
      <ClickAwayListener onClickAway={handleClickAway}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 0,
            // overflow: 'hidden'
          }}
        >
          <List>
            {/* OPEN EDIT MAP DETAILS DIALOG */}
            <ListItemButton onClick={() => toggleIsEditMapDialogOpen(true)}>
              <ListItemIcon>
                <FcVlc />
              </ListItemIcon>
              <ListItemText primary={'Edit Map Details'} />
            </ListItemButton>

            {/* OPEN EDIT MY PIECE INVENTORY DIALOG */}
            <ListItemButton
              onClick={() => toggleIsPieceInventoryDialogOpen(true)}
            >
              <ListItemIcon>
                <FcRules />
              </ListItemIcon>
              <ListItemText primary={'Edit My Piece Inventory'} />
            </ListItemButton>

            {/* COPY URL */}
            <ListItemButton onClick={onClickCopy}>
              <ListItemIcon>
                <FcLink />
              </ListItemIcon>
              <ListItemText primary="Copy Shareable URL" />
            </ListItemButton>

            {/* EXPAND DOWNLAD MAP FILE BTNS */}
            <ListItemButton onClick={handleClickDownload}>
              <ListItemIcon>
                <FcDownload />
              </ListItemIcon>
              <ListItemText primary="Download Map File" />
              {isDownloadOpen ? <MdExpandLess /> : <MdExpandMore />}
            </ListItemButton>
            <Collapse in={isDownloadOpen} timeout="auto">
              <List component="div">
                <DownloadMapFileButtons />
              </List>
            </Collapse>
            {/* OPEN CREATE MAP DIALOG */}
            <ListItemButton
              onClick={() => toggleIsNewMapDialogOpen(!isNewMapDialogOpen)}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                }}
              >
                <FcAddImage />
              </ListItemIcon>
              <ListItemText primary={'Create New Map'} />
            </ListItemButton>

            {/* EXPAND LOAD MAP BTNS */}
            <ListItemButton onClick={handleClick}>
              <ListItemIcon>
                <FcUpload />
              </ListItemIcon>
              <ListItemText primary="Load Map" />
              {isUploadOpen ? <MdExpandLess /> : <MdExpandMore />}
            </ListItemButton>
            <Collapse in={isUploadOpen} timeout="auto">
              <List component="div">
                <LoadMapButtons />
              </List>
            </Collapse>
          </List>
        </div>
      </ClickAwayListener>
    </Box>
  )
}

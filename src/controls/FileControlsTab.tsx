import { Box, ClickAwayListener, Collapse, List } from '@mui/material'
import JSONCrush from 'jsoncrush'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import React from 'react'
import { FcAddImage, FcDownload, FcLink, FcUpload } from 'react-icons/fc'
import { MdExpandLess, MdExpandMore, MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import { getBoardPiecesMaxLevel } from '../utils/map-utils'
import DownloadMapFileButtons from '../layout/DownloadMapFileButtons'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import { DIALOGS } from '../layout/dialogNames'
import { LoadMapButtons } from '../layout/LoadMapButtons'
import { getUrlMapString } from '../data/jsonCrush'
import { LoadFileHiddenInputs } from '../layout/LoadFileHiddenInputs'

export const FileControlsTab = ({
  is2DOpen,
}: {
  is2DOpen: boolean
}) => {
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const mapPortraitBase64 = hexMap?.mapPortraitBase64 ?? ''
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
  const handleClickUploadMap = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsUploadOpen(!isUploadOpen)
  }
  const handleClickDownload = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsDownloadOpen(!isDownloadOpen)
  }
  const handleDownloadCurrent2DSvg = () => {
    const svgElement = document.getElementById('2d-svg-view') // Replace 'your-svg-id' with the actual ID
    if (svgElement) {
      const svgContent = svgElement.outerHTML
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.download = `${hexMap.name}-level-${viewingLevel}.svg`
      link.href = URL.createObjectURL(blob)
      // document.body.appendChild(link)
      link.click()
      // document.body.removeChild(link)
      URL.revokeObjectURL(link.href) // Clean up the Blob URL
    }
  }
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false)

  const toggleViewingLevel = useBoundStore((s) => s.toggleViewingLevel)
  const toggleIs2DOverlayLevelEnabled = useBoundStore(
    (s) => s.toggleIs2DOverlayLevelEnabled,
  )

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms)
    })

  const handleDownloadAll2DSvgs = async () => {
    if (!hexMap) return
    setIsDownloadingAll(true)
    const maxLevel = getBoardPiecesMaxLevel(boardPieces)
    const overlayLevel = maxLevel + 1

    // save current state to restore later
    const prevViewingLevel = viewingLevel
    const prevOverlayEnabled = useBoundStore.getState().is2DOverlayLevelEnabled

    try {
      // ensure overlay rendering logic is enabled so overlay pieces render only on the overlay level
      toggleIs2DOverlayLevelEnabled(true)

      for (let level = 1; level <= overlayLevel; level++) {
        // set viewing level
        toggleViewingLevel(level)
        // wait for DOM to update
        // small delay to allow React to re-render the SVG
        // 100ms should be sufficient in most cases
        // eslint-disable-next-line no-await-in-loop
        await sleep(500)

        const svgElement = document.getElementById('2d-svg-view')
        if (svgElement) {
          const svgContent = svgElement.outerHTML
          const blob = new Blob([svgContent], { type: 'image/svg+xml' })
          const link = document.createElement('a')
          link.download = `${hexMap.name}-level-${level === overlayLevel ? 'overlay' : level}.svg`
          link.href = URL.createObjectURL(blob)
          link.click()
          URL.revokeObjectURL(link.href)
        }
      }
    } catch (err) {
      console.error('Failed to download all SVGs', err)
      enqueueSnackbar({
        message: 'Failed to download all SVGs',
        variant: 'error',
      })
    } finally {
      // restore previous state
      toggleViewingLevel(prevViewingLevel)
      toggleIs2DOverlayLevelEnabled(prevOverlayEnabled)
      setIsDownloadingAll(false)
    }
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
    const hexMapToUse = { ...hexMap, mapPortraitBase64: '', mapNotes: '' }
    const myUrl = getUrlMapString({
      hexMap: hexMapToUse,
      boardPieces,
    })
    // encodeURI(
    //   JSONCrush.crush(
    //     JSON.stringify([
    //       hexMapToUse, // 1
    //       ...boardPieces,
    //     ]),
    //   ),
    // )
    const fullUrl = `${window.location.origin + window.location.pathname}?m=${myUrl}`
    if (fullUrl.length > 2082) {
      enqueueSnackbar({
        message:
          'Map is too large to be stored in a URL. You can try downloading your map as a file and sharing the file.',
        variant: 'error',
      })
      return
    }
    try {
      await navigator.clipboard.writeText(fullUrl)
      enqueueSnackbar({
        message: 'Copied shareable map URL to clipboard!',
        variant: 'success',
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

          {/* OPEN CREATE MAP DIALOG */}
          <ControlTabsListItemButton
            primary={'Create New Map'}
            onClick={() => toggleIsNewMapDialogOpen(!isNewMapDialogOpen)}
            icon={<FcAddImage />}
          />

          {/* COPY URL */}
          <ControlTabsListItemButton
            primary="Copy Shareable URL"
            onClick={onClickCopy}
            icon={<FcLink />}
          />

          {/* DOWNLOAD 2D-MODE SVG IMAGE */}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download Current 2D Level as SVG"
              onClick={handleDownloadCurrent2DSvg}
              icon={<FcDownload />}
            />
          )}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download All 2D Levels as SVG"
              onClick={handleDownloadAll2DSvgs}
              icon={<MdFolderZip />}
              disabled={isDownloadingAll}
            />
          )}

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
            disabled={!hexMap.mapPortraitBase64}
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
        {/* HIDDEN FILE INPUTS */}
      </ClickAwayListener>
      <LoadFileHiddenInputs />
    </Box>
  )
}

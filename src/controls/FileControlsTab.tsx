import { Box, ClickAwayListener, Collapse, List } from '@mui/material'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import React from 'react'
import { FaDiscord, FaSlack } from 'react-icons/fa'
import { FcAddImage, FcDownload, FcLink, FcUpload } from 'react-icons/fc'
import { MdExpandLess, MdExpandMore, MdFolderZip } from 'react-icons/md'
import { getUrlMapString } from '../data/jsonCrush'
import { piecesSoFar } from '../data/pieces'
import DownloadMapFileButtons from '../layout/DownloadMapFileButtons'
import { LoadFileHiddenInputs } from '../layout/LoadFileHiddenInputs'
import { LoadMapButtons } from '../layout/LoadMapButtons'
import { DIALOGS } from '../layout/dialogNames'
import { isDesktop } from '../platform'
import useBoundStore from '../store/store'
import {
  downloadBlob,
  downloadSvgString,
  serializeSvgWithEmbeddedFont,
} from '../svg-map/exportSvg'
import {
  combineSvgExportPages,
  renderSvgExportPage,
  zipSvgExportPages,
} from '../svg-map/renderSvgExport'
import { getCycleableLevels, getOverlayLevel } from '../utils/map-utils'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'

export const FileControlsTab = ({
  is2DOpen,
}: {
  is2DOpen: boolean
}) => {
  const hexMap = useBoundStore((s) => s.hexMap)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const viewingLevel = useBoundStore((s) => s.viewingLevel)
  const isShow2DExportLevelLogo = useBoundStore(
    (s) => s.isShow2DExportLevelLogo,
  )
  const mapPortraitBase64 = hexMap?.mapPortraitBase64 ?? ''
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const openCropMapPortraitDialog = useBoundStore(
    (state) => state.openCropMapPortraitDialog,
  )
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false)
  const [isDownloadPhotoOpen, setIsDownloadPhotoOpen] = React.useState(false)
  const [isShareOpen, setIsShareOpen] = React.useState(false)
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
  const handleDownloadCurrent2DSvg = async () => {
    const svgElement = document.getElementById('2d-svg-view')
    // we place the overlay level as one whole level above the last piece
    const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
    const isOverlayLevel = viewingLevel === overlayLevel
    const isLegendLevel =
      useBoundStore.getState().isShowPdfPieceLegend &&
      viewingLevel === overlayLevel + 1
    if (svgElement instanceof SVGSVGElement) {
      const svgContent = await serializeSvgWithEmbeddedFont(
        svgElement,
        isShow2DExportLevelLogo && !isLegendLevel && !isOverlayLevel
          ? viewingLevel
          : undefined,
      )
      downloadSvgString(
        isLegendLevel
          ? `${hexMap.name}-legend.svg`
          : `${hexMap.name}-level-${isOverlayLevel ? 'overlay' : viewingLevel}.svg`,
        svgContent,
      )
    }
  }
  const [isExportingSvg, setIsExportingSvg] = React.useState(false)
  const overlayLevel = getOverlayLevel(boardPieces, boardHexes)
  const hasOverlayContent =
    boardPieces.some(
      (piece) => piecesSoFar[piece.inventoryID]?.isOverlayPiece,
    ) || (hexMap.objectiveMarkers?.length ?? 0) > 0
  const levelsToExport = getCycleableLevels(boardPieces, boardHexes).filter(
    (level) => level >= 1 && level < overlayLevel,
  )
  const sanitizedMapName = [...hexMap.name.trim()]
    .map((character) => {
      const code = character.charCodeAt(0)
      return /[\\/:*?"<>|]/.test(character) || code < 32 ? '-' : character
    })
    .join('')
  const mapFolderName =
    sanitizedMapName && sanitizedMapName !== '.' && sanitizedMapName !== '..'
      ? sanitizedMapName
      : 'Map'
  const renderWholeMapPages = async () => {
    const pages = []
    for (const [index, level] of levelsToExport.entries()) {
      pages.push({
        id: `level-${String(level).replace('.', '-')}`,
        filename: `${String(index + 1).padStart(2, '0')}-level-${level}.svg`,
        content: await renderSvgExportPage({
          viewingLevel: level,
          logoLevel: isShow2DExportLevelLogo ? level : undefined,
        }),
      })
    }
    if (hasOverlayContent) {
      pages.push({
        id: 'overlay',
        filename: '99-overlay.svg',
        content: await renderSvgExportPage({ viewingLevel: overlayLevel }),
      })
    }
    if (boardPieces.length) {
      pages.push({
        id: 'legend',
        filename: 'legend.svg',
        content: await renderSvgExportPage({ legendOnly: true }),
      })
    }
    if (!pages.length) {
      pages.push({
        id: 'level-0',
        filename: '01-level-0.svg',
        content: await renderSvgExportPage({ viewingLevel: 0 }),
      })
    }
    return pages
  }
  const handleDownloadLegend = async () => {
    if (!hexMap || !boardPieces.length) return
    setIsExportingSvg(true)
    try {
      const svgContent = await renderSvgExportPage({ legendOnly: true })
      downloadSvgString(`${mapFolderName}-legend.svg`, svgContent)
    } catch (err) {
      console.error('Failed to download SVG legend', err)
      enqueueSnackbar({
        message: 'Failed to download SVG legend',
        variant: 'error',
      })
    } finally {
      setIsExportingSvg(false)
    }
  }
  const handleDownloadWholeMapZip = async () => {
    if (!hexMap) return
    setIsExportingSvg(true)
    try {
      const pages = await renderWholeMapPages()
      const zipBytes = zipSvgExportPages(
        pages.map(({ filename, content }) => ({
          path: `${mapFolderName}/${filename}`,
          content,
        })),
      )
      downloadBlob(
        `${mapFolderName}.zip`,
        new Blob([zipBytes as BlobPart], { type: 'application/zip' }),
      )
    } catch (err) {
      console.error('Failed to download whole map SVG ZIP', err)
      enqueueSnackbar({
        message: 'Failed to download whole map SVG ZIP',
        variant: 'error',
      })
    } finally {
      setIsExportingSvg(false)
    }
  }
  const handleDownloadWholeMapSvg = async () => {
    if (!hexMap) return
    setIsExportingSvg(true)
    try {
      const pages = await renderWholeMapPages()
      const svgContent = combineSvgExportPages(pages)
      downloadSvgString(`${mapFolderName}.svg`, svgContent)
    } catch (err) {
      console.error('Failed to download whole map SVG', err)
      enqueueSnackbar({
        message: 'Failed to download whole map SVG',
        variant: 'error',
      })
    } finally {
      setIsExportingSvg(false)
    }
  }
  const handleDownloadPng = async () => {
    try {
      const image = new Image()
      image.src = mapPortraitBase64
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not create a download canvas')
      context.drawImage(image, 0, 0)
      const link = document.createElement('a')
      link.download = `${hexMap.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download map portrait as PNG', error)
      enqueueSnackbar({
        message: 'Could not download the map portrait as PNG.',
        variant: 'error',
      })
    }
  }
  const handleDownloadJpg = async () => {
    try {
      const image = new Image()
      image.src = mapPortraitBase64
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not create a download canvas')
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)
      const link = document.createElement('a')
      link.download = `${hexMap.name}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.92)
      link.click()
    } catch (error) {
      console.error('Failed to download map portrait as JPG', error)
      enqueueSnackbar({
        message: 'Could not download the map portrait as JPG.',
        variant: 'error',
      })
    }
  }
  // const handleClickUploadPersonalInventoryTsv = (e: React.MouseEvent<HTMLDivElement> | undefined) => {
  //   e?.stopPropagation()
  //   const element = document.getElementById(personalInventoryTsvUploadElementID)
  //   if (element) {
  //     element.click()
  //   }
  // }
  const buildShareUrl = (viewMode?: 'a' | 'b') => {
    const myUrl = getUrlMapString({
      hexMap: hexMap,
      boardPieces: boardPieces,
    })
    const viewModeParam = viewMode ? `&v=${viewMode}` : ''
    return `${window.location.origin + window.location.pathname}?m=${myUrl}${viewModeParam}`
  }
  const handleShareError = (err: unknown) => {
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
      message: 'Failed to copy to clipboard',
      variant: 'error',
      action: action,
    })
  }
  const onClickCopy = async () => {
    const fullUrl = buildShareUrl()
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
      handleShareError(err)
    }
  }
  const buildShareMarkdownLink = (fullUrl: string, labelSuffix?: string) => {
    const label = `${hexMap.name || 'Map'}${
      hexMap.author ? ` by ${hexMap.author}` : ''
    }${labelSuffix ?? ''}`
    return `[${label}](${fullUrl})`
  }
  const onClickCopyMarkdownLink = async () => {
    const fullUrl = buildShareUrl()
    if (fullUrl.length > 2082) {
      enqueueSnackbar({
        message:
          'Map is too large to be stored in a URL. You can try downloading your map as a file and sharing the file.',
        variant: 'error',
      })
      return
    }
    const markdownLink = buildShareMarkdownLink(fullUrl)
    try {
      await navigator.clipboard.writeText(markdownLink)
      enqueueSnackbar({
        message: 'Copied markdown link to clipboard!',
        variant: 'success',
      })
    } catch (err) {
      handleShareError(err)
    }
  }
  const onClickCopyBuildInstructionsMarkdownLink = async () => {
    const fullUrl = buildShareUrl('a')
    if (fullUrl.length > 2082) {
      enqueueSnackbar({
        message:
          'Map is too large to be stored in a URL. You can try downloading your map as a file and sharing the file.',
        variant: 'error',
      })
      return
    }
    const markdownLink = buildShareMarkdownLink(
      fullUrl,
      ' (Build Instructions)',
    )
    try {
      await navigator.clipboard.writeText(markdownLink)
      enqueueSnackbar({
        message: 'Copied build instructions markdown link to clipboard!',
        variant: 'success',
      })
    } catch (err) {
      handleShareError(err)
    }
  }
  const onClickCopyBuildInstructionsLink = async () => {
    const fullUrl = buildShareUrl('a')
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
        message: 'Copied shareable build instructions URL to clipboard!',
        variant: 'success',
      })
    } catch (err) {
      handleShareError(err)
    }
  }
  const handleClickShare = (
    e: React.MouseEvent<HTMLDivElement> | undefined,
  ) => {
    e?.stopPropagation()
    setIsShareOpen(!isShareOpen)
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
    setIsShareOpen(false)
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

          {/* SHARE URL */}
          <ControlTabsListItemButton
            primary={isDesktop ? 'Share Map URL on the Web' : 'Share Map URL'}
            onClick={handleClickShare}
            icon={<FcLink />}
            endIcon={isShareOpen ? <MdExpandLess /> : <MdExpandMore />}
          />
          <Collapse in={isShareOpen} timeout="auto">
            <List component="div">
              <ControlTabsListItemButton
                primary="Copy URL"
                title="Copies a plain link to this map that you can paste anywhere — in a browser, chat, or email."
                onClick={onClickCopy}
                icon={<FcLink />}
              />
              <ControlTabsListItemButton
                primary="Copy as Markdown Link"
                title="Copies a formatted link (e.g. for Slack or Discord) that shows the map name instead of a raw URL."
                onClick={onClickCopyMarkdownLink}
                icon={<FcLink />}
                endIcon={
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <FaDiscord />
                    <FaSlack />
                  </Box>
                }
              />
              <ControlTabsListItemButton
                primary="Copy Build Instructions URL"
                title="Copies a link that opens this map directly in the build instructions (PDF) view."
                onClick={onClickCopyBuildInstructionsLink}
                icon={<FcLink />}
              />
              <ControlTabsListItemButton
                primary="Copy Build Instructions as Markdown Link"
                title="Copies a formatted link (e.g. for Slack or Discord) that opens this map directly in the build instructions (PDF) view."
                onClick={onClickCopyBuildInstructionsMarkdownLink}
                icon={<FcLink />}
                endIcon={
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <FaDiscord />
                    <FaSlack />
                  </Box>
                }
              />
            </List>
          </Collapse>

          {/* DOWNLOAD 2D-MODE SVG IMAGE */}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download this level (SVG)"
              onClick={handleDownloadCurrent2DSvg}
              icon={<FcDownload />}
            />
          )}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download Legend (SVG)"
              onClick={handleDownloadLegend}
              icon={<FcDownload />}
              disabled={!boardPieces.length || isExportingSvg}
            />
          )}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download whole map (.zip)"
              onClick={handleDownloadWholeMapZip}
              icon={<MdFolderZip />}
              disabled={isExportingSvg}
            />
          )}
          {is2DOpen && (
            <ControlTabsListItemButton
              primary="Download whole map (one SVG)"
              onClick={handleDownloadWholeMapSvg}
              icon={<FcDownload />}
              disabled={isExportingSvg}
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
              {mapPortraitBase64 && (
                <ControlTabsListItemButton
                  primary="Crop picture"
                  onClick={() => openCropMapPortraitDialog()}
                  icon={<FcAddImage />}
                />
              )}
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

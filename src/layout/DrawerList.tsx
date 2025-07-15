import {
  Box,
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
import { useSnackbar } from 'notistack'
import { parse } from 'papaparse'
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
import { piecesSoFar } from '../data/pieces'
import { useLocalPieceInventory } from '../local-storage/useLocalPieceInventory'
import useBoundStore from '../store/store'
import type { PieceInventory } from '../types'
import DownloadMapFileButtons from './DownloadMapFileButtons'
import LoadMapButtons from './LoadMapButtons'
import { hiddenStyle } from './hiddenStyle'

export const DrawerList = ({
  toggleIsNavOpen,
}: {
  toggleIsNavOpen: (arg0: boolean) => void
}) => {
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
  const personalInventoryTsvUploadElementID = 'tsvinventoryupload'
  const inventory = useLocalPieceInventory()
  const handleClick = (e: any) => {
    e?.stopPropagation()
    setIsUploadOpen(!isUploadOpen)
  }
  const handleClickDownload = (e: any) => {
    e?.stopPropagation()
    setIsDownloadOpen(!isDownloadOpen)
  }
  const handleClickUploadPersonalInventoryTsv = (e: any) => {
    e?.stopPropagation()
    const element = document.getElementById(personalInventoryTsvUploadElementID)
    if (element) {
      element.click()
    }
  }
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
      const action: any = (snackbarId: string) => (
        <>
          {/* <button onClick={() => { alert(`I belong to snackbar with id ${snackbarId}`); }}>
            Undo
          </button> */}
          <button
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
  const readPersonalInventoryTsvFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file: File | undefined = event?.target?.files?.[0]

    if (!file) {
      return
    }

    try {
      parse<Record<string, string>>(file, {
        delimiter: '\t',
        header: true,
        complete: (results) => {
          const newPieceInventory: PieceInventory = {}
          results.data.forEach((datum) => {
            console.log('🚀 ~ results.data.forEach ~ datum:', datum)
            if (datum.ID && piecesSoFar[datum.ID]) {
              newPieceInventory[datum.ID] = Number.parseInt(datum.Count)
            }
          })
          inventory.setPieceInventory(newPieceInventory)
          console.log(
            '🚀 ~ readPersonalInventoryTsvFile ~ inventory:',
            inventory.pieceInventory,
          )
        },
        error: (err) => {
          console.error(err)
        },
      })
    } catch (error: any) {
      console.error(error)
    }
    event.target.value = '' // Reset the input value, otherwise choosing same file again will do nothing
  }

  return (
    <Box
      sx={{ width: 350, height: '100%' }}
      role="presentation"
      onClick={() => {
        setIsDownloadOpen(false)
        setIsUploadOpen(false)
        toggleIsNavOpen(false)
      }}
    >
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
          <Typography
            sx={{
              fontSize: '1.8em',
              textAlign: 'center',
              marginY: '20px',
              wordBreak: 'break-all',
            }}
            variant="h1"
          >
            {hexMap.name}
          </Typography>
          <Divider />
          {/* OPEN EDIT MAP DETAILS DIALOG */}
          <ListItemButton onClick={() => toggleIsEditMapDialogOpen(true)}>
            <ListItemIcon>
              <FcVlc />
            </ListItemIcon>
            <ListItemText primary={'Edit Map Details'} />
          </ListItemButton>
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

        <input
          id={personalInventoryTsvUploadElementID}
          type="file"
          style={hiddenStyle}
          accept=".tsv"
          onChange={readPersonalInventoryTsvFile}
        />

        <div>
          <Divider />
          <Typography
            variant={'subtitle1'}
            paddingX={2}
            paddingY={1}
            align={'center'}
          >
            This app is a work in progress.
          </Typography>
          <Typography
            variant={'subtitle1'}
            paddingX={2}
            paddingY={1}
            align={'center'}
          >
            Under construction in Austin, Texas
          </Typography>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-evenly',
              marginBottom: '1rem',
            }}
          >
            <Link
              title="contact@hexoscape.com"
              href={'mailto:contact@hexoscape.com'}
              underline="hover"
              sx={{
                fontSize: '1rem',
              }}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </Box>
  )
}

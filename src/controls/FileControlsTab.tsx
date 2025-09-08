import { SplitButton, type OptionsLoadMapFile } from './SplitButton'
import { LoadMapInputs, useLoadMapButtons } from '../layout/LoadMapButtons'
import { encodeFilename } from '../utils/map-utils'
import useBoundStore from '../store/store'
import { genRandomMapName } from '../utils/genRandomMapName'
import type { BoardPieces, HexMap } from '../types'
import { Button } from '@mui/material'
import { FcAddImage, FcLink, FcVlc } from 'react-icons/fc'
import { type SnackbarAction, type SnackbarKey, useSnackbar } from 'notistack'
import JSONCrush from 'jsoncrush'

export const FileControlsTab = () => {
  const {
    handleClickGzipFileSelect,
    handleClickJsonFileSelect,
    handleClickVSFileSelect,
  } = useLoadMapButtons()
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const fileName = `${encodeFilename(hexMap.name) || genRandomMapName()}${hexMap.author ? `_by_${encodeFilename(hexMap.author)}` : ''}`
  const subButtonTitle = 'Select another file type'
  const toggleIsNewMapDialogOpen = useBoundStore(
    (state) => state.toggleIsNewMapDialogOpen,
  )
  const isNewMapDialogOpen = useBoundStore((state) => state.isNewMapDialogOpen)
  const isEditMapDialogOpen = useBoundStore((state) => state.isEditMapDialogOpen)
  const toggleIsEditMapDialogOpen = useBoundStore(
    (state) => state.toggleIsEditMapDialogOpen,
  )
  const handleClickExportGzip = async () => {
    const filename = `${fileName}.gz`
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
    } = {
      hexMap,
      boardPieces,
    }
    const jsonDataString = JSON.stringify(data)
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(jsonDataString)
    const stream = new Blob([encodedData]).stream()
    const compressedReadableStream = stream.pipeThrough(
      new CompressionStream('gzip'),
    )
    const compressedResponse = new Response(compressedReadableStream)
    const blob = await compressedResponse.blob()
    const element = document.createElement('a')
    element.href = window.URL.createObjectURL(blob)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    // document.body.append(element)
    element.click()
    // element.remove()
  }
  const handleClickExportJson = async () => {
    const filename = `${fileName}.json`
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
    } = {
      hexMap,
      boardPieces,
    }
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      `data:application/x-ndjson;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data),
      )}`,
    )
    element.setAttribute('download', filename)
    element.style.display = 'none'
    // document.body.append(element)
    element.click()
    // element.remove()
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
      const action: SnackbarAction = (snackbarId: SnackbarKey) => (
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
      enqueueSnackbar({
        message: `Failed to copy url to clipboard, here it is: ${fullUrl}`,
        variant: 'error',
        autoHideDuration: 30000,
        action: action,
      })
    }
  }
  const loadMapSplitButtonOptions: OptionsLoadMapFile = [
    {
      displayText: 'Load JSON map',
      title: 'Load a map from a .json file type (a machine readable and somewhat human readable format)',
      callback: handleClickJsonFileSelect,
    },
    {
      displayText: 'Load GZip map',
      title: 'Load a map from a .gz file type (compressed format, not human readable)',
      callback: handleClickGzipFileSelect,
    },
    {
      displayText: 'Load Virtualscape map',
      title: 'Load a map from a .hsc file type (exported by Virtualscape)',
      callback: handleClickVSFileSelect,
    }
  ];
  const downloadMapSplitButtonOptions: OptionsLoadMapFile = [
    {
      displayText: 'Download JSON map',
      title: 'Download a map with the .json file type (a machine readable and somewhat human readable format)',
      callback: handleClickExportJson
    },
    {
      displayText: 'Download .gz map',
      title: 'Download a map with the .gz file type (compressed format, not human readable, small file size)',
      callback: handleClickExportGzip
    },
  ];
  return (
    <div>
      {/* <h2>Load Map File</h2>
      <LoadMapButtons />
      <Divider />
      <h2>Download</h2> */}
      <div>

        <Button
          onClick={() => toggleIsEditMapDialogOpen(!isEditMapDialogOpen)}
        >
          <FcVlc />
          Edit Map Details
        </Button>
      </div>
      <div>

        <Button
          onClick={() => toggleIsNewMapDialogOpen(!isNewMapDialogOpen)}
        >
          <FcAddImage />
          Create New Map
        </Button>
      </div>

      <div>
        <Button
          onClick={onClickCopy}
        >
          <FcLink />
          Copy Shareable URL
        </Button>
      </div>

      <SplitButton
        options={loadMapSplitButtonOptions}
        subButtonTitle={subButtonTitle}
      />
      <SplitButton
        options={downloadMapSplitButtonOptions}
        subButtonTitle={subButtonTitle}
      />
      <LoadMapInputs />
    </div>
  )
}

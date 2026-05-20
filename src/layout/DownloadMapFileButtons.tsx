import { MdFolderZip } from 'react-icons/md'
import { useSnackbar } from 'notistack'
import useBoundStore from '../store/store'
import { piecesSoFar } from '../data/pieces'
import { writeVirtualScapeMapFile } from '../data/writeVirtualscapeMapFile'
import type { BoardPiece, HexMap } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import { encodeFilename } from '../utils/map-utils'
import { ControlTabsListItemButton } from '../controls/ControlTabsListItemButton'
import { MdOutlineHexagon } from 'react-icons/md'

const DownloadMapFileButtons = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const { enqueueSnackbar } = useSnackbar()
  const fileName = `${encodeFilename(hexMap.name) || genRandomMapName()}${hexMap.author ? `_by_${encodeFilename(hexMap.author)}` : ''}`

  const downloadBlob = (blob: Blob, filename: string) => {
    const element = document.createElement('a')
    const objectUrl = window.URL.createObjectURL(blob)
    element.href = objectUrl
    element.setAttribute('download', filename)
    element.style.display = 'none'
    element.click()
    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl)
    }, 0)
  }

  const handleClickExportGzip = async () => {
    const filename = `${fileName}.gz`
    const hexMapToUse = { ...hexMap, mapPortraitBase64: '' }
    const data: {
      hexMap: HexMap
      boardPieces: BoardPiece[]
    } = {
      hexMap: hexMapToUse,
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
    downloadBlob(blob, filename)
  }

  // lean file version means no map portrait is saved
  const handleClickExportJson = async (isLeanFileVersion: boolean) => {
    const filename = `${fileName}.json`
    const hexMapToUse = isLeanFileVersion
      ? { ...hexMap, mapPortraitBase64: '' }
      : hexMap
    const data: {
      hexMap: HexMap
      boardPieces: BoardPiece[]
    } = {
      hexMap: hexMapToUse,
      boardPieces,
    }
    const blob = new Blob([JSON.stringify(data)], {
      type: 'application/json;charset=utf-8',
    })
    downloadBlob(blob, filename)
  }

  const handleClickExportVirtualScape = () => {
    const filename = `${fileName}.hsc`
    const exportResult = writeVirtualScapeMapFile({ hexMap, boardPieces })
    const blob = new Blob([exportResult.arrayBuffer], {
      type: 'application/octet-stream',
    })
    downloadBlob(blob, filename)

    const omittedEntries = Object.entries(exportResult.omittedPieceCounts)
    if (omittedEntries.length === 0) {
      enqueueSnackbar({
        message: 'Downloaded VirtualScape file (.hsc)',
        variant: 'success',
      })
      return
    }

    const omittedSummary = omittedEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([inventoryID, count]) => {
        return `${piecesSoFar[inventoryID]?.title ?? inventoryID} x${count}`
      })
      .join(', ')
    const omittedCount = omittedEntries.reduce((sum, [, count]) => sum + count, 0)
    const extraCount = omittedEntries.length > 4 ? ` and ${omittedEntries.length - 4} more` : ''

    enqueueSnackbar({
      message: `Downloaded VirtualScape file (.hsc). Omitted ${omittedCount} unsupported piece${omittedCount === 1 ? '' : 's'}: ${omittedSummary}${extraCount}`,
      variant: 'warning',
      autoHideDuration: 7000,
    })
  }

  return (
    <>
      <ControlTabsListItemButton
        title="Download the map file without the map portrait image, and compressed with GZip (extremely small file size)"
        primary="Download file (.gz)"
        onClick={handleClickExportGzip}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        title="Download the map file without the map portrait image (much smaller filesize)"
        primary="Download file (.json)"
        onClick={() => handleClickExportJson(true)}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        title="Download the map file with the map portrait image (much larger filesize)"
        primary="Download file (.json) (with map picture included)"
        onClick={() => handleClickExportJson(false)}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        title="Download a legacy VirtualScape binary file. Pieces with no reliable VirtualScape equivalent are omitted."
        primary="Download VirtualScape file (.hsc)"
        onClick={handleClickExportVirtualScape}
        icon={<MdOutlineHexagon />}
      />
    </>
  )
}
export default DownloadMapFileButtons

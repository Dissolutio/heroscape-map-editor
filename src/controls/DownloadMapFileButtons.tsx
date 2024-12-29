import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import { encodeFilename } from '../utils/map-utils'
import { BoardPieces, HexMap } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'

const DownloadMapFileButtons = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const handleClickExportGzip = async () => {
    const filename = `${encodeFilename(hexMap.name)}.gz`
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
    const filename = `${encodeFilename(hexMap.name) || genRandomMapName()}.json`
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
        JSON.stringify(data)
      )}`
    )
    element.setAttribute('download', filename)
    element.style.display = 'none'
    // document.body.append(element)
    element.click()
    // element.remove()
  }
  return (
    <>
      <ListItemButton
        sx={{ pl: 4 }}
        onClick={handleClickExportGzip}
      >
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Download Map File (.gz)" />
      </ListItemButton>

      <ListItemButton
        sx={{ pl: 4 }}
        onClick={handleClickExportJson}
      >
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Download Map File (.json)" />
      </ListItemButton>
    </>
  )
}
export default DownloadMapFileButtons

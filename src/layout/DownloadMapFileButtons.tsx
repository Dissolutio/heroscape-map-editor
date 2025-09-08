import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import type { BoardPieces, HexMap } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import { encodeFilename } from '../utils/map-utils'

const DownloadMapFileButtons = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const fileName = `${encodeFilename(hexMap.name) || genRandomMapName()}${hexMap.author ? `_by_${encodeFilename(hexMap.author)}` : ''}`
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
  return (
    <>
      <ListItemButton sx={{ pl: 4 }} onClick={handleClickExportGzip}>
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Download file (.gz)" />
      </ListItemButton>

      <ListItemButton sx={{ pl: 4 }} onClick={handleClickExportJson}>
        <ListItemIcon>
          <MdFolderZip />
        </ListItemIcon>
        <ListItemText primary="Download file (.json)" />
      </ListItemButton>
    </>
  )
}
export default DownloadMapFileButtons

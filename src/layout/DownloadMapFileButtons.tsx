import { MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import type { BoardPieces, HexMap } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import { encodeFilename } from '../utils/map-utils'
import { ControlTabsListItemButton } from '../controls/ControlTabsListItemButton'

const DownloadMapFileButtons = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const fileName = `${encodeFilename(hexMap.name) || genRandomMapName()}${hexMap.author ? `_by_${encodeFilename(hexMap.author)}` : ''}`
  const handleClickExportGzip = async () => {
    const filename = `${fileName}.gz`
    const hexMapToUse = { ...hexMap, mapPortraitBase64: '' }
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
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
    const element = document.createElement('a')
    element.href = window.URL.createObjectURL(blob)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    // document.body.append(element)
    element.click()
    // element.remove()
  }
  // lean file version means no map portrait is saved
  const handleClickExportJson = async (isLeanFileVersion: boolean) => {
    const filename = `${fileName}.json`
    const hexMapToUse = isLeanFileVersion
      ? { ...hexMap, mapPortraitBase64: '' }
      : hexMap
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
    } = {
      hexMap: hexMapToUse,
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
    </>
  )
}
export default DownloadMapFileButtons

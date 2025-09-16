import { MdFolderZip } from 'react-icons/md'
import useBoundStore from '../store/store'
import type { BoardPieces, HexMap } from '../types'
import { genRandomMapName } from '../utils/genRandomMapName'
import { encodeFilename } from '../utils/map-utils'
import { ControlTabsListItemButton } from '../controls/ControlTabsListItemButton'

const DownloadMapFileButtons = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)
  const mapPortraitBase64 = hexMap?.mapPortraitBase64 ?? ''
  const mapNotes = hexMap?.mapNotes ?? ''
  const fileName = `${encodeFilename(hexMap.name) || genRandomMapName()}${hexMap.author ? `_by_${encodeFilename(hexMap.author)}` : ''}`
  const handleClickExportGzip = async () => {
    const filename = `${fileName}.gz`
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
      mapPortraitBase64: string
      mapNotes: string
    } = {
      hexMap,
      boardPieces,
      mapPortraitBase64,
      mapNotes,
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
  const handleClickExportJson = async (isLeanFileVersion: boolean) => {
    const filename = `${fileName}.json`
    const hexMapToUse = isLeanFileVersion
      ? { ...hexMap, mapPortraitBase64: '' }
      : hexMap
    const data: {
      hexMap: HexMap
      boardPieces: BoardPieces
      mapPortraitBase64: string
    } = {
      hexMap: hexMapToUse,
      boardPieces,
      mapPortraitBase64,
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
        primary="Download file (.gz)"
        onClick={handleClickExportGzip}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        primary="Download file (.json)"
        onClick={() => handleClickExportJson(false)}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        title="Download the map file without the map portrait image (much smaller filesize)"
        primary="Download slim file (.json)"
        onClick={() => handleClickExportJson(false)}
        icon={<MdFolderZip />}
      />
    </>
  )
}
export default DownloadMapFileButtons

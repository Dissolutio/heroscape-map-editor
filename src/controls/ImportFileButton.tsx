import React, { ChangeEvent } from 'react'
import { Button } from '@mui/material'
import { MdFileOpen } from 'react-icons/md'
import { GiDevilMask } from 'react-icons/gi'
import readVirtualscapeMapFile from '../data/readVirtualscapeMapFile'
import buildupVSFileMap, { buildupJsonFileMap } from '../data/buildupMap'
import useBoundStore from '../store/store'
import { MapState } from '../types'

const ImportFileButton = () => {
  const loadMap = useBoundStore((state) => state.loadMap)
  const uploadElementID = 'upload'
  const virtualScapeUploadElementID = 'vsupload'
  const handleClickFileSelect = () => {
    const element = document.getElementById(uploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickVSFileSelect = () => {
    const element = document.getElementById(virtualScapeUploadElementID)
    if (element) {
      element.click()
    }
  }
  const readJsonFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }
    const fileReader = new FileReader()
    fileReader.onloadend = async (e) => {
      try {
        const compressedBlob = new Blob([e?.target?.result ?? '']);
        const decompressedStream = compressedBlob.stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressedData = await new Response(decompressedStream).text();
        const data = JSON.parse(decompressedData);
        const jsonMap: MapState = {
          boardHexes: buildupJsonFileMap(data.boardPieces, data.hexMap).boardHexes,
          hexMap: data.hexMap,
          boardPieces: data.boardPieces,
        }
        loadMap(jsonMap)
      } catch (error) {
        console.error(error)
      }
    }
    try {
      fileReader.readAsArrayBuffer(file)
    } catch (error) {
      console.error(error)
    }
    event.target.value = ""; // Reset the input value
  }

  const readVSFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0]
    if (!file) {
      return
    }

    try {
      const myMap = await readVirtualscapeMapFile(file)
      const myVirtualscapeMap = buildupVSFileMap(myMap.tiles, myMap.name)
      loadMap(myVirtualscapeMap)
    } catch (error) {
      console.error(error)
    }
    event.target.value = ""; // Reset the input value
  }

  return (
    <>
      <Button
        startIcon={<MdFileOpen />}
        onClick={handleClickFileSelect}
        variant="contained"
      >
        Import Map File (.hexoscape.gz)
      </Button>
      <Button
        startIcon={<GiDevilMask />}
        onClick={handleClickVSFileSelect}
        variant="contained"
      >
        Import VirtualScape File (.hsc)
      </Button>
      <ReadFile id={uploadElementID} readFile={readJsonFile} />
      <ReadVSFile id={virtualScapeUploadElementID} readFile={readVSFile} />
    </>
  )
}
export default ImportFileButton

const hiddenStyle = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1',
  overflow: 'hidden',
  position: 'absolute' as const,
  bottom: '0',
  left: '0',
  whiteSpace: 'nowrap',
  width: '1',
}
type ReadFileProps = {
  id: string
  readFile: (event: ChangeEvent<HTMLInputElement>) => void
}
const ReadFile = ({ id, readFile }: ReadFileProps) => {
  return (
    <input
      id={id}
      type="file"
      style={hiddenStyle}
      accept=".hexoscape.gz"
      onChange={readFile}
    />
  )
}
const ReadVSFile = ({ id, readFile }: ReadFileProps) => {
  return (
    <input
      id={id}
      type="file"
      style={hiddenStyle}
      accept=".hsc"
      onChange={readFile}
    />
  )
}
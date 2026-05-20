import { Button } from '@mui/material'
import { MdOutlineDownloadForOffline } from 'react-icons/md'
import useBoundStore from '../store/store'
import { writeVirtualScapeMapFile } from '../data/writeVirtualscapeMapFile'

const ExportBinaryFileButton = () => {
  const hexMap = useBoundStore((state) => state.hexMap)
  const boardPieces = useBoundStore((state) => state.boardPieces)

  const handleClickExportBinary = () => {
    const filename = 'HexoscapeMap.hsc'
    const element = document.createElement('a')
    const file = writeVirtualScapeMapFile({ hexMap, boardPieces }).arrayBuffer
    const objectUrl = URL.createObjectURL(
      new Blob([file], { type: 'application/octet-stream' }),
    )
    element.setAttribute('href', objectUrl)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    element.click()
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 0)
  }
  return (
    <Button
      startIcon={<MdOutlineDownloadForOffline />}
      onClick={handleClickExportBinary}
      variant="contained"
    >
      Download Map Binary
    </Button>
  )
}
export default ExportBinaryFileButton

import { Button } from '@mui/material'
import { MdOutlineDownloadForOffline } from 'react-icons/md'
import { writeVirtualScapeArrayBuffer } from '../data/writeVirtualscapeMapFile'

const ExportBinaryFileButton = () => {
  const handleClickExportBinary = () => {
    const filename = 'HexoscapeMap.hsc'
    const element = document.createElement('a')
    const fileByteLength = writeVirtualScapeArrayBuffer().offset
    const file = writeVirtualScapeArrayBuffer(fileByteLength).arrayBuffer
    const blob = new Blob([file], { type: 'application/octet-stream' })
    element.setAttribute('href', URL.createObjectURL(blob))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    // document.body.append(element)
    element.click()
    // element.remove()
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

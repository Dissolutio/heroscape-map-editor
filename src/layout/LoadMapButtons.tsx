import { MdFolderZip, MdOutlineHexagon } from 'react-icons/md'
import {
  jsonUploadElementID,
  uploadElementID,
  virtualScapeUploadElementID,
} from './LoadFileHiddenInputs'
import {
  ControlTabsListItemButton,
} from '../controls/ControlTabsListItemButton'

export const useLoadMapButtons = () => {
  const handleClickGzipFileSelect = () => {
    const element = document.getElementById(uploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickJsonFileSelect = () => {
    const element = document.getElementById(jsonUploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickVSFileSelect = async () => {
    const element = document.getElementById(virtualScapeUploadElementID)
    if (element) {
      element.click()
    }
  }

  return {
    handleClickGzipFileSelect,
    handleClickJsonFileSelect,
    handleClickVSFileSelect,
  }
}

const LoadMapButtons = () => {
  const handleClickGzipFileSelect = () => {
    const element = document.getElementById(uploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickJsonFileSelect = () => {
    const element = document.getElementById(jsonUploadElementID)
    if (element) {
      element.click()
    }
  }
  const handleClickVSFileSelect = async () => {
    const element = document.getElementById(virtualScapeUploadElementID)
    if (element) {
      element.click()
    }
  }

  return (
    <>
      <ControlTabsListItemButton
        primary="Load file (.json)"
        onClick={handleClickJsonFileSelect}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        primary="Load file (.gz)"
        onClick={handleClickGzipFileSelect}
        icon={<MdFolderZip />}
      />
      <ControlTabsListItemButton
        primary="Load Virtualscape file (.hsc)"
        onClick={handleClickVSFileSelect}
        icon={<MdOutlineHexagon />}
      />
    </>
  )
}

export default LoadMapButtons

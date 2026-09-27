import { MdFolderZip, MdLink, MdOutlineHexagon } from 'react-icons/md'
import { ControlTabsListItemButton } from '../controls/ControlTabsListItemButton'
import useBoundStore from '../store/store'
import {
  jsonUploadElementID,
  uploadElementID,
  virtualScapeUploadElementID,
} from './LoadFileHiddenInputs'
import { DIALOGS } from './dialogNames'

const useLoadMapButtons = () => {
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

export const LoadMapButtons = () => {
  // const handleClickGzipFileSelect = () => {
  //   const element = document.getElementById(uploadElementID)
  //   if (element) {
  //     element.click()
  //   }
  // }
  // const handleClickJsonFileSelect = () => {
  //   const element = document.getElementById(jsonUploadElementID)
  //   if (element) {
  //     element.click()
  //   }
  // }
  // const handleClickVSFileSelect = async () => {
  //   const element = document.getElementById(virtualScapeUploadElementID)
  //   if (element) {
  //     element.click()
  //   }
  // }
  const {
    handleClickGzipFileSelect,
    handleClickJsonFileSelect,
    handleClickVSFileSelect,
  } = useLoadMapButtons()
  const toggleCurrentDialog = useBoundStore(
    (state) => state.toggleCurrentDialog,
  )
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
      <ControlTabsListItemButton
        primary="Load from URL"
        onClick={() => toggleCurrentDialog(DIALOGS.loadFromUrl)}
        icon={<MdLink />}
      />
    </>
  )
}

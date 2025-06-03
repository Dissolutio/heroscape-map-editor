import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import type { CameraControls } from '@react-three/drei'
import React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  FcCamcorderPro,
  FcNoVideo,
  FcOldTimeCamera,
  FcSwitchCamera,
  FcSynchronize,
  FcVideoCall,
} from 'react-icons/fc'
import useEvent from '../hooks/useEvent'
import useBoundStore from '../store/store'
import { EVENTS } from '../utils/constants'

export default function CameraSpeedDial({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
}) {
  const [open, setOpen] = React.useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const { publish } = useEvent()
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const isTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)

  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const isCamerDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  // const onClickDisableCamera = (e: any) => {
  //   const targetId = e?.nativeEvent?.target?.id ?? ''
  //   const classList = Array.from(e?.nativeEvent?.target?.classList ?? [])
  //   if (targetId === id1 || targetId === id2 || classList.includes("MuiFab-primary")) {
  //     toggleIsCameraDisabled(!isCamerDisabled)
  //   }
  //   setOpen(false)
  // }

  // this timeout gives the World enough time to re-render without empty hexes etc.
  const takePictureTimeout = React.useRef<number>(null!)
  // effect: clear the timeout after we take a picture
  React.useEffect(() => {
    if (!isTakingPicture) {
      clearTimeout(takePictureTimeout.current)
    }
  }, [isTakingPicture])

  const id1 = 'camera-unlock-icon'
  const id2 = 'camera-lock-icon'
  const resetCamera = () => {
    cameraControlsRef?.current?.reset(true)
  }
  const handleToggleOrthoCam = () => {
    toggleIsOrthoCam(!isOrthoCam)
  }
  useHotkeys('insert', () => handleToggleOrthoCam())
  // const handleTakePicturePng = () => {
  //   toggleIsTakingPicture(true)
  //   takePictureTimeout.current = setTimeout(() => {
  //     publish(EVENTS.savePng)
  //   }, 100); // Long enough to make some changes to the map and render
  // }
  const handleTakePictureJpg = () => {
    toggleIsTakingPicture(true)
    takePictureTimeout.current = window.setTimeout(() => {
      publish(EVENTS.saveJpg)
    }, 100) // Long enough to make some changes to the map and render
  }

  return (
    <SpeedDial
      ariaLabel="3D camera controls menu"
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '2rem',

        // Style the button red when camera is disabled
        '.MuiSpeedDial-fab': {
          ...(isCamerDisabled
            ? { backgroundColor: 'red', color: 'white' }
            : {}),
        },
      }}
      icon={<FcCamcorderPro />}
      transitionDuration={100}
      direction="right"
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
    >
      <SpeedDialAction
        icon={
          isCamerDisabled ? <FcVideoCall id={id2} /> : <FcNoVideo id={id1} />
        }
        tooltipTitle={
          isCamerDisabled ? 'Unlock camera controls' : 'Lock camera controls'
        }
        onClick={() => toggleIsCameraDisabled(!isCamerDisabled)}
      />
      <SpeedDialAction
        icon={<FcSynchronize />}
        tooltipTitle={'Reset camera defaults'}
        onClick={resetCamera}
      />
      <SpeedDialAction
        icon={<FcSwitchCamera />}
        tooltipTitle={
          isOrthoCam
            ? 'Switch to perspective camera'
            : 'Switch to orthographic camera'
        }
        onClick={handleToggleOrthoCam}
      />
      {/* <SpeedDialAction
        icon={<FcOldTimeCamera />}
        tooltipTitle={'Take map picture .PNG'}
        onClick={handleTakePicturePng}
      /> */}
      <SpeedDialAction
        icon={<FcOldTimeCamera />}
        tooltipTitle={'Take map picture .JPG'}
        aria-label="Camera take map picture and save as JPG"
        onClick={handleTakePictureJpg}
      />
    </SpeedDial>
  )
}

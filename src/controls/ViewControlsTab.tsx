import {
  Box,
  FormControlLabel,
  FormGroup,
  Switch,
  ClickAwayListener,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Icon,
} from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import React from 'react'
import {
  FcCamcorderPro,
  FcCollect,
  FcDownload,
  FcLock,
  FcNoVideo,
  FcOldTimeCamera,
  FcPanorama,
  FcSwitchCamera,
  FcSynchronize,
  FcUnlock,
  FcVideoCall,
} from 'react-icons/fc'
import useEvent from '../hooks/useEvent'
import useBoundStore from '../store/store'
import { EVENTS } from '../utils/constants'
import { useSnackbar } from 'notistack'
import { MdExpandLess, MdExpandMore, MdFolderZip } from 'react-icons/md'
import type { Group, Object3DEventMap } from 'three'

export default function ViewControlsTab({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { publish } = useEvent()
  const isCamerDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const isTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)

  // const onClickDisableCamera = (e: any) => {
  //   const targetId = e?.nativeEvent?.target?.id ?? ''
  //   const classList = Array.from(e?.nativeEvent?.target?.classList ?? [])
  //   if (targetId === id1 || targetId === id2 || classList.includes("MuiFab-primary")) {
  //     toggleIsCameraDisabled(!isCamerDisabled)
  //   }
  //   setOpen(false)
  // }

  // this timeout gives the World enough time to re-render without empty hexes etc.
  const takePictureTimeout = React.useRef<number>()
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
  const zoomToMap = () => {
    if (mapGroupRef.current) {
      cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
    }
  }
  const handleToggleOrthoCam = () => {
    toggleIsOrthoCam(!isOrthoCam)
  }
  const handleTakeAMapPicture = () => {
    toggleIsTakingPicture(true)
    takePictureTimeout.current = window.setTimeout(() => {
      publish(EVENTS.savePng)
    }, 100) // Long enough to make some changes to the map and render
  }
  return (
    <Box sx={{ width: '100%', height: '100%' }} role="presentation">
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 0,
          // overflow: 'hidden'
        }}
      >
        <List>
          {/* Center map in camera view */}
          <ListItemButton onClick={zoomToMap}>
            <ListItemIcon>
              <FcCollect />
            </ListItemIcon>
            <ListItemText primary="Zoom to map" />
          </ListItemButton>
          {/* Lock Camera Controls */}
          <ListItemButton
            title={
              isCamerDisabled
                ? 'Unlock camera controls'
                : 'Lock camera controls'
            }
            onClick={() => toggleIsCameraDisabled(!isCamerDisabled)}
            style={{
              ...(isCamerDisabled
                ? { backgroundColor: 'red', color: 'white' }
                : {}),
            }}
          >
            <ListItemIcon>
              {isCamerDisabled ? <FcUnlock id={id2} /> : <FcLock id={id1} />}
            </ListItemIcon>
            <ListItemText
              primary={isCamerDisabled ? 'Unlock camera' : 'Lock camera'}
            />
          </ListItemButton>

          {/* Reset camera defaults */}
          <ListItemButton title={'Reset camera defaults'} onClick={resetCamera}>
            <ListItemIcon>
              <FcSynchronize />
            </ListItemIcon>
            <ListItemText primary="Reset camera" />
          </ListItemButton>

          {/* Switch camera orthographic/perspective */}
          <ListItemButton
            title={
              isOrthoCam
                ? 'Switch to perspective camera'
                : 'Switch to orthographic camera'
            }
            onClick={handleToggleOrthoCam}
          >
            <ListItemIcon>
              <FcSwitchCamera />
            </ListItemIcon>
            <ListItemText
              primary={
                isOrthoCam
                  ? 'Use perspective camera'
                  : 'Use orthographic camera'
              }
            />
          </ListItemButton>

          {/* Take map picture PNG */}
          <ListItemButton
            title={'Take map picture .PNG'}
            onClick={handleTakeAMapPicture}
          >
            <ListItemIcon>
              <FcOldTimeCamera />
            </ListItemIcon>
            <ListItemText primary={'Take map picture .PNG'} />
          </ListItemButton>
        </List>
      </div>
      <div style={{ border: '1px solid var(--transparent-border)' }}>
        <SwitchIsLightsAndShadows />
        <SwitchIsHideTableTop />
        <SwitchIsDisplayCapHeights />
        <SwitchIsHighQualityRender />
        {/* <SwitchIsFrameloopDemand /> */}
      </div>
    </Box>
  )
}

function SwitchIsLightsAndShadows() {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleIsLightsAndShadowsRender = useBoundStore(
    (s) => s.toggleIsLightsAndShadowsRender,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsLightsAndShadowsRender(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isLightsAndShadowsRender} onChange={handleChange} />
        }
        label="Render Lights and Shadows"
      />
    </FormGroup>
  )
}
function SwitchIsHighQualityRender() {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const toggleIsHighQualityRender = useBoundStore(
    (s) => s.toggleIsHighQualityRender,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHighQualityRender(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isHighQualityRender} onChange={handleChange} />
        }
        label="High Quality Render (Significant performance impact)"
      />
    </FormGroup>
  )
}
function SwitchIsDisplayCapHeights() {
  const isDisplayCapHeights = useBoundStore((s) => s.isDisplayCapHeights)
  const toggleIsDisplayCapHeights = useBoundStore(
    (s) => s.toggleIsDisplayCapHeights,
  )
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsDisplayCapHeights(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch checked={isDisplayCapHeights} onChange={handleChange} />
        }
        label="Display Hex Heights"
      />
    </FormGroup>
  )
}
function SwitchIsHideTableTop() {
  const isHideTableTop = useBoundStore((s) => s.isHideTableTop)
  const toggleIsHideTableTop = useBoundStore((s) => s.toggleIsHideTableTop)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHideTableTop(event.target.checked)
  }
  return (
    <FormGroup>
      <FormControlLabel
        control={<Switch checked={isHideTableTop} onChange={handleChange} />}
        label="Hide TableTop"
      />
    </FormGroup>
  )
}
// function SwitchIsFrameloopDemand() {
//   const isFrameloopDemand = useBoundStore((s) => s.isFrameloopDemand)
//   const toggleIsFrameloopDemand = useBoundStore((s) => s.toggleIsFrameloopDemand)
//   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     toggleIsFrameloopDemand(event.target.checked)
//   }
//   return (
//     <FormGroup>
//       <FormControlLabel
//         control={<Switch checked={isFrameloopDemand} onChange={handleChange} />}
//         label="Frameloop Demand"
//       />
//     </FormGroup>
//   )
// }

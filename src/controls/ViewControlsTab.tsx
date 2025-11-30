import {
  Box,
  FormControlLabel,
  FormGroup,
  Switch,
  List,
  FormControl,
  FormLabel,
} from '@mui/material'
import type { CameraControls } from '@react-three/drei'
import React from 'react'
import {
  FcCollect,
  FcLock,
  FcOldTimeCamera,
  FcSwitchCamera,
  FcSynchronize,
  FcUnlock,
} from 'react-icons/fc'
import useEvent from '../hooks/useEvent'
import useBoundStore from '../store/store'
import { EVENTS } from '../utils/constants'
import type { Group, Object3DEventMap } from 'three'
import { ControlTabsListItemButton } from './ControlTabsListItemButton'
import { zoomToMap } from '../utils/camera-utils'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'

export default function ViewControlsTab({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) {
  // const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { publish } = useEvent()
  const isCamerDisabled = useBoundStore((s) => s.isCameraDisabled)
  const toggleIsCameraDisabled = useBoundStore((s) => s.toggleIsCameraDisabled)
  const toggleIsOrthoCam = useBoundStore((s) => s.toggleIsOrthoCam)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const toggleIsTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const isTakingPicture = useBoundStore((s) => s.toggleIsTakingPicture)
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
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
  const useZoomToMap = () => {
    if (mapGroupRef.current) {
      zoomToMap(mapGroupRef, cameraControlsRef, width, length)
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
        }}
      >
        <List>
          {/* Center map in camera view */}
          <ControlTabsListItemButton
            title="Center the camera on entire map"
            primary="Zoom to map"
            onClick={useZoomToMap}
            icon={<FcCollect />}
          />

          {/* Lock Camera Controls */}
          <ControlTabsListItemButton
            title={
              isCamerDisabled
                ? 'Unlock camera controls'
                : 'Lock camera controls'
            }
            primary={isCamerDisabled ? 'Unlock camera' : 'Lock camera'}
            onClick={() => toggleIsCameraDisabled(!isCamerDisabled)}
            icon={isCamerDisabled ? <FcUnlock id={id2} /> : <FcLock id={id1} />}
          />

          {/* Reset camera defaults */}
          <ControlTabsListItemButton
            title={'Reset camera defaults'}
            primary="Reset camera"
            onClick={resetCamera}
            icon={<FcSynchronize />}
          />

          {/* Switch camera orthographic/perspective */}
          <ControlTabsListItemButton
            title={
              isOrthoCam
                ? 'Switch to perspective camera'
                : 'Switch to orthographic camera'
            }
            primary={
              isOrthoCam ? 'Use perspective camera' : 'Use orthographic camera'
            }
            onClick={handleToggleOrthoCam}
            icon={<FcSwitchCamera />}
          />

          {/* Take map picture PNG */}
          <ControlTabsListItemButton
            title={'Take map picture .PNG'}
            primary="Take map picture .PNG"
            onClick={handleTakeAMapPicture}
            icon={<FcOldTimeCamera />}
          />
        </List>
      </div>
      <Box>
        <ViewPreferencesSwitchForm />
        <PdfPreferencesSwitchForm />
      </Box>
    </Box>
  )
}
const ViewPreferencesSwitchForm = () => {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const toggleIsLightsAndShadowsRender = useBoundStore(
    (s) => s.toggleIsLightsAndShadowsRender,
  )
  const handleChangeLightsAndRender = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toggleIsLightsAndShadowsRender(event.target.checked)
  }
  const isTopOutlinedInterlockHexes = useBoundStore(
    (s) => s.isTopOutlinedInterlockHexes,
  )
  const toggleIsTopOutlinedInterlockHexes = useBoundStore(
    (s) => s.toggleIsTopOutlinedInterlockHexes,
  )
  const handleChangeShowOutlinedInterlockHexes = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toggleIsTopOutlinedInterlockHexes(event.target.checked)
  }
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const toggleIsHighQualityRender = useBoundStore(
    (s) => s.toggleIsHighQualityRender,
  )
  const handleChangeHQRender = (event: React.ChangeEvent<HTMLInputElement>) => {
    toggleIsHighQualityRender(event.target.checked)
  }
  const isDisplayCapHeights = useBoundStore((s) => s.isDisplayCapHeights)
  const toggleIsDisplayCapHeights = useBoundStore(
    (s) => s.toggleIsDisplayCapHeights,
  )
  const handleChangeDisplayCapHeights = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toggleIsDisplayCapHeights(event.target.checked)
  }
  const isHideTableTop = useBoundStore((s) => s.isHideTableTop)
  const toggleIsHideTableTop = useBoundStore((s) => s.toggleIsHideTableTop)
  const handleChangeHideTableTop = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toggleIsHideTableTop(event.target.checked)
  }
  // const isFrameloopDemand = useBoundStore((s) => s.isFrameloopDemand)
  // const toggleIsFrameloopDemand = useBoundStore((s) => s.toggleIsFrameloopDemand)
  // const handleChangeFrameloopDemand = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   toggleIsFrameloopDemand(event.target.checked)
  // }

  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">View options:</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isTopOutlinedInterlockHexes}
              onChange={handleChangeShowOutlinedInterlockHexes}
              title="Enable/disable a black border around the top of land pieces, to help distinguish them from eachother"
            />
          }
          title="Enable/disable a black border around the top of land pieces, to help distinguish them from eachother"
          label="Show piece outlines"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isLightsAndShadowsRender}
              onChange={handleChangeLightsAndRender}
            />
          }
          title="Enable/disable lights and shadows in the 3D view"
          label="Render Lights and Shadows"
        />

        {isLightsAndShadowsRender && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isHideTableTop}
                onChange={handleChangeHideTableTop}
              />
            }
            title="Show/hide the table plane in 3D view, only available when lights and shadows are enabled"
            label="Hide TableTop"
          />
        )}

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isDisplayCapHeights}
              onChange={handleChangeDisplayCapHeights}
            />
          }
          title="Show/hide each hex's height, if a unit can be on that hex"
          label="Display Hex Heights"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isHighQualityRender}
              onChange={handleChangeHQRender}
            />
          }
          title="Enable/disable high quality render settings, currently just a more realistic hex cap"
          label="High Quality Render (Significant performance impact)"
        />
        {/* <FormControlLabel
          control={<Switch checked={isFrameloopDemand} onChange={handleChangeFrameloopDemand} />}
          label="Frameloop Demand"
        /> */}
      </FormGroup>
    </FormControl>
  )
}
const PdfPreferencesSwitchForm = () => {
  const isShowPDFInventory = useBoundStore((s) => s.isShowPDFInventory)
  const toggleIsShowPDFInventory = useBoundStore(
    (s) => s.toggleIsShowPDFInventory,
  )
  const handleChangeShowPDFInventory = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toggleIsShowPDFInventory(event.target.checked)
  }

  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">PDF options:</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={isShowPDFInventory}
              onChange={handleChangeShowPDFInventory}
              title="Enable/disable a piece inventory on the PDF build instructions"
            />
          }
          label="PDF piece inventory"
        />
      </FormGroup>
    </FormControl>
  )
}

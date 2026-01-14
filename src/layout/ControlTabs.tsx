import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import type { CameraControls } from '@react-three/drei'
import type { Group, Object3DEventMap } from 'three'
import { FileControlsTab } from '../controls/FileControlsTab'
import ViewControlsTab from '../controls/ViewControlsTab'
import { EditControlsTab } from '../controls/EditControlsTab'
import { BuildControlsTab } from '../controls/BuildControlsTab'
import { useMuiMediaQuery } from './useMuiMediaQuery'
import { useControlsWidthContext } from '../controls/useControlWidth'
import { Tooltip } from '@mui/material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export const ControlTabs = ({
  cameraControlsRef,
  mapGroupRef,
  controlsContainerRef,
  is2DOpen,
  isPdfOpen,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
  controlsContainerRef: React.RefObject<null>
  is2DOpen: boolean
  isPdfOpen: boolean
}) => {
  const [value, setValue] = React.useState(0)
  const { isSideControls } = useMuiMediaQuery()
  const { isMediumControls, isSmallControls } = useControlsWidthContext()
  const tabFontSize = isSmallControls
    ? '0.8em'
    : isMediumControls
      ? '0.8em'
      : '1rem'
  const tabMinHeight = isSmallControls
    ? '22px'
    : isMediumControls
      ? '25px'
      : '31px'
  const tabMinWidth = isSmallControls ? 40 : isMediumControls ? 50 : 90

  const handleChange = (newValue: number) => {
    setValue(newValue)
  }
  return (
    <Box
      ref={controlsContainerRef}
      sx={{
        width: '100%',
      }}
      id="control-tabs"
    >
      <Box
        sx={{
          position: 'fixed',
          backgroundColor: 'var(--black)',
          width: isSideControls ? 'var(--controls-width)' : '100%',
          zIndex: 100,
          minHeight: tabMinHeight,
        }}
      >
        <Box
          sx={{
            width: '100%',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={value}
            onChange={(_, n) => handleChange(n)}
            aria-label="control tabs"
            centered
            sx={{
              fontSize: tabFontSize,
              minHeight: tabMinHeight,
              minWidth: tabMinWidth,
            }}
          >
            <Tooltip
              title="Show controls for building the map"
              disableHoverListener
              disableTouchListener
            >
              <Tab
                label="Build"
                {...a11yProps(0)}
                sx={{
                  fontSize: tabFontSize,
                  p: 0,
                  m: 0,
                  minHeight: tabMinHeight,
                  minWidth: tabMinWidth,
                }}
              />
            </Tooltip>
            <Tooltip
              title="Show controls for loading, downloading, sharing, or creating new map files"
              disableHoverListener
              disableTouchListener
            >
              <Tab
                label="File"
                {...a11yProps(1)}
                sx={{
                  fontSize: tabFontSize,
                  p: 0,
                  m: 0,
                  minHeight: tabMinHeight,
                  minWidth: tabMinWidth,
                }}
              />
            </Tooltip>
            <Tooltip
              title="Show controls for editing details of the current map"
              disableHoverListener
              disableTouchListener
            >
              <Tab
                label="Edit"
                {...a11yProps(2)}
                sx={{
                  fontSize: tabFontSize,
                  p: 0,
                  m: 0,
                  minHeight: tabMinHeight,
                  minWidth: tabMinWidth,
                }}
              />
            </Tooltip>
            <Tooltip
              title="Show controls for taking a map picture, controlling the camera, and editing preferences"
              disableHoverListener
              disableTouchListener
            >
              <Tab
                label="View"
                {...a11yProps(3)}
                sx={{
                  fontSize: tabFontSize,
                  p: 0,
                  m: 0,
                  minHeight: tabMinHeight,
                  minWidth: tabMinWidth,
                }}
              />
            </Tooltip>
          </Tabs>
        </Box>
      </Box>
      <Box
        sx={{
          marginTop: tabMinHeight,
        }}
      >
        {/* BUILD */}
        <CustomTabPanel value={value} index={0}>
          <BuildControlsTab />
        </CustomTabPanel>
        {/* FILE */}
        <CustomTabPanel value={value} index={1}>
          <FileControlsTab is2DOpen={is2DOpen} />
        </CustomTabPanel>
        {/* EDIT */}
        <CustomTabPanel value={value} index={2}>
          <EditControlsTab />
        </CustomTabPanel>
        {/* VIEW */}
        <CustomTabPanel value={value} index={3}>
          <ViewControlsTab
            cameraControlsRef={cameraControlsRef}
            mapGroupRef={mapGroupRef}
            is2DOpen={is2DOpen}
            isPdfOpen={isPdfOpen}
          />
        </CustomTabPanel>
      </Box>
    </Box>
  )
}

import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import type { CameraControls } from '@react-three/drei'
import type { Group, Object3DEventMap } from 'three'
import { FileControlsTab } from './FileControlsTab'
import ViewControlsTab from './ViewControlsTab'
import { EditControlsTab } from './EditControlsTab'
import { BuildControlsTab } from './BuildControlsTab'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'
import { useControlsWidthContext } from './useControlWidth'
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
  controlsContainerRef
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
  controlsContainerRef: React.RefObject<null>
}) => {
  const [value, setValue] = React.useState(0)
  const { isSideControls } = useMuiMediaQuery()
  const {
    isMediumControls,
    isSmallControls,
  } = useControlsWidthContext()
  const tabFontSize = isSmallControls ? '0.8em' : isMediumControls ? '0.8em' : '1rem'
  const tabMinHeight = isSmallControls ? '22px' : isMediumControls ? '25px' : '31px'
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
                title="Show controls for building the map"
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
                title="Show controls for loading, downloading, sharing, or creating new map files"
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
                title="Show controls for editing details of the current map"
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
                title="Show controls for taking a map picture, controlling the camera, and editing preferences"
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
          marginTop: tabMinHeight
        }}
      >
        {/* BUILD */}
        <CustomTabPanel value={value} index={0}>
          <BuildControlsTab />
        </CustomTabPanel>
        {/* FILE */}
        <CustomTabPanel value={value} index={1}>
          <FileControlsTab />
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
          />
        </CustomTabPanel>
      </Box>
    </Box>
  )
}

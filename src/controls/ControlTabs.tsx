import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import type { CameraControls } from '@react-three/drei'
import type { Group, Object3DEventMap } from 'three'
import { LoadFileHiddenInputs } from '../layout/LoadFileHiddenInputs'
import { FileControlsTab } from './FileControlsTab'
import ViewControlsTab from './ViewControlsTab'
import { EditControlsTab } from './EditControlsTab'
import { BuildControlsTab } from './BuildControlsTab'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { IconButton } from '@mui/material'
import { useMuiMediaQuery } from '../layout/useMuiMediaQuery'

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
  toggleisControlTabMinimized,
  isControlTabMinimized,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
  toggleisControlTabMinimized: (s: boolean) => void
  isControlTabMinimized: boolean
}) => {
  const [value, setValue] = React.useState(0)
  const { isLandscapeOrientation, isSmallScreenLandscapeOrientation, isMediumScreenLandscapeOrientation } = useMuiMediaQuery()
  const isSideControls = isLandscapeOrientation
  const handleChange = (newValue: number) => {
    setValue(newValue)
  }

  return (
    <Box
      sx={{
        width: '100%',
        // overflow: isControlTabMinimized ? 'hidden' : 'auto',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          backgroundColor: 'var(--black)',
          zIndex: 100,
          width: isSideControls ? 'var(--controls-width)' : '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            p: 0,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={value}
            onChange={(_, n) => handleChange(n)}
            aria-label="control tabs"
            // centered
            sx={{
              fontSize: (isSmallScreenLandscapeOrientation) ? '0.8em' : isMediumScreenLandscapeOrientation ? '0.9em' : '1em',
              // minHeight: 30,
              minHeight: isSmallScreenLandscapeOrientation ? 20 : 30,
              minWidth: isSmallScreenLandscapeOrientation ? 40 : isMediumScreenLandscapeOrientation ? 50 : 90,
            }}
          >
            <Tab
              label="Build"
              {...a11yProps(0)}
              onClick={() => toggleisControlTabMinimized(false)}
              sx={{
                fontSize: (isSmallScreenLandscapeOrientation) ? '0.8em' : isMediumScreenLandscapeOrientation ? '0.9em' : '1em',
                p: 0,
                m: 0,
                // minHeight: 30,
                minHeight: isSmallScreenLandscapeOrientation ? 20 : 30,
                minWidth: isSmallScreenLandscapeOrientation ? 40 : isMediumScreenLandscapeOrientation ? 50 : 90,
              }}
            />
            <Tab
              label="File"
              {...a11yProps(1)}
              onClick={() => toggleisControlTabMinimized(false)}
              sx={{
                fontSize: (isSmallScreenLandscapeOrientation) ? '0.8em' : isMediumScreenLandscapeOrientation ? '0.9em' : '1em',
                p: 0,
                m: 0,
                // minHeight: 30,
                minHeight: isSmallScreenLandscapeOrientation ? 20 : 30,
                minWidth: isSmallScreenLandscapeOrientation ? 40 : isMediumScreenLandscapeOrientation ? 50 : 90,
              }}
            />
            <Tab
              label="Edit"
              {...a11yProps(2)}
              onClick={() => toggleisControlTabMinimized(false)}
              sx={{
                fontSize: (isSmallScreenLandscapeOrientation) ? '0.8em' : isMediumScreenLandscapeOrientation ? '0.9em' : '1em',
                p: 0,
                m: 0,
                // minHeight: 30,
                minHeight: isSmallScreenLandscapeOrientation ? 20 : 30,
                minWidth: isSmallScreenLandscapeOrientation ? 40 : isMediumScreenLandscapeOrientation ? 50 : 90,
              }}
            />
            <Tab
              label="View"
              {...a11yProps(3)}
              onClick={() => toggleisControlTabMinimized(false)}
              sx={{
                fontSize: (isSmallScreenLandscapeOrientation) ? '0.8em' : isMediumScreenLandscapeOrientation ? '0.9em' : '1em',
                p: 0,
                m: 0,
                // minHeight: 30,
                minHeight: isSmallScreenLandscapeOrientation ? 20 : 30,
                minWidth: isSmallScreenLandscapeOrientation ? 40 : isMediumScreenLandscapeOrientation ? 50 : 90,
              }}
            />
          </Tabs>
          {!isSideControls && (
            <IconButton
              onClick={() =>
                toggleisControlTabMinimized(!isControlTabMinimized)
              }
              sx={{ fontSize: 12 }}
            >
              {isControlTabMinimized ? <MdExpandLess /> : <MdExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>
      {/* HIDDEN FILE INPUTS */}
      <LoadFileHiddenInputs />
      <div
        style={{
          // maxHeight: 0,
          overflow: isControlTabMinimized ? 'hidden' : 'auto',
          //  height: 0
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
      </div>
    </Box>
  )
}
//   {
//   const [value, setValue] = React.useState('1');

//   const handleChange = (event: React.SyntheticEvent, newValue: string) => {
//     setValue(newValue);
//   };

//   return (
//     <Box sx={{ width: '100%', typography: 'body1' }}>
//       <TabContext value={value}>
//         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//           <TabList onChange={handleChange} aria-label="lab API tabs example">
//             <Tab label="Build" value="1" />
//             <Tab label="File" value="2" />
//             <Tab label="Edit" value="3" />
//             <Tab label="View" value="4" />
//           </TabList>
//         </Box>
//         <TabPanel value="1">
//           <Controls
//             cameraControlsRef={cameraControlsRef}
//             mapGroupRef={mapGroupRef}
//           />
//         </TabPanel>
//         <TabPanel value="2">
//           <Controls
//             cameraControlsRef={cameraControlsRef}
//             mapGroupRef={mapGroupRef}
//           />
//         </TabPanel>
//         <TabPanel value="3">
//           <Controls
//             cameraControlsRef={cameraControlsRef}
//             mapGroupRef={mapGroupRef}
//           />
//         </TabPanel>
//       </TabContext>
//     </Box>
//   );
// }

import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Controls from './Controls';
import type { CameraControls } from '@react-three/drei';
import type { Group, Object3DEventMap } from 'three';
import { LoadFileHiddenInputs } from '../layout/LoadFileHiddenInputs';
import { FileControlsTab } from './FileControlsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

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
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
export const ControlTabs = ({
  cameraControlsRef,
  mapGroupRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, n) => handleChange(n)} aria-label="basic tabs example">
          <Tab label="Build" {...a11yProps(0)} />
          <Tab label="File" {...a11yProps(1)} />
          <Tab label="Edit" {...a11yProps(2)} />
          <Tab label="View" {...a11yProps(3)} />
        </Tabs>
      </Box>
      {/* HIDDEN FILE INPUTS */}
      <LoadFileHiddenInputs />
      {/* BUILD */}
      <CustomTabPanel value={value} index={0}>
        <Controls
          cameraControlsRef={cameraControlsRef}
          mapGroupRef={mapGroupRef}
        />
      </CustomTabPanel>
      {/* FILE */}
      <CustomTabPanel value={value} index={1}>
        <FileControlsTab />
      </CustomTabPanel>
      {/* EDIT */}
      <CustomTabPanel value={value} index={2}>
        <Controls
          cameraControlsRef={cameraControlsRef}
          mapGroupRef={mapGroupRef}
        />
      </CustomTabPanel>
      {/* VIEW */}
      <CustomTabPanel value={value} index={3}>
        <Controls
          cameraControlsRef={cameraControlsRef}
          mapGroupRef={mapGroupRef}
        />
      </CustomTabPanel>
    </Box>
  );
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
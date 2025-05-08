import React from 'react'
import { Drawer, useMediaQuery } from '@mui/material'
import { DrawerList } from './DrawerList'
import { HeaderNav } from './HeaderNav'
import Controls from '../controls/Controls'
import World from '../world/World'
import CreateMapFormDialog from './CreateMapFormDialog'
import EditMapFormDialog from './EditMapFormDialog'
import { LoadMapInputs } from './LoadMapButtons'
import CameraSpeedDial from './CameraSpeedDial'
import { ReactPdfRoot } from '../pdf-map/ReactPdfRoot'
import useAutoLoadMapFile from '../hooks/useAutoLoadMapFile'
import { SvgMapDisplay } from '../svg-map/SvgMapDisplay'
import { shatteredTableBoardHexes } from '../data/shatteredTableBoardHexes'

export default function HomePage() {
  const cameraControlsRef = React.useRef(undefined!)

  // https://robohash.org/you.png?size=200x200
  // USE EFFECT: automatically load up map from URL, OR from file
  useAutoLoadMapFile({ boardHexes: shatteredTableBoardHexes })


  // MUI BREAKPOINTS
  //   xs, extra-small: 0px
  // sm, small: 600px
  // md, medium: 900px
  // lg, large: 1200px
  // xl, extra-large: 1536px

  const isLargeScreenLayout = useMediaQuery('(min-width:1200px)');
  const isMobileScreenLayout = useMediaQuery('(max-width:600px)');

  const [isNavOpen, setIsNavOpen] = React.useState(false)
  const toggleIsNavOpen = (s: boolean) => {
    setIsNavOpen(s)
  }
  const [isPdfOpen, setIsPdfOpen] = React.useState(false)
  const toggleIsPdfOpen = (s: boolean) => {
    setIsPdfOpen(s)
  }
  const [is2DOpen, setIs2DOpen] = React.useState(false)
  const toggleIs2DOpen = (s: boolean) => {
    setIsPdfOpen(false)
    setIs2DOpen(s)
  }

  return (
    <>
      <CreateMapFormDialog />
      <EditMapFormDialog />
      <Drawer
        open={isNavOpen}
        // open={true} // DEV toggle
        onClose={() => toggleIsNavOpen(false)}
        keepMounted
      >
        <DrawerList toggleIsNavOpen={toggleIsNavOpen} />
      </Drawer>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          padding: 0,
          margin: 0,
        }}
      >
        <HeaderNav
          isMobileScreenLayout={isMobileScreenLayout}
          isNavOpen={isNavOpen}
          toggleIsNavOpen={toggleIsNavOpen}
          isPdfOpen={isPdfOpen}
          toggleIsPdfOpen={toggleIsPdfOpen}
          is2DOpen={is2DOpen}
          toggleIs2DOpen={toggleIs2DOpen}
        />
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: isLargeScreenLayout ? 'row-reverse' : 'column',
            width: '100%',
            padding: 0,
            margin: 0,
            overflow: 'auto',
          }}
        >

          <div
            style={{
              flex: 1,
              position: 'relative',
              width: isLargeScreenLayout ? '70vw' : '100%',
              height: isLargeScreenLayout ? '100%' : '70vh',
            }}
          >
            {
              isPdfOpen && (
                <ReactPdfRoot />
              )}
            {(is2DOpen && !isPdfOpen) && (
              <SvgMapDisplay />
            )}
            <>
              {(!is2DOpen && !isPdfOpen) && <CameraSpeedDial cameraControlsRef={cameraControlsRef} />}
              <World isHidden={is2DOpen || isPdfOpen} cameraControlsRef={cameraControlsRef} />
            </>


          </div>
          <div
            style={{
              display: 'flex',
              flexFlow: 'column nowrap',
              width: isLargeScreenLayout ? '450px' : '100%',
              height: isLargeScreenLayout ? '100%' : '30vh',
              background: 'var(--black)',
              overflow: 'auto',
            }}
          >
            <Controls />
            <LoadMapInputs />
          </div>
        </div>
      </div>
    </>
  )
}

import { Box, Drawer, useMediaQuery } from '@mui/material'
import React, { useEffect } from 'react'
import useAutoLoadMapFile from '../hooks/useAutoLoadMapFile'
import { ReactPdfRoot } from '../pdf-map/ReactPdfRoot'
import { SvgMapDisplay } from '../svg-map/SvgMapDisplay'
import World from '../world/World'
import CreateMapFormDialog from './CreateMapFormDialog'
import EditMapFormDialog from './EditMapFormDialog'
import { HeaderNav } from './HeaderNav'
import useBoundStore from '../store/store'
import type { Group, Object3DEventMap } from 'three'
import { EditPieceInventoryDialog } from '../inventory/EditPieceInventoryDialog'
import { ControlTabs } from '../controls/ControlTabs'
import { useMuiMediaQuery } from './useMuiMediaQuery'

export default function HomePage() {
  const cameraControlsRef = React.useRef(null)
  const hexMap = useBoundStore((s) => s.hexMap)
  const mapGroupRef = React.useRef<Group<Object3DEventMap> | null>(null)
  // https://robohash.org/you.png?size=200x200
  // USE EFFECT: automatically load up map from URL, OR from file
  useAutoLoadMapFile()

  // MUI BREAKPOINTS
  //   xs, extra-small: 0px
  // sm, small: 600px
  // md, medium: 900px
  // lg, large: 1200px
  // xl, extra-large: 1536px
  const {
    isLargeScreenLayout,
  } = useMuiMediaQuery()

  const [isPdfOpen, setIsPdfOpen] = React.useState(false)
  const toggleIsPdfOpen = (s: boolean) => {
    setIsPdfOpen(s)
  }
  const [isControlTabMinimized, setIsControlTabMinimized] = React.useState(false)
  const toggleisControlTabMinimized = (s: boolean) => {
    setIsControlTabMinimized(s)
  }
  const [is2DOpen, setIs2DOpen] = React.useState(false)
  const toggleIs2DOpen = (s: boolean) => {
    setIsPdfOpen(false)
    setIs2DOpen(s)
  }
  useEffect(() => {
    if (hexMap.name) {
      const prevTitle = document.title
      document.title = hexMap.name
      return () => {
        document.title = prevTitle
      }
    }
  }, [hexMap.name])
  return (
    <>
      <CreateMapFormDialog />
      <EditMapFormDialog />
      <EditPieceInventoryDialog />
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
          isPdfOpen={isPdfOpen}
          toggleIsPdfOpen={toggleIsPdfOpen}
          is2DOpen={is2DOpen}
          toggleIs2DOpen={toggleIs2DOpen}
        />
        <Box
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
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              width: isLargeScreenLayout ? '70vw' : '100%',
              height: isLargeScreenLayout ? '100%' : '70vh',
            }}>
            {isPdfOpen && <ReactPdfRoot />}
            {is2DOpen && !isPdfOpen && <SvgMapDisplay />}
            <World
              isHidden={is2DOpen || isPdfOpen}
              cameraControlsRef={cameraControlsRef}
              mapGroupRef={mapGroupRef}
            />
          </Box>

          <div
            style={{
              display: 'flex',
              flexFlow: 'column nowrap',
              width: isLargeScreenLayout ? '30vw' : '100%',
              // fullscreen => full device height, no option to minimize
              // smaller-screen => can be minimized/maxiized, only bottom part of device height
              height: isLargeScreenLayout ? '100%' : isControlTabMinimized ? '30px' : '30vh',
              background: 'var(--black)',
              overflow: 'auto',
              flexShrink: 1,
              transition: 'height 0.5s ease-in-out',

            }}
          >
            <ControlTabs
              cameraControlsRef={cameraControlsRef}
              mapGroupRef={mapGroupRef}
              toggleisControlTabMinimized={toggleisControlTabMinimized}
              isControlTabMinimized={isControlTabMinimized}
            />
          </div>
        </Box>
      </div>
    </>
  )
}

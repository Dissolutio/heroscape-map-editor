import { Box } from '@mui/material'
import React, { useEffect } from 'react'
import useAutoLoadMapFile from '../hooks/useAutoLoadMapFile'
import { ReactPdfRoot } from '../pdf-map/ReactPdfRoot'
import { SvgMapDisplay } from '../svg-map/SvgMapDisplay'
import World from '../world/World'
import CreateMapFormDialog from './CreateMapFormDialog'
import EditMapFormDialog from './EditMapFormDialog'
import { HeaderNav } from './HeaderNav'
import useBoundStore from '../store/store'
import { Box3, type Group, type Object3DEventMap } from 'three'
import { EditPieceInventoryDialog } from '../inventory/EditPieceInventoryDialog'
import { ControlTabs } from './ControlTabs'
import { useMuiMediaQuery } from './useMuiMediaQuery'
import ViewMapInventoryDialog from '../inventory/ViewMapInventoryDialog'
import { ControlsWidthContextProvider } from '../controls/useControlWidth'
import type { BoardHexes } from '../types'
import type { CameraControls } from '@react-three/drei'

export default function HomePage() {
  const cameraControlsRef = React.useRef<CameraControls>(null)
  const hexMap = useBoundStore((s) => s.hexMap)
  const mapGroupRef = React.useRef<Group<Object3DEventMap> | null>(null)
  const controlsContainerRef = React.useRef(null)
  // https://robohash.org/you.png?size=200x200
  // USE EFFECT: automatically load up map from URL, OR from file
  useAutoLoadMapFile()

  // MUI BREAKPOINTS
  //   xs, extra-small: 0px
  // sm, small: 600px
  // md, medium: 900px
  // lg, large: 1200px
  // xl, extra-large: 1536px
  const { isSideControls } = useMuiMediaQuery()

  const [isPdfOpen, setIsPdfOpen] = React.useState(false)
  const toggleIsPdfOpen = (s: boolean) => {
    setIsPdfOpen(s)
  }
  const [is2DOpen, setIs2DOpen] = React.useState(false)
  const toggleIs2DOpen = (s: boolean) => {
    setIsPdfOpen(false)
    setIs2DOpen(s)
  }
  // EFFECT: update doc title
  useEffect(() => {
    if (hexMap.name) {
      const prevTitle = document.title
      document.title = hexMap.name
      return () => {
        document.title = prevTitle
      }
    }
  }, [hexMap.name])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <run on map change>
  useEffect(() => {
    if (mapGroupRef.current && cameraControlsRef.current) {
      // Create a new bounding box from the updated group.
      const box = new Box3().setFromObject(mapGroupRef.current)
      // Tell CameraControls to fit to the new bounding box (this magically allows zoomToMap (and hotkey usage) to work again, do not know how)
      cameraControlsRef.current?.fitToBox(box, true)
    }
  }, [hexMap.id])

  return (
    <>
      <CreateMapFormDialog />
      <EditMapFormDialog />
      <EditPieceInventoryDialog />
      <ViewMapInventoryDialog />
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
            flexDirection: isSideControls ? 'row-reverse' : 'column',
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
              flexGrow: 1,
              width: isSideControls ? 'calc(100% - 70vw)' : '100%',
              height: isSideControls ? '100%' : '70vh',
            }}
          >
            {isPdfOpen && <ReactPdfRoot />}
            {is2DOpen && !isPdfOpen && <SvgMapDisplay />}
            <World
              isHidden={is2DOpen || isPdfOpen}
              cameraControlsRef={cameraControlsRef}
              mapGroupRef={mapGroupRef}
            />
          </Box>
          <ControlsWidthContextProvider containerRef={controlsContainerRef}>
            <div
              style={{
                display: 'flex',
                flexFlow: 'column nowrap',
                width: isSideControls ? 'var(--controls-width)' : '100%',
                flexBasis: isSideControls
                  ? 'var(--controls-width)'
                  : 'max(30vh, 250px)',
                height: isSideControls ? '100%' : 'max(30vh, 250px)',
                background: 'var(--black)',
                overflow: 'auto',
                transition: 'height 0.5s ease-in-out',
              }}
            >
              <ControlTabs
                cameraControlsRef={cameraControlsRef}
                mapGroupRef={mapGroupRef}
                controlsContainerRef={controlsContainerRef}
                is2DOpen={is2DOpen}
              />
            </div>
          </ControlsWidthContextProvider>
        </Box>
      </div>
    </>
  )
}

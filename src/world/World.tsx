import { ClickAwayListener } from '@mui/material'
import {
  Billboard,
  type CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
  Stats,
  Text,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import SelectedPieceReadout from '../controls/SelectedPieceReadout'
import useBoundStore from '../store/store'
import { CAMERA_FOV } from '../utils/constants'
import Lights from './Lights'
import MapDisplay3D from './MapDisplay3D'
import MyCameraControls from './camera/MyCameraControls'
import TakeAPictureBox from './camera/TakeAPictureBox'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'
import type { Group, Object3DEventMap } from 'three'
import type React from 'react'
import { useEffect, useState } from 'react'

const BILLBOARD_WARMUP_MS = 4000

function BillboardWarmup() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, BILLBOARD_WARMUP_MS)

    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!isVisible) {
    return null
  }

  // Keep this tiny and off-screen: it only exists to force billboard init
  // before user-facing billboards are toggled on.
  return (
    <Billboard position={[0, 0, 0]}>
      <Text font="/fonts/Inter_18pt-Bold.ttf" fontSize={0.14} color={'white'}>
        .
      </Text>
    </Billboard>
  )
}

const World = ({
  cameraControlsRef,
  mapGroupRef,
  isHidden,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  mapGroupRef: React.RefObject<Group<Object3DEventMap>>
  isHidden: boolean
}) => {
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isFrameloopDemand = useBoundStore((s) => s.isFrameloopDemand)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const [isTabActive, setIsTabActive] = useState(true)
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const isTakingPicture = useBoundStore(s => s.isTakingPicture)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const handleClickAway = () => {
    toggleHoveredPieceID('')
    // toggleSelectedPieceID('')
  }

  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: isHidden ? 'none' : 'block',
          position: 'relative',
          backgroundColor: 'var(--black)',
        }}
      >
        <Canvas
          onPointerMissed={(event) => {
            if (event.button !== 0) {
              return
            }
            toggleHoveredPieceID('')
            toggleSelectedPieceID('')
          }}
          onPointerLeave={() => {
            toggleHoveredPieceID('')
          }}
          /* Setting frameloop to "never" entirely halts the GPU loop when idle */
          frameloop={
            !isTabActive ? 'never' : isFrameloopDemand ? 'demand' : 'always'
          }
          hidden={isHidden}
          shadows={isLightsAndShadowsRender}
        >
          <color attach="background" args={['white']} />
          <PerspectiveCamera
            position={[10, 10, 10]}
            fov={CAMERA_FOV}
            makeDefault={!isOrthoCam}
          />
          {/* // Example: FOV set to 15 (instead of the standard 50-75) and moved 1000 units away */}
          {/* <PerspectiveCamera
            makeDefault={!isOrthoCam}
            fov={15}
            position={[500, 500, 1000]}
            near={10}
            far={2000}
          /> */}
          <OrthographicCamera
            makeDefault={isOrthoCam}
            position={[100, 1000, 100]}
            zoom={30}
          />
          {/* Stats displays the fps */}
          {!isHidden && import.meta.env.DEV && (
            <Stats className="stats-panel" />
          )}
          {/* TOP LEFT */}
          {!isTakingPicture && (
            <axesHelper position={[0, 0.1, 0]} scale={[width, 0, length]} />
          )}

          {/* BOTTOM RIGHT */}
          {/* <axesHelper
                  position={[width, 0, length]}
                  // position={[height - HEXGRID_HEX_APOTHEM, 0, length - 1]}
                  scale={[width, 0, length]}
                // rotation={new Euler(0, Math.PI, 0)}
                /> */}
          <MapDisplay3D
            mapGroupRef={mapGroupRef}
            cameraControlsRef={cameraControlsRef}
          />
          <BillboardWarmup />
          <Lights width={width} length={length} />
          {/* {!isTakingPicture && <GridHelper />} */}
          <MyCameraControls cameraControlsRef={cameraControlsRef} />
          <TakeAPictureBox />
        </Canvas>
        <SelectedPieceReadout cameraControlsRef={cameraControlsRef} />
        {/* <HoveredPieceReadout /> */}
      </div>
    </ClickAwayListener>
  )
}

export default World

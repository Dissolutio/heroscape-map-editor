import { ClickAwayListener } from '@mui/material'
import {
  type CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
  Stats,
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
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const isTakingPicture = useBoundStore(s => s.isTakingPicture)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const handleClickAway = () => {
    toggleHoveredPieceID('')
    // toggleSelectedPieceID('')
  }
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: isHidden ? 'none' : 'block',
          position: 'relative',
          backgroundColor: 'var(--black)'
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
          frameloop={isFrameloopDemand ? 'demand' : undefined}
          hidden={isHidden}
          shadows={isLightsAndShadowsRender}
        >
          <color attach="background" args={["white"]} />
          <PerspectiveCamera
            position={[10, 10, 10]}
            fov={CAMERA_FOV}
            makeDefault={!isOrthoCam}
          />
          <OrthographicCamera
            position={[100, 1000, 100]}
            zoom={30}
            makeDefault={isOrthoCam}
          />
          {/* Stats displays the fps */}
          {!isHidden && import.meta.env.DEV && (
            <Stats className="stats-panel" />
          )}
          <MapDisplay3D
            mapGroupRef={mapGroupRef}
            cameraControlsRef={cameraControlsRef}
          />
          <Lights width={width} length={length} />
          {/* {!isTakingPicture && <GridHelper />} */}
          <MyCameraControls cameraControlsRef={cameraControlsRef} />
          <TakeAPictureBox />
        </Canvas>
        <SelectedPieceReadout />
        {/* <HoveredPieceReadout /> */}
      </div>
    </ClickAwayListener>
  )
}

export default World

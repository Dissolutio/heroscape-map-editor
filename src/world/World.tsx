import { ClickAwayListener } from '@mui/material'
import {
  type CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
  Stats,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import type * as THREE from 'three'
import SelectedPieceReadout from '../controls/SelectedPieceReadout'
import useBoundStore from '../store/store'
import { CAMERA_FOV } from '../utils/constants'
import Lights from './Lights'
import MapDisplay3D from './MapDisplay3D'
import MyCameraControls from './camera/MyCameraControls'
import TakeAPictureBox from './camera/TakeAPictureBox'
import { getBoardHexesRectangularMapDimensions } from '../utils/map-utils'

const World = ({
  cameraControlsRef,
  isHidden,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  isHidden: boolean
}) => {
  const mapGroupRef = React.useRef<THREE.Group<THREE.Object3DEventMap> | null>(
    null,
  )
  const boardHexes = useBoundStore((s) => s.boardHexes)
  const isOrthoCam = useBoundStore((s) => s.isOrthoCam)
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const isFrameloopDemand = useBoundStore((s) => s.isFrameloopDemand)
  const { width, length } = getBoardHexesRectangularMapDimensions(boardHexes)
  // const isTakingPicture = useBoundStore(s => s.isTakingPicture)
  const toggleHoveredPieceID = useBoundStore((s) => s.toggleHoveredPieceID)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const handleClickAway = () => {
    toggleHoveredPieceID('')
    toggleSelectedPieceID('')
  }
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: isHidden ? 'none' : 'block',
          position: 'relative',
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
          shadows={isHighQualityRender}
        >
          {/* <color attach="background" args={["white"]} /> */}
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
          {(!isHidden && import.meta.env.DEV) && <Stats className="stats-panel" />}
          <MapDisplay3D
            mapGroupRef={mapGroupRef}
            cameraControlsRef={cameraControlsRef}
          />
          {/* <Lights width={width} length={length} /> */}
          <Lights />
          {/* {!isTakingPicture && <GridHelper />} */}
          <MyCameraControls
            cameraControlsRef={cameraControlsRef}
            mapGroupRef={mapGroupRef}
          />
          <TakeAPictureBox />
        </Canvas>
        <SelectedPieceReadout />
        {/* <HoveredPieceReadout /> */}
      </div>
    </ClickAwayListener>
  )
}

export default World

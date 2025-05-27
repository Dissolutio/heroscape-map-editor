import { Drawer, useMediaQuery } from '@mui/material'
import React from 'react'
import Controls from '../controls/Controls'
import useAutoLoadMapFile from '../hooks/useAutoLoadMapFile'
import { ReactPdfRoot } from '../pdf-map/ReactPdfRoot'
import { SvgMapDisplay } from '../svg-map/SvgMapDisplay'
import World from '../world/World'
import CameraSpeedDial from './CameraSpeedDial'
import CreateMapFormDialog from './CreateMapFormDialog'
import { DrawerList } from './DrawerList'
import EditMapFormDialog from './EditMapFormDialog'
import { HeaderNav } from './HeaderNav'
import { LoadMapInputs } from './LoadMapButtons'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { HEXGRID_HEX_APOTHEM, HEXGRID_HEX_RADIUS, HEXGRID_HEXCAP_FLUID_HEIGHT } from '../utils/constants'
import { CylinderGeometryArgs } from '../world/maphex/instance-hex'
import { DoubleSide } from 'three'

const baseCylinderArgs: CylinderGeometryArgs = [
  0.9,
  0.997,
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  6,
  undefined,
  false,
  undefined,
  undefined,
]

export default function HomePage() {
  const cameraControlsRef = React.useRef(null)

  // https://robohash.org/you.png?size=200x200
  // USE EFFECT: automatically load up map from URL, OR from file
  useAutoLoadMapFile()

  // MUI BREAKPOINTS
  //   xs, extra-small: 0px
  // sm, small: 600px
  // md, medium: 900px
  // lg, large: 1200px
  // xl, extra-large: 1536px

  const isLargeScreenLayout = useMediaQuery('(min-width:1200px)')
  const isMobileScreenLayout = useMediaQuery('(max-width:600px)')

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
  const { nodes: nodes1HexSubTerrain } = useGLTF('/subterrain_1.glb') as any
  const { nodes: nodesLaurPillar } = useGLTF('/laurwall-pillar.glb') as any

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
          // GRID BACKGROUND FROM HERO PATTERNS: https://heropatterns.com/
          // backgroundColor: '#011307',
          // backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23b4b4b4' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
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
            {isPdfOpen && <ReactPdfRoot />}
            {is2DOpen && !isPdfOpen && <SvgMapDisplay />}
            <>
              {!is2DOpen && !isPdfOpen && (
                <CameraSpeedDial cameraControlsRef={cameraControlsRef} />
              )}
              <World
                isHidden={is2DOpen || isPdfOpen}
                cameraControlsRef={cameraControlsRef}
              />
              {/* 
              <Canvas shadows>
                <ambientLight intensity={0.3} />
                <directionalLight
                  castShadow
                  position={[5, 5, 5]}
                  intensity={1}
                  shadow-mapSize-height={1024}
                  shadow-mapSize-width={1024}
                />
                <mesh
                  castShadow
                  receiveShadow
                  geometry={nodes1HexSubTerrain.Subterrain_1.geometry}>
                  <meshStandardMaterial
                    color={"#BADA55"}
                  />
                </mesh>
                <group
                  position={[1 * HEXGRID_HEX_APOTHEM, 0, 1.5 * HEXGRID_HEX_RADIUS]}
                >
                  <group position={[0, HEXGRID_HEXCAP_FLUID_HEIGHT / 2, 0]}>
                    <mesh castShadow geometry={nodesLaurPillar.PillarTop.geometry}>
                      <meshStandardMaterial
                        color={"##7F7CAF"}
                      />
                    </mesh>
                    <mesh castShadow geometry={nodesLaurPillar.SubDecorCore.geometry}>
                      <meshStandardMaterial
                        color={"#7774AA"}
                      />
                    </mesh>
                    <mesh castShadow geometry={nodesLaurPillar.Facade.geometry}>
                      <meshStandardMaterial
                        side={DoubleSide}
                        color={"##7F7CAF"}
                      />
                    </mesh>
                    <mesh castShadow geometry={nodesLaurPillar.FacadeInner.geometry}>
                      <meshStandardMaterial
                        side={DoubleSide}
                        color={"#7774AA"}
                      />
                    </mesh>
                  </group>
                  <group position={[0, 0, 0]}>
                    <mesh>
                      <cylinderGeometry args={baseCylinderArgs} />
                      <meshStandardMaterial
                        color={"##7F7CAF"}
                      />
                    </mesh>

                  </group>
                </group>

                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                  <planeGeometry args={[10, 10]} />
                  <shadowMaterial color="lightgray" opacity={0.5} />
                </mesh>
                <OrbitControls />
              </Canvas>
               */}
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

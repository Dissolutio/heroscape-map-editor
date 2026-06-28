import { TransformControls } from '@react-three/drei'
import useBoundStore from '../store/store'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const initialHeight = 15
  return (
    <>
      <ambientLight intensity={isLightsAndShadowsRender ? 0.5 : 0.3} />
      <hemisphereLight
        color={'#ffffbb'}
        groundColor={'#080820'}
        intensity={0.1}
      />
      <TransformControls
        position={[width / 3, initialHeight, length / 3]}
      >

        <directionalLight
          castShadow
          position={[0, 10, 0]}
          intensity={2}
          shadow-mapSize={[512, 512]} // Boosts shadow sharpness
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      </TransformControls>
      {/* {isLightsAndShadowsRender && (
        <>
          <TransformControls
            position={[width / 3, initialHeight, length / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              color={'white'}
              castShadow={isLightsAndShadowsRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[width / 3, initialHeight, (2 * length) / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              color={'yellow'}
              castShadow={isLightsAndShadowsRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[(2 * width) / 3, initialHeight, length / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              color={'red'}
              castShadow={isLightsAndShadowsRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[(2 * width) / 3, initialHeight, (2 * length) / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              color={'orange'}
              castShadow={isLightsAndShadowsRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
        </>
      )} */}
    </>
  )
}

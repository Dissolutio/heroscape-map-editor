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
      <ambientLight intensity={isLightsAndShadowsRender ? 0.5 : 2} />
      <hemisphereLight
        color={'#ffffbb'}
        groundColor={'#080820'}
        intensity={0.5}
      />
      {!isLightsAndShadowsRender && (
        <>
          <pointLight
            position={[width / 3, initialHeight, length / 3]}
            color={'white'}
            castShadow={isLightsAndShadowsRender}
            intensity={1000}
            shadow-mapSize-height={512}
            shadow-mapSize-width={512}
          />
          <pointLight
            position={[width / 3, initialHeight, (2 * length) / 3]}
            color={'white'}
            castShadow={isLightsAndShadowsRender}
            intensity={1000}
            shadow-mapSize-height={512}
            shadow-mapSize-width={512}
          />
          <pointLight
            position={[(2 * width) / 3, initialHeight, length / 3]}
            color={'white'}
            castShadow={isLightsAndShadowsRender}
            intensity={1000}
            shadow-mapSize-height={512}
            shadow-mapSize-width={512}
          />
          <pointLight
            position={[(2 * width) / 3, initialHeight, (2 * length) / 3]}
            color={'white'}
            castShadow={isLightsAndShadowsRender}
            intensity={1000}
            shadow-mapSize-height={512}
            shadow-mapSize-width={512}
          />
        </>
      )}
      {isLightsAndShadowsRender && (
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
              intensity={1000}
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
              intensity={1000}
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
              intensity={1000}
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
              intensity={1000}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
        </>
      )}
    </>
  )
}

import { TransformControls } from '@react-three/drei'
import useBoundStore from '../store/store'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isLightsAndShadowsRender = useBoundStore((s) => s.isLightsAndShadowsRender)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const initialHeight = 15
  return (
    <>
      <ambientLight intensity={isLightsAndShadowsRender ? 0.5 : 2} />
      <hemisphereLight color={'white'} groundColor={'white'} intensity={0.5} />
      {isLightsAndShadowsRender && (
        <>
          <TransformControls
            position={[width / 3, initialHeight, length / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
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
              castShadow={isLightsAndShadowsRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
        </>
      )}
    </>
  )
}

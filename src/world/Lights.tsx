import { TransformControls } from '@react-three/drei'
import useBoundStore from '../store/store'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  return (
    <>
      <ambientLight intensity={isHighQualityRender ? 0.5 : 2} />
      <hemisphereLight color={'white'} groundColor={'white'} intensity={0.5} />
      {isHighQualityRender && (
        <>
          <TransformControls
            position={[width / 3, 10, length / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              castShadow={isHighQualityRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[width / 3, 10, (2 * length) / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              castShadow={isHighQualityRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[(2 * width) / 3, 10, length / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              castShadow={isHighQualityRender}
              intensity={200}
              shadow-mapSize-height={512}
              shadow-mapSize-width={512}
            />
          </TransformControls>
          <TransformControls
            position={[(2 * width) / 3, 10, (2 * length) / 3]}
            showX={!isTakingPicture}
            showY={!isTakingPicture}
            showZ={!isTakingPicture}
          >
            <pointLight
              castShadow={isHighQualityRender}
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

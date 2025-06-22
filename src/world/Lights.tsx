import { TransformControls } from '@react-three/drei'
import useBoundStore from '../store/store'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  return (
    <>
      <ambientLight intensity={isHighQualityRender ? 0.3 : 2} />
      <hemisphereLight
        castShadow={isHighQualityRender}
        color={'0xffffff'}
        groundColor={'0xffffff'}
        intensity={0.2}
      />
      {isHighQualityRender && (
        <TransformControls position={[width / 2, 20, length / 2]}>
          <pointLight
            castShadow={isHighQualityRender}
            intensity={200}
            shadow-mapSize-height={512}
            shadow-mapSize-width={512}
          />
        </TransformControls>
      )}
    </>
  )
}

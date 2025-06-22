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

export function TableSurfaceMesh({
  width,
  length,
}: { width: number; length: number }) {
  const isHighQualityRender = useBoundStore((s) => s.isHighQualityRender)
  if (!isHighQualityRender) {
    return null
  }
  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[
        width ? width / 2 - HEXGRID_HEX_APOTHEM : 0,
        -0.01,
        length ? length / 2 - HEXGRID_HEX_RADIUS : 0,
      ]}
    >
      <planeGeometry args={[3 * width, 3 * length]} />
      <shadowMaterial color="white" opacity={1} />
      {/* <meshStandardMaterial color="brown" opacity={1} /> */}
      {/* <meshPhongMaterial color="lightgray" opacity={0.5} /> */}
    </mesh>
  )
}


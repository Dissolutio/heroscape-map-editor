import { TransformControls } from '@react-three/drei'

export default function Lights({
  width,
  length,
}: { width?: number; length?: number }) {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight
        castShadow
        position={[10, 3, 10]}
        intensity={1}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <directionalLight
        castShadow
        position={[10, 3, 10]}
        intensity={0.2}
        color="yellow"
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <directionalLight
        castShadow
        position={[10, 3, 10]}
        intensity={0.2}
        color="red"
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
    </>
  )
}

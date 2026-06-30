import { TransformControls } from '@react-three/drei'
import useBoundStore from '../store/store'
import { useRef } from 'react'

export default function VirtualscapeLighting() {
  // const dirLightRef = useRef()

  return (
    <>
      {/* 1. Ambient Light: Flat base illumination */}
      <ambientLight intensity={0.4} />

      {/* 2. Hemisphere Light: Soft sky-to-ground contrast */}
      <hemisphereLight args={[0xffffff, 0x444455, 0.6]} position={[0, 50, 0]} />

      {/* 3. Directional Light: Mimics overhead sun with shadows */}
      <directionalLight
        // ref={dirLightRef}
        position={[-10, 40, 20]}
        intensity={1.0}
        castShadow
        // Shadow map adjustments
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-bias={-0.001}
      />
    </>
  )
}

// export default function Lights({
//   width,
//   length,
// }: { width: number; length: number }) {
//   const isLightsAndShadowsRender = useBoundStore(
//     (s) => s.isLightsAndShadowsRender,
//   )
//   const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
//   const initialHeight = 15
//   return (
//     <>
//       <ambientLight intensity={isLightsAndShadowsRender ? 0.5 : 2} />
//       <hemisphereLight
//         color={'#ffffbb'}
//         groundColor={'#080820'}
//         intensity={0.5}
//       />
//       {isLightsAndShadowsRender && (
//         <>
//           <TransformControls
//             position={[width / 3, initialHeight, length / 3]}
//             showX={!isTakingPicture}
//             showY={!isTakingPicture}
//             showZ={!isTakingPicture}
//           >
//             <pointLight
//               color={'white'}
//               castShadow={isLightsAndShadowsRender}
//               intensity={200}
//               shadow-mapSize-height={512}
//               shadow-mapSize-width={512}
//             />
//           </TransformControls>
//           <TransformControls
//             position={[width / 3, initialHeight, (2 * length) / 3]}
//             showX={!isTakingPicture}
//             showY={!isTakingPicture}
//             showZ={!isTakingPicture}
//           >
//             <pointLight
//               color={'yellow'}
//               castShadow={isLightsAndShadowsRender}
//               intensity={200}
//               shadow-mapSize-height={512}
//               shadow-mapSize-width={512}
//             />
//           </TransformControls>
//           <TransformControls
//             position={[(2 * width) / 3, initialHeight, length / 3]}
//             showX={!isTakingPicture}
//             showY={!isTakingPicture}
//             showZ={!isTakingPicture}
//           >
//             <pointLight
//               color={'red'}
//               castShadow={isLightsAndShadowsRender}
//               intensity={200}
//               shadow-mapSize-height={512}
//               shadow-mapSize-width={512}
//             />
//           </TransformControls>
//           <TransformControls
//             position={[(2 * width) / 3, initialHeight, (2 * length) / 3]}
//             showX={!isTakingPicture}
//             showY={!isTakingPicture}
//             showZ={!isTakingPicture}
//           >
//             <pointLight
//               color={'orange'}
//               castShadow={isLightsAndShadowsRender}
//               intensity={200}
//               shadow-mapSize-height={512}
//               shadow-mapSize-width={512}
//             />
//           </TransformControls>
//         </>
//       )}
//     </>
//   )
// }

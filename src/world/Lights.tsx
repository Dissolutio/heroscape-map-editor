import { TransformControls } from '@react-three/drei'
import { useState } from 'react'
import type { PointLight } from 'three'
import useBoundStore from '../store/store'
import type { LightPosition } from '../store/ui-slice'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const lights: { id: string; position: LightPosition }[] = [
    { id: 'front-left', position: [width / 3, 15, length / 3] },
    { id: 'back-left', position: [width / 3, 15, (2 * length) / 3] },
    { id: 'front-right', position: [(2 * width) / 3, 15, length / 3] },
    { id: 'back-right', position: [(2 * width) / 3, 15, (2 * length) / 3] },
  ]
  return (
    <>
      <ambientLight intensity={isLightsAndShadowsRender ? 0.5 : 2} />
      <hemisphereLight
        color={'#ffffbb'}
        groundColor={'#080820'}
        intensity={0.5}
      />
      {isLightsAndShadowsRender &&
        lights.map(({ id, position }) => (
          <MovablePointLight key={id} id={id} defaultPosition={position} />
        ))}
    </>
  )
}

function MovablePointLight({
  id,
  defaultPosition,
}: { id: string; defaultPosition: LightPosition }) {
  const [light, setLight] = useState<PointLight | null>(null)
  const position = useBoundStore((s) => s.lightPositions[id])
  const updateLightPosition = useBoundStore((s) => s.updateLightPosition)
  const isShowLightControls = useBoundStore((s) => s.isShowLightControls)
  const isTakingPicture = useBoundStore((s) => s.isTakingPicture)
  const showControls = isShowLightControls && !isTakingPicture

  return (
    <>
      <pointLight
        ref={setLight}
        position={position ?? defaultPosition}
        color={'white'}
        castShadow
        intensity={200}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      {light && (
        <TransformControls
          object={light}
          enabled={showControls}
          showX={showControls}
          showY={showControls}
          showZ={showControls}
          onMouseUp={() =>
            updateLightPosition(id, [
              light.position.x,
              light.position.y,
              light.position.z,
            ])
          }
        />
      )}
    </>
  )
}

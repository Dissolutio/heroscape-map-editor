import { TransformControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useState } from 'react'
import type { PointLight } from 'three'
import useBoundStore from '../store/store'
import type { LightPosition } from '../store/ui-slice'
import { getAmbientIntensity } from '../data/lookSettings'
import { invalidateShadowMap } from './shadowInvalidation'

export default function Lights({
  width,
  length,
}: { width: number; length: number }) {
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const lookSettings = useBoundStore((s) => s.lookSettings)
  const lights: { id: string; position: LightPosition }[] = [
    { id: 'front-left', position: [width / 3, 15, length / 3] },
    { id: 'back-left', position: [width / 3, 15, (2 * length) / 3] },
    { id: 'front-right', position: [(2 * width) / 3, 15, length / 3] },
    { id: 'back-right', position: [(2 * width) / 3, 15, (2 * length) / 3] },
  ]
  return (
    <>
      <ambientLight
        intensity={getAmbientIntensity(lookSettings, isLightsAndShadowsRender)}
      />
      <hemisphereLight
        color={'#ffffbb'}
        groundColor={'#080820'}
        intensity={lookSettings.hemisphereIntensity}
      />
      {isLightsAndShadowsRender &&
        lights.map(({ id, position }) => (
          <MovablePointLight
            key={id}
            id={id}
            defaultPosition={position}
            color={lookSettings.lightColor}
            intensity={lookSettings.pointLightIntensity}
          />
        ))}
    </>
  )
}

function MovablePointLight({
  id,
  defaultPosition,
  color,
  intensity,
}: {
  id: string
  defaultPosition: LightPosition
  color: string
  intensity: number
}) {
  const [light, setLight] = useState<PointLight | null>(null)
  const shadowMap = useThree((state) => state.gl.shadowMap)
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
        color={color}
        castShadow
        intensity={intensity}
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
          onObjectChange={() => invalidateShadowMap(shadowMap)}
        />
      )}
    </>
  )
}

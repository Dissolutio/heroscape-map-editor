import type { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import useBoundStore from '../../store/store'

export default function PerspectiveFovApplier({
  cameraControlsRef,
  perspectiveCameraRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls>
  perspectiveCameraRef: React.RefObject<PerspectiveCamera>
}) {
  const fov = useBoundStore((state) => state.lookSettings.fov)
  const isOrthoCam = useBoundStore((state) => state.isOrthoCam)
  const invalidate = useThree((state) => state.invalidate)
  const previousFov = useRef(fov)

  useEffect(() => {
    const camera = perspectiveCameraRef.current
    if (!camera) return

    const oldFov = previousFov.current
    camera.fov = fov
    camera.updateProjectionMatrix()

    if (oldFov !== fov && !isOrthoCam) {
      const controls = cameraControlsRef.current
      if (controls) {
        const position = controls.getPosition(new Vector3())
        const target = controls.getTarget(new Vector3())
        const distance = position.distanceTo(target)
        if (distance > 0) {
          const fovScale =
            Math.tan((oldFov * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360)
          const nextDistance = Math.min(100, Math.max(1, distance * fovScale))
          position
            .sub(target)
            .multiplyScalar(nextDistance / distance)
            .add(target)
          controls.setPosition(position.x, position.y, position.z, false)
        }
      }
    }

    previousFov.current = fov
    invalidate()
  }, [cameraControlsRef, fov, invalidate, isOrthoCam, perspectiveCameraRef])

  return null
}

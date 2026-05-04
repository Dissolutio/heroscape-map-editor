import type { RefObject } from 'react'
import type { Group, Object3DEventMap } from 'three'
import type { CameraControls } from '@react-three/drei'

export const zoomToMap = (
  mapGroupRef: RefObject<Group<Object3DEventMap>>,
  cameraControlsRef: RefObject<CameraControls>,
  width: number,
  length: number,
) => {
  if (mapGroupRef.current) {
    cameraControlsRef.current?.setPosition?.(
      width,
      width + length,
      length,
      true,
    )
    cameraControlsRef.current?.rotateTo?.(0, 0, true)
    cameraControlsRef.current?.fitToBox?.(mapGroupRef.current, true)
  }
}

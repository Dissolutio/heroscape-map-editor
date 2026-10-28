import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import useBoundStore from '../store/store'
import { isE2EDeterministic } from '../e2e/isE2E'
import {
  invalidateShadowMap,
  shouldInvalidateShadowMap,
} from './shadowInvalidation'

export default function ShadowMapInvalidator() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const { shadowMap } = gl
    const originalAutoUpdate = shadowMap.autoUpdate
    shadowMap.autoUpdate = false
    invalidateShadowMap(shadowMap)
    const unsubscribe = useBoundStore.subscribe((current, previous) => {
      if (shouldInvalidateShadowMap(previous, current)) {
        invalidateShadowMap(shadowMap)
      }
    })

    let restoreRender: (() => void) | undefined
    if (isE2EDeterministic) {
      const originalRender = shadowMap.render
      let renderCount = 0
      const trackedRender: typeof originalRender = function (
        this: typeof shadowMap,
        ...args: Parameters<typeof originalRender>
      ) {
        renderCount += 1
        gl.domElement.dataset.shadowRenderCount = String(renderCount)
        return originalRender.apply(this, args)
      }
      shadowMap.render = trackedRender
      gl.domElement.dataset.shadowRenderCount = '0'
      restoreRender = () => {
        if (shadowMap.render === trackedRender) {
          shadowMap.render = originalRender
        }
      }
    }

    return () => {
      unsubscribe()
      restoreRender?.()
      shadowMap.autoUpdate = originalAutoUpdate
      invalidateShadowMap(shadowMap)
    }
  }, [gl])

  return null
}

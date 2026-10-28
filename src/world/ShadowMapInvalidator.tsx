import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import useBoundStore from '../store/store'
import { isE2EDeterministic } from '../e2e/isE2E'
import {
  requestShadowUpdate,
  shouldInvalidateShadowMap,
  updateShadowSettleWindow,
} from './shadowInvalidation'

export default function ShadowMapInvalidator() {
  const gl = useThree((state) => state.gl)
  const pendingLoads = useProgress((state) => state.active)
  const settleWindow = useRef({ framesRemaining: 0 })

  useEffect(() => {
    const { shadowMap } = gl
    const originalAutoUpdate = shadowMap.autoUpdate
    shadowMap.autoUpdate = false
    requestShadowUpdate(shadowMap, settleWindow.current)
    const unsubscribe = useBoundStore.subscribe((current, previous) => {
      if (shouldInvalidateShadowMap(previous, current)) {
        requestShadowUpdate(shadowMap, settleWindow.current)
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
        // three calls shadowMap.render every frame and returns early when
        // nothing is dirty, so count only the calls that really draw shadows
        const [lights] = args
        const willRender =
          this.enabled &&
          (this.autoUpdate || this.needsUpdate) &&
          lights.length > 0
        if (willRender) {
          renderCount += 1
          gl.domElement.dataset.shadowRenderCount = String(renderCount)
        }
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
      requestShadowUpdate(shadowMap, settleWindow.current)
    }
  }, [gl])

  useFrame(() => {
    updateShadowSettleWindow(gl.shadowMap, settleWindow.current, pendingLoads)
  })

  return null
}

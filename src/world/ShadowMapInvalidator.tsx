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

// e2e only: records why a shadow update was requested, so a failing test can say
function noteShadowTrigger(gl: { domElement: HTMLCanvasElement }, why: string) {
  if (!isE2EDeterministic) return
  const list = JSON.parse(gl.domElement.dataset.shadowTriggers ?? '[]')
  list.push(why)
  gl.domElement.dataset.shadowTriggers = JSON.stringify(list.slice(-20))
}

export default function ShadowMapInvalidator() {
  const gl = useThree((state) => state.gl)
  const pendingLoads = useProgress((state) => state.active)
  const settleWindow = useRef({ framesRemaining: 0 })

  useEffect(() => {
    const { shadowMap } = gl
    const originalAutoUpdate = shadowMap.autoUpdate
    shadowMap.autoUpdate = false
    requestShadowUpdate(shadowMap, settleWindow.current)
    noteShadowTrigger(gl, 'mount')
    const unsubscribe = useBoundStore.subscribe((current, previous) => {
      if (shouldInvalidateShadowMap(previous, current)) {
        const now = current as unknown as Record<string, unknown>
        const before = previous as unknown as Record<string, unknown>
        const changed = Object.keys(now).filter((key) => now[key] !== before[key])
        noteShadowTrigger(gl, `store:${changed.join(',')}`)
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
    if (pendingLoads && settleWindow.current.framesRemaining === 0) {
      noteShadowTrigger(gl, 'loads')
    }
    updateShadowSettleWindow(gl.shadowMap, settleWindow.current, pendingLoads)
  })

  return null
}

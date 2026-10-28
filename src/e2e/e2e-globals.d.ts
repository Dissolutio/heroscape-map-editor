import type { E2ETestBridge } from './types'

declare global {
  interface Window {
    /** True once the current map has finished loading and the camera is still. */
    __APP_READY__?: boolean
    /** Readiness internals for diagnosing e2e timeouts. */
    __READY_DEBUG__?: {
      mapID: string
      mapSettled: boolean
      framesSinceSettle: number
      lastLoaderActiveAt: number
      loaderActive: boolean
      cameraStableFrames: number
      lastFrameAt: number | null
      frameCount: number
      armedAt: number
      armCount: number
      lastArmChanges: string[]
      ready: boolean
      lastReadyAt: number | null
      boardPieceCount: number
      boardHexCount: number
      viewingLevel: number
      isOrthoCam: boolean
    }
    /** Read-only automation bridge. Present only when `isE2E` is true. */
    __TEST__?: E2ETestBridge
  }
}

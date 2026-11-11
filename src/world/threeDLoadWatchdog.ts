// Watchdog for the 3D view's Suspense fallback (issue #379).
//
// If something the 3D view suspends on never settles (a blocked worker, a
// model or texture that never loads), React keeps showing the fallback
// forever. The watchdog lets the fallback give up after a while, offer the
// 2D view instead, and report the hang once per session.
//
// Keep this module free of three.js imports: the fallback that uses it lives
// in the main bundle, outside the lazily loaded 3D chunk.

export const THREE_D_LOAD_TIMEOUT_MS = 20_000
export const THREE_D_LOAD_TIMEOUT_SESSION_KEY = '3d-load-timeout-reported'

/**
 * Calls `onTimeout` once, after `timeoutMs`, unless the returned cancel
 * function runs first (the fallback unmounted because the 3D view loaded).
 */
export function startLoadWatchdog(
  onTimeout: () => void,
  timeoutMs: number = THREE_D_LOAD_TIMEOUT_MS,
): () => void {
  let isCancelled = false
  const timeoutId = setTimeout(() => {
    if (!isCancelled) onTimeout()
  }, timeoutMs)
  return () => {
    isCancelled = true
    clearTimeout(timeoutId)
  }
}

let reportedThisSession = false

type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem'>

/**
 * True the first time it is called in a session, false after that. Falls
 * back to a module flag when sessionStorage is unavailable or throws.
 */
export function claimLoadTimeoutReport(
  storage: SessionStorageLike | undefined = globalThis.sessionStorage,
): boolean {
  if (reportedThisSession) return false
  reportedThisSession = true
  try {
    if (!storage) return true
    if (storage.getItem(THREE_D_LOAD_TIMEOUT_SESSION_KEY)) return false
    storage.setItem(THREE_D_LOAD_TIMEOUT_SESSION_KEY, '1')
  } catch {
    // Storage blocked: the module flag still limits us to one report.
  }
  return true
}

/** Test-only: forget the in-memory "already reported" flag. */
export function resetLoadTimeoutReportForTests() {
  reportedThisSession = false
}

export type LoadTimeoutReport = {
  timeoutMs: number
  webglSupported: boolean
  webgl2: boolean
  renderer: string | null
  softwareRendererGuess: boolean
}

type WebGLProbeContext = {
  getExtension: (name: string) => unknown
  getParameter: (param: number) => unknown
}

type CanvasLike = {
  getContext: (id: 'webgl2' | 'webgl') => unknown
}

// WEBGL_debug_renderer_info.UNMASKED_RENDERER_WEBGL
const UNMASKED_RENDERER_WEBGL = 0x9246

/**
 * Builds the Sentry payload for a load timeout: whether WebGL works and the
 * GPU renderer string. Nothing about the user, their files or their maps.
 */
export function buildLoadTimeoutReport(
  canvas: CanvasLike | null,
  timeoutMs: number = THREE_D_LOAD_TIMEOUT_MS,
): LoadTimeoutReport {
  let context: WebGLProbeContext | null = null
  let webgl2 = false
  try {
    context = (canvas?.getContext('webgl2') as WebGLProbeContext) ?? null
    webgl2 = context !== null
    if (!context) {
      context = (canvas?.getContext('webgl') as WebGLProbeContext) ?? null
    }
  } catch {
    context = null
  }

  let renderer: string | null = null
  try {
    if (context?.getExtension('WEBGL_debug_renderer_info')) {
      const value = context.getParameter(UNMASKED_RENDERER_WEBGL)
      renderer = typeof value === 'string' ? value : null
    }
  } catch {
    renderer = null
  }

  try {
    const lose = context?.getExtension('WEBGL_lose_context') as
      | { loseContext: () => void }
      | null
      | undefined
    lose?.loseContext()
  } catch {
    // Best effort: browsers reclaim the probe context anyway.
  }

  return {
    timeoutMs,
    webglSupported: context !== null,
    webgl2,
    renderer,
    softwareRendererGuess:
      renderer !== null &&
      /swiftshader|llvmpipe|Microsoft Basic Render Driver/i.test(renderer),
  }
}

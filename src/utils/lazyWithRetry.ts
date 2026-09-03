import { lazy, type ComponentType } from 'react'

const RELOAD_FLAG = 'chunk-load-retry-reload'

const isChunkLoadError = (error: unknown) =>
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk|Minified React error #310/i.test(
    (error as Error)?.message ?? '',
  )

/**
 * Reloads the page once per session when a stale deployment chunk fails to
 * load (new build shipped while the old index.html/bundle was still cached).
 * Returns true if a reload was triggered, so callers can bail out early.
 */
export const reloadOnceForChunkError = (error: unknown) => {
  if (!isChunkLoadError(error) || sessionStorage.getItem(RELOAD_FLAG)) {
    return false
  }
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
  return true
}

/**
 * Drop-in replacement for React.lazy() that automatically retries with a
 * hard reload if the dynamic import fails because the chunk no longer
 * exists on the server (post-deployment cache mismatch).
 */
// biome-ignore lint/suspicious/noExplicitAny: <matches React.lazy's own ComponentType<any> signature so prop types are preserved>
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    componentImport()
      .then((module) => {
        // successful load means we're on a working bundle; allow future retries
        sessionStorage.removeItem(RELOAD_FLAG)
        return module
      })
      .catch((error) => {
        if (reloadOnceForChunkError(error)) {
          // reload is in flight; return a never-resolving promise so Suspense just keeps showing its fallback
          return new Promise<{ default: T }>(() => undefined)
        }
        throw error
      }),
  )
}

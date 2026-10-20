import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadOnceForChunkError } from '../utils/lazyWithRetry'

describe('reload once on stale deployment chunks', () => {
  const values = new Map<string, string>()
  const reload = vi.fn()

  beforeEach(() => {
    values.clear()
    reload.mockClear()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
    vi.stubGlobal('window', { location: { reload } })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    // Chrome
    'Failed to fetch dynamically imported module: https://hexoscape.com/assets/World-abc.js',
    // Firefox
    'error loading dynamically imported module: https://hexoscape.com/assets/World-abc.js',
    // Safari, chunk 404s
    'Importing a module script failed.',
    // Safari, SPA fallback served index.html for the missing chunk (HEXOSCAPE-77)
    "'text/html' is not a valid JavaScript MIME type for module script 'https://hexoscape.com/assets/World-DhVozl68.js'.",
  ])('reloads for: %s', (message) => {
    expect(reloadOnceForChunkError(new TypeError(message))).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads only once per session', () => {
    const error = new TypeError('Importing a module script failed.')
    expect(reloadOnceForChunkError(error)).toBe(true)
    expect(reloadOnceForChunkError(error)).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('ignores unrelated errors', () => {
    expect(reloadOnceForChunkError(new Error('boom'))).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})

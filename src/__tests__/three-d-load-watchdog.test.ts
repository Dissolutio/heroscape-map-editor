import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THREE_D_LOAD_TIMEOUT_MS,
  THREE_D_LOAD_TIMEOUT_SESSION_KEY,
  buildLoadTimeoutReport,
  claimLoadTimeoutReport,
  resetLoadTimeoutReportForTests,
  startLoadWatchdog,
} from '../world/threeDLoadWatchdog'

describe('3D load watchdog (issue #379)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits about 20 seconds by default', () => {
    expect(THREE_D_LOAD_TIMEOUT_MS).toBe(20_000)
  })

  it('times out once the default timeout has passed', () => {
    const onTimeout = vi.fn()
    startLoadWatchdog(onTimeout)
    vi.advanceTimersByTime(THREE_D_LOAD_TIMEOUT_MS - 1)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(THREE_D_LOAD_TIMEOUT_MS * 5)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('never times out when cancelled first (the 3D view loaded)', () => {
    const onTimeout = vi.fn()
    const cancel = startLoadWatchdog(onTimeout, 1000)
    vi.advanceTimersByTime(999)
    cancel()
    vi.advanceTimersByTime(10_000)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('cancelling twice is harmless', () => {
    const cancel = startLoadWatchdog(vi.fn(), 1000)
    cancel()
    expect(() => cancel()).not.toThrow()
  })
})

describe('3D load timeout report, once per session', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }

  beforeEach(() => {
    values.clear()
    resetLoadTimeoutReportForTests()
  })

  it('claims the report only the first time', () => {
    expect(claimLoadTimeoutReport(storage)).toBe(true)
    expect(values.get(THREE_D_LOAD_TIMEOUT_SESSION_KEY)).toBe('1')
    expect(claimLoadTimeoutReport(storage)).toBe(false)
  })

  it('does not report again after a reload in the same session', () => {
    values.set(THREE_D_LOAD_TIMEOUT_SESSION_KEY, '1')
    expect(claimLoadTimeoutReport(storage)).toBe(false)
  })

  it('still reports only once when sessionStorage throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(claimLoadTimeoutReport(throwing)).toBe(true)
    expect(claimLoadTimeoutReport(throwing)).toBe(false)
  })
})

describe('3D load timeout report payload', () => {
  const makeContext = (renderer: string | null) => {
    const loseContext = vi.fn()
    return {
      loseContext,
      context: {
        getExtension: (name: string) => {
          if (name === 'WEBGL_debug_renderer_info') return renderer ? {} : null
          if (name === 'WEBGL_lose_context') return { loseContext }
          return null
        },
        getParameter: () => renderer,
      },
    }
  }

  it('reports WebGL 2 support and the renderer string, nothing else', () => {
    const { context, loseContext } = makeContext(
      'ANGLE (NVIDIA, NVIDIA GeForce GT 710 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    )
    const report = buildLoadTimeoutReport({
      getContext: (id) => (id === 'webgl2' ? context : null),
    })
    expect(report).toEqual({
      timeoutMs: THREE_D_LOAD_TIMEOUT_MS,
      webglSupported: true,
      webgl2: true,
      renderer:
        'ANGLE (NVIDIA, NVIDIA GeForce GT 710 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      softwareRendererGuess: false,
    })
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('falls back to WebGL 1 and flags software renderers', () => {
    const { context } = makeContext('Google SwiftShader')
    const report = buildLoadTimeoutReport({
      getContext: (id) => (id === 'webgl' ? context : null),
    })
    expect(report.webglSupported).toBe(true)
    expect(report.webgl2).toBe(false)
    expect(report.softwareRendererGuess).toBe(true)
  })

  it('reports no WebGL when no context can be created or probing throws', () => {
    const none = buildLoadTimeoutReport({ getContext: () => null })
    expect(none).toMatchObject({
      webglSupported: false,
      webgl2: false,
      renderer: null,
    })
    const throwing = buildLoadTimeoutReport({
      getContext: () => {
        throw new Error('nope')
      },
    })
    expect(throwing.webglSupported).toBe(false)
    expect(buildLoadTimeoutReport(null).webglSupported).toBe(false)
  })
})

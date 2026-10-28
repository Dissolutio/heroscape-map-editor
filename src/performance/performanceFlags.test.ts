import { createStore } from 'zustand/vanilla'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('performance store subscription tracking', () => {
  it('disables R3F events only with the explicit performance query flag', async () => {
    vi.stubGlobal('window', {
      location: { search: '?perf=1&perfNoEvents=1' },
    })
    vi.resetModules()
    const { isPerformanceEventsDisabled } = await import('./performanceFlags')

    expect(isPerformanceEventsDisabled).toBe(true)

    vi.stubGlobal('window', {
      location: { search: '?perfNoEvents=1' },
    })
    vi.resetModules()
    const withoutPerf = await import('./performanceFlags')
    expect(withoutPerf.isPerformanceEventsDisabled).toBe(false)
  })

  it('records and clears User Timing measures only when perf is enabled', async () => {
    vi.stubGlobal('window', { location: { search: '?perf=1' } })
    vi.resetModules()
    const timing = await import('./performanceTiming')
    const startedAt = timing.startPerformanceTiming()
    timing.finishPerformanceTiming('test.pointer', startedAt)

    expect(
      timing.getPerformanceTimingTotals()['test.pointer'],
    ).toBeGreaterThanOrEqual(0)
    expect(performance.getEntriesByName('test.pointer', 'measure')).toEqual([])

    vi.stubGlobal('window', { location: { search: '' } })
    vi.resetModules()
    const disabled = await import('./performanceTiming')
    const noTiming = disabled.startPerformanceTiming()
    disabled.finishPerformanceTiming('test.disabled', noTiming)
    expect(disabled.getPerformanceTimingTotals()).toEqual({})
  })

  it('counts active subscribers and stops counting after unsubscribe', async () => {
    vi.stubGlobal('window', { location: { search: '?perf=1' } })
    vi.resetModules()
    const { getTrackedStoreSubscribers, trackStoreSubscriptions } =
      await import('./performanceFlags')
    const store = createStore<{ value: number }>()(
      trackStoreSubscriptions(() => ({ value: 0 })),
    )
    const unsubscribe = store.subscribe(vi.fn())

    expect(getTrackedStoreSubscribers()).toBe(1)
    unsubscribe()
    unsubscribe()
    expect(getTrackedStoreSubscribers()).toBe(0)
  })

  it('does not wrap store subscriptions unless the perf flag is enabled', async () => {
    vi.stubGlobal('window', { location: { search: '' } })
    vi.resetModules()
    const { getTrackedStoreSubscribers, trackStoreSubscriptions } =
      await import('./performanceFlags')
    const store = createStore<{ value: number }>()(
      trackStoreSubscriptions(() => ({ value: 0 })),
    )
    const unsubscribe = store.subscribe(vi.fn())

    expect(getTrackedStoreSubscribers()).toBe(0)
    unsubscribe()
  })
})

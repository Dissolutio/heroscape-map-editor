import { createStore } from 'zustand/vanilla'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('performance store subscription tracking', () => {
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

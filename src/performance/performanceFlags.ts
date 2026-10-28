import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand'

const query = (() => {
  try {
    return new URLSearchParams(window.location.search)
  } catch {
    return new URLSearchParams()
  }
})()

export const isPerformanceEnabled = query.get('perf') === '1'
export const isPerformanceBenchmark = query.get('bench') === '1'
export const performanceSeconds = (() => {
  const parsed = Number(query.get('perfSeconds'))
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 60
    ? Math.floor(parsed)
    : 2
})()

let trackedSubscribers = 0

export const getTrackedStoreSubscribers = () => trackedSubscribers

export function trackStoreSubscriptions<
  T,
  MutatorsIn extends [StoreMutatorIdentifier, unknown][] = [],
  MutatorsOut extends [StoreMutatorIdentifier, unknown][] = [],
>(
  creator: StateCreator<T, MutatorsIn, MutatorsOut>,
): StateCreator<T, MutatorsIn, MutatorsOut> {
  if (!isPerformanceEnabled) return creator

  return (set, get, store) => {
    const originalSubscribe = store.subscribe
    store.subscribe = (listener: Parameters<StoreApi<T>['subscribe']>[0]) => {
      trackedSubscribers += 1
      const unsubscribe = originalSubscribe(listener)
      let active = true
      return () => {
        if (active) {
          trackedSubscribers -= 1
          active = false
        }
        unsubscribe()
      }
    }
    return creator(set, get, store)
  }
}

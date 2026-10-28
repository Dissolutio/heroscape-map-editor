import { isPerformanceEnabled } from './performanceFlags'

const totals = new Map<string, number>()

export function startPerformanceTiming() {
  return isPerformanceEnabled ? performance.now() : null
}

export function finishPerformanceTiming(name: string, start: number | null) {
  if (start === null) return
  const measure = performance.measure(name, {
    start,
    end: performance.now(),
  })
  totals.set(name, (totals.get(name) ?? 0) + measure.duration)
  performance.clearMeasures(name)
}

export function getPerformanceTimingTotals() {
  return Object.fromEntries(totals)
}

export function resetPerformanceTimingTotals() {
  totals.clear()
}

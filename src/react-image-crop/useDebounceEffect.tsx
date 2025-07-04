import { useEffect, type DependencyList } from 'react'

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const t = setTimeout(() => {
      fn.apply(undefined, deps as [])
    }, waitTime)

    return () => {
      clearTimeout(t)
    }
  }, deps)
}

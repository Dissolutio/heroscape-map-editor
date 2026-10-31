export const GLTF_IDLE_TIMEOUT_MS = 25_000

const gltfRefCounts = new Map<string, number>()
const pendingDisposals = new Map<string, ReturnType<typeof setTimeout>>()

export function trackGltfConsumer(cacheKey: string) {
  const pendingDisposal = pendingDisposals.get(cacheKey)
  if (pendingDisposal !== undefined) {
    clearTimeout(pendingDisposal)
    pendingDisposals.delete(cacheKey)
  }

  gltfRefCounts.set(cacheKey, (gltfRefCounts.get(cacheKey) ?? 0) + 1)
  let isReleased = false

  return (onUnused: () => void) => {
    if (isReleased) return
    isReleased = true

    const nextCount = (gltfRefCounts.get(cacheKey) ?? 1) - 1
    if (nextCount > 0) {
      gltfRefCounts.set(cacheKey, nextCount)
      return
    }

    gltfRefCounts.delete(cacheKey)
    const timeout = setTimeout(() => {
      if (
        gltfRefCounts.has(cacheKey) ||
        pendingDisposals.get(cacheKey) !== timeout
      ) {
        return
      }

      pendingDisposals.delete(cacheKey)
      onUnused()
    }, GLTF_IDLE_TIMEOUT_MS)
    pendingDisposals.set(cacheKey, timeout)
  }
}

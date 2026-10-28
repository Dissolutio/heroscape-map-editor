import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { notifyModelMounted } from '../shadowInvalidation'

// Track active hook consumers per GLTF path so we only dispose once the last one unmounts.
const gltfRefCounts = new Map<string, number>()
const pendingDisposals = new Map<string, number>()
let nextDisposalId = 1

// Normalize path input to a stable key for ref counting.
function makeCacheKey(path: string | string[]) {
  return JSON.stringify(path)
}

function disposeGltfResources(gltf: unknown) {
  if (Array.isArray(gltf)) {
    for (const asset of gltf) {
      disposeGltfResources(asset)
    }
    return
  }

  // Read the scene defensively because GLTF typing here is intentionally loose.
  const scene = (
    gltf as { scene?: { traverse?: (cb: (child: unknown) => void) => void } }
  ).scene

  // Some assets may not expose a traversable scene; nothing to dispose in that case.
  if (!scene?.traverse) {
    return
  }

  // Walk every node and free only resources owned by the loaded asset.
  scene.traverse((child) => {
    const meshChild = child as {
      isMesh?: boolean
      geometry?: { dispose?: () => void }
      skeleton?: { dispose?: () => void }
    }

    if (meshChild.isMesh) {
      // Materials are shared globally and must outlive any individual GLTF asset.
      meshChild.geometry?.dispose?.()
    }

    // Skinned assets may allocate skeleton buffers; release those too.
    meshChild.skeleton?.dispose?.()
  })
}

export function useDisposableGLTF(...args: Parameters<typeof useGLTF>) {
  // Reuse Drei's loader/cache behavior, then add lifecycle cleanup on top.
  const gltf = useGLTF(...args)
  const path = args[0]
  const cacheKey = makeCacheKey(path)

  useEffect(() => {
    if (typeof window !== 'undefined') notifyModelMounted(window)
    // Register one active consumer for this model path.
    gltfRefCounts.set(cacheKey, (gltfRefCounts.get(cacheKey) ?? 0) + 1)
    pendingDisposals.delete(cacheKey)

    return () => {
      // Unregister this consumer and only dispose when the final consumer is gone.
      const nextCount = (gltfRefCounts.get(cacheKey) ?? 1) - 1

      if (nextCount > 0) {
        gltfRefCounts.set(cacheKey, nextCount)
        return
      }

      gltfRefCounts.delete(cacheKey)
      const disposalId = nextDisposalId++
      pendingDisposals.set(cacheKey, disposalId)

      queueMicrotask(() => {
        if (
          gltfRefCounts.has(cacheKey) ||
          pendingDisposals.get(cacheKey) !== disposalId
        ) {
          return
        }

        pendingDisposals.delete(cacheKey)
        try {
          disposeGltfResources(gltf)
        } finally {
          // Evict parsed geometry after confirming no replacement consumer mounted.
          useGLTF.clear(path)
        }
      })
    }
  }, [cacheKey, gltf, path])

  return gltf
}

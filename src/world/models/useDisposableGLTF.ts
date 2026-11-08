import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { notifyModelMounted } from '../shadowInvalidation'
import { trackGltfConsumer } from './gltfLifecycle'

// Normalize path input to a stable key for ref counting.
function makeCacheKey(path: string | string[]) {
  return JSON.stringify(path)
}

export function disposeGltfResources(gltf: unknown) {
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

  const textures = new Set<{ dispose?: () => void }>()

  // Walk every node and free only resources owned by the loaded asset.
  scene.traverse((child) => {
    const meshChild = child as {
      isMesh?: boolean
      geometry?: { dispose?: () => void }
      skeleton?: { dispose?: () => void }
      material?: unknown | unknown[]
    }

    if (meshChild.isMesh) {
      // Materials are shared globally and must outlive any individual GLTF asset.
      meshChild.geometry?.dispose?.()
      const materials = Array.isArray(meshChild.material)
        ? meshChild.material
        : [meshChild.material]
      for (const material of materials) {
        if (!material || typeof material !== 'object') continue
        for (const value of Object.values(material)) {
          if (
            value &&
            typeof value === 'object' &&
            'isTexture' in value &&
            value.isTexture
          ) {
            textures.add(value as { dispose?: () => void })
          }
        }
      }
    }

    // Skinned assets may allocate skeleton buffers; release those too.
    meshChild.skeleton?.dispose?.()
  })
  for (const texture of textures) {
    texture.dispose?.()
  }
}

export function useDisposableGLTF(...args: Parameters<typeof useGLTF>) {
  // Reuse Drei's loader/cache behavior, then add lifecycle cleanup on top.
  const gltf = useGLTF(...args)
  const path = args[0]
  const cacheKey = makeCacheKey(path)

  useEffect(() => {
    if (typeof window !== 'undefined') notifyModelMounted(window)
    const releaseGltfConsumer = trackGltfConsumer(cacheKey)

    return () => {
      releaseGltfConsumer(() => {
        try {
          disposeGltfResources(gltf)
        } finally {
          useGLTF.clear(path)
        }
      })
    }
  }, [cacheKey, gltf, path])

  return gltf
}

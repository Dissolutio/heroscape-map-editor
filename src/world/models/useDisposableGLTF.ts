import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'

// Track active hook consumers per GLTF path so we only dispose once the last one unmounts.
const gltfRefCounts = new Map<string, number>()

// Normalize path input to a stable key for ref counting.
function makeCacheKey(path: string | string[]) {
  return Array.isArray(path) ? path.join('||') : path
}

function disposeGltfResources(gltf: unknown) {
  // Read the scene defensively because GLTF typing here is intentionally loose.
  const scene = (gltf as { scene?: { traverse?: (cb: (child: unknown) => void) => void } })
    .scene

  // Some assets may not expose a traversable scene; nothing to dispose in that case.
  if (!scene?.traverse) {
    return
  }

  // Walk every node and explicitly free GPU resources owned by meshes.
  scene.traverse((child) => {
    const meshChild = child as {
      isMesh?: boolean
      geometry?: { dispose?: () => void }
      material?: unknown
      skeleton?: { dispose?: () => void }
    }

    if (meshChild.isMesh) {
      // Geometry buffers can be large, so release them as soon as the model is unused.
      meshChild.geometry?.dispose?.()

      const materials = Array.isArray(meshChild.material)
        ? meshChild.material
        : [meshChild.material]

      for (const material of materials) {
        if (!material || typeof material !== 'object') {
          continue
        }

        // Dispose textures referenced by material properties before disposing the material.
        for (const value of Object.values(material as Record<string, unknown>)) {
          const possibleTexture = value as {
            isTexture?: boolean
            dispose?: () => void
          }

          if (possibleTexture?.isTexture) {
            possibleTexture.dispose?.()
          }
        }

        // Finally release the material program/state itself.
        ; (material as { dispose?: () => void }).dispose?.()
      }
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
    // Register one active consumer for this model path.
    gltfRefCounts.set(cacheKey, (gltfRefCounts.get(cacheKey) ?? 0) + 1)

    return () => {
      // Unregister this consumer and only dispose when the final consumer is gone.
      const nextCount = (gltfRefCounts.get(cacheKey) ?? 1) - 1

      if (nextCount > 0) {
        gltfRefCounts.set(cacheKey, nextCount)
        return
      }

      gltfRefCounts.delete(cacheKey)
      // Keep JS-side loader cache, but free Three.js GPU resources.
      disposeGltfResources(gltf)
    }
  }, [cacheKey, gltf])

  return gltf
}
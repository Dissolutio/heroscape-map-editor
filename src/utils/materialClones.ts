import type { Material } from 'three'

/**
 * Hands out private copies of materials, one per distinct original, so a
 * caller can change them without touching the originals. Models get their
 * materials from a global cache (world/models/materials.tsx) that real pieces
 * share, so mutating them directly changes every piece drawn with them.
 *
 * Call dispose() when done: it disposes every clone made, once.
 */
export function createMaterialCloner() {
  const clones = new Map<Material, Material>()
  const cloneSet = new Set<Material>()

  /** The clone of this material (made on first request), or itself if it already is one. */
  const cloneOf = (material: Material) => {
    if (cloneSet.has(material)) return material
    let clone = clones.get(material)
    if (!clone) {
      clone = material.clone()
      clones.set(material, clone)
      cloneSet.add(clone)
    }
    return clone
  }

  /** Clones for a mesh's material or material array, in the same shape. */
  const cloneMaterial = <T extends Material | Material[]>(material: T): T =>
    (Array.isArray(material) ? material.map(cloneOf) : cloneOf(material)) as T

  const isClone = (material: Material) => cloneSet.has(material)

  const dispose = () => {
    for (const clone of cloneSet) clone.dispose()
    clones.clear()
    cloneSet.clear()
  }

  return { cloneMaterial, isClone, dispose }
}

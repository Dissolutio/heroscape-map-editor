import { Mesh, type Intersection, type Object3D, type Raycaster } from 'three'
import { isVoidMatPieceID } from '../data/voidMat'

const GHOST_OPACITY = 0.12
type RaycastObject = Object3D & {
  raycast?: (raycaster: Raycaster, intersections: Intersection[]) => void
}

function isExemptFromGhosting(object: Object3D) {
  let current: Object3D | null = object
  while (current) {
    if (
      current.userData.voidMatDragTable ||
      current.userData.voidMatDragPreview ||
      isVoidMatPieceID(current.userData.inventoryID ?? '')
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

export function ghostMapDuringVoidMatDrag(root: Object3D) {
  const restore: (() => void)[] = []
  root.traverse((object) => {
    if (isExemptFromGhosting(object)) return

    const raycastObject = object as RaycastObject
    if (typeof raycastObject.raycast === 'function') {
      const originalRaycast = raycastObject.raycast
      raycastObject.raycast = () => undefined
      restore.push(() => {
        raycastObject.raycast = originalRaycast
      })
    }

    if (!(object instanceof Mesh)) return

    const originalMaterial = object.material
    const ghostMaterials = (
      Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial]
    ).map((material) => {
      const ghost = material.clone()
      ghost.transparent = true
      ghost.opacity = GHOST_OPACITY
      ghost.depthWrite = false
      ghost.needsUpdate = true
      return ghost
    })
    object.material = Array.isArray(originalMaterial)
      ? ghostMaterials
      : ghostMaterials[0]
    restore.push(() => {
      object.material = originalMaterial
      for (const material of ghostMaterials) material.dispose()
    })
  })

  return () => {
    for (const restoreObject of restore.reverse()) restoreObject()
  }
}

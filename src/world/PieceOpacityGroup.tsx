import React from 'react'
import type { Material, Mesh, Group } from 'three'
import { useFrame } from '@react-three/fiber'

type Props = {
  opacity: number
  children: React.ReactNode
}

const setMaterialOpacity = (material: Material, opacity: number) => {
  material.transparent = opacity < 1
  material.opacity = opacity
  material.depthWrite = opacity >= 1
  material.needsUpdate = true
}

/**
 * Applies a single opacity value to every mesh under the wrapped piece.
 * This lets us fade whole pieces without plumbing opacity through every model.
 */
export default function PieceOpacityGroup({ opacity, children }: Props) {
  const groupRef = React.useRef<Group>(null)

  useFrame(() => {
    if (opacity >= 1) return
    const group = groupRef.current
    if (!group) return

    group.traverse((child) => {
      if (!('isMesh' in child) || !(child as Mesh).isMesh) return
      const mesh = child as Mesh
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      for (const material of materials) {
        if (!material) continue
        setMaterialOpacity(material, opacity)
      }
    })
  })

  return <group ref={groupRef}>{children}</group>
}
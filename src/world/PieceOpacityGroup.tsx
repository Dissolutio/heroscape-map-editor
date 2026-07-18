import React from 'react'
import type { Material, Mesh, Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { calculateFocusOpacity } from '../utils/focus-opacity'

type Props = {
  focusedPieceUID?: string | null
  focusStartTime?: number | null
  pieceUID?: string
  onionOpacity?: number
  children: React.ReactNode
}

const setMaterialOpacity = (material: Material, opacity: number) => {
  material.transparent = opacity < 1
  material.opacity = opacity
  material.depthWrite = opacity >= 1
  material.needsUpdate = true
}

/**
 * Applies animated opacity to every mesh under the wrapped piece based on focus state.
 * Smoothly animates all pieces back to full opacity after zoom animation completes.
 */
export default function PieceOpacityGroup({
  focusedPieceUID,
  focusStartTime,
  pieceUID,
  onionOpacity,
  children,
}: Props) {
  const groupRef = React.useRef<Group>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // Calculate opacity dynamically based on current focus state
    const opacity =
      calculateFocusOpacity(
        focusedPieceUID ?? null,
        focusStartTime ?? null,
        pieceUID,
      ) * (onionOpacity ?? 1)

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

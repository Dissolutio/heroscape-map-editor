import { useFrame } from '@react-three/fiber'
import React from 'react'
import type { Group, Material, Mesh } from 'three'
import { calculateFocusOpacity } from '../utils/focus-opacity'

type Props = {
  focusedPieceUID?: string | null
  focusStartTime?: number | null
  pieceUID?: string
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
  children,
}: Props) {
  const groupRef = React.useRef<Group>(null)
  // Last applied opacity so a settled (unfocused) group can skip the traverse entirely.
  const lastOpacityRef = React.useRef<number | null>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // Calculate opacity dynamically based on current focus state
    const opacity = calculateFocusOpacity(
      focusedPieceUID ?? null,
      focusStartTime ?? null,
      pieceUID,
    )

    // Nothing changed since last frame and we're already at rest: skip the walk.
    if (opacity === 1 && lastOpacityRef.current === 1) return
    lastOpacityRef.current = opacity

    group.traverse((child) => {
      if (!('isMesh' in child) || !(child as Mesh).isMesh) return
      const mesh = child as Mesh
      if (Array.isArray(mesh.material)) {
        for (const material of mesh.material) {
          if (material) setMaterialOpacity(material, opacity)
        }
      } else if (mesh.material) {
        setMaterialOpacity(mesh.material, opacity)
      }
    })
  })

  return <group ref={groupRef}>{children}</group>
}

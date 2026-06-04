import { useCallback, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import useBoundStore from '../store/store'
import type { BoardPiece } from '../types'
import { PIECE_PREVIEW_OPACITY } from '../utils/constants'
import { MapBoardPiece3D } from './MapBoardPiece3D'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardHex } from '../types'

function OperationPiecePreviewItem({ bp }: { bp: BoardPiece }) {
  const groupRef = useRef<Group>(null)

  // On every frame, traverse this group's children and ensure all mesh
  // materials are semi-transparent. Using useFrame handles async GLTF loads.
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        if (!mat.transparent || mat.opacity !== PIECE_PREVIEW_OPACITY) {
          mat.transparent = true
          mat.opacity = PIECE_PREVIEW_OPACITY
          mat.needsUpdate = true
        }
      }
    })
  })

  // Preview pieces are read-only — no painting interaction needed.
  const noop: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void =
    useCallback((_e, _hex) => undefined, [])

  return (
    <group ref={groupRef}>
      <MapBoardPiece3D bp={bp} onPointerUpPaintPiece={noop} />
    </group>
  )
}

export function OperationPiecePreviews() {
  const piecePreviews = useBoundStore((s) => s.piecePreviews)
  if (!piecePreviews || piecePreviews.length === 0) return null

  return (
    <>
      {piecePreviews.map((bp) => (
        <OperationPiecePreviewItem key={`op-preview-${bp.uid}`} bp={bp} />
      ))}
    </>
  )
}

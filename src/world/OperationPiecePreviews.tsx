import { useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ArrowHelper, Vector3, type Group, type Mesh } from 'three'
import useBoundStore from '../store/store'
import type { BoardPiece } from '../types'
import { HEXGRID_HEX_HEIGHT, PIECE_PREVIEW_OPACITY } from '../utils/constants'
import { MapBoardPiece3D } from './MapBoardPiece3D'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardHex } from '../types'
import { getBoardHex3DCoords } from '../utils/map-utils'

const ARROW_COLOR = 0xffaa00 // bright orange

// Draws an ArrowHelper from the original piece's position to the preview position.
// Only renders when there is an actual positional difference (skips rotation-only changes).
function PreviewArrow({
  originalBp,
  previewBp,
}: {
  originalBp: BoardPiece
  previewBp: BoardPiece
}) {
  const { x: ox, z: oz, yBaseCap: oyBase } = getBoardHex3DCoords({
    ...originalBp.pieceCoords,
    altitude: originalBp.altitude + 1,
  })
  const { x: px, z: pz, yBaseCap: pyBase } = getBoardHex3DCoords({
    ...previewBp.pieceCoords,
    altitude: previewBp.altitude + 1,
  })

  // Float the arrow above each piece's top surface so it isn't occluded
  const oy = oyBase + HEXGRID_HEX_HEIGHT * 0.6
  const py = pyBase + HEXGRID_HEX_HEIGHT * 0.6

  const from = new Vector3(ox, oy, oz)
  const to = new Vector3(px, py, pz)
  const dir = to.clone().sub(from)
  const length = dir.length()

  const arrowRef = useRef<ArrowHelper | null>(null)

  // Dispose geometry/materials when the component unmounts
  useEffect(() => {
    return () => {
      if (arrowRef.current) {
        arrowRef.current.line.geometry.dispose()
        arrowRef.current.cone.geometry.dispose()
      }
    }
  }, [])

  if (length < 0.01) return null

  dir.normalize()
  const headLength = Math.min(length * 0.35, 0.5)
  const headWidth = Math.min(length * 0.22, 0.35)

  if (!arrowRef.current) {
    arrowRef.current = new ArrowHelper(dir, from, length, ARROW_COLOR, headLength, headWidth)
    // Keep arrow on top of any transparent surfaces
    arrowRef.current.renderOrder = 1
  } else {
    arrowRef.current.setDirection(dir)
    arrowRef.current.setLength(length, headLength, headWidth)
    arrowRef.current.position.copy(from)
  }

  return <primitive object={arrowRef.current} />
}

function OperationPiecePreviewItem({
  originalBp,
  previewBp,
}: {
  originalBp: BoardPiece
  previewBp: BoardPiece
}) {
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
    <>
      <group ref={groupRef}>
        <MapBoardPiece3D bp={previewBp} onPointerUpPaintPiece={noop} />
      </group>
      <PreviewArrow originalBp={originalBp} previewBp={previewBp} />
    </>
  )
}

export function OperationPiecePreviews() {
  const piecePreviews = useBoundStore((s) => s.piecePreviews)
  const boardPieces = useBoundStore((s) => s.boardPieces)
  if (!piecePreviews || piecePreviews.length === 0) return null

  return (
    <>
      {piecePreviews.map((previewBp) => {
        const originalBp = boardPieces.find((bp) => bp.uid === previewBp.uid)
        if (!originalBp) return null
        return (
          <OperationPiecePreviewItem
            key={`op-preview-${previewBp.uid}`}
            originalBp={originalBp}
            previewBp={previewBp}
          />
        )
      })}
    </>
  )
}

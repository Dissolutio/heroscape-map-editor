import { useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CylinderGeometry,
  MeshBasicMaterial,
  Mesh,
  Quaternion,
  Vector3,
  type Group,
} from 'three'
import type { Mesh as ThreeMesh } from 'three'
import useBoundStore from '../store/store'
import type { BoardPiece } from '../types'
import { HEXGRID_HEX_HEIGHT } from '../utils/constants'
import { MapBoardPiece3D } from './MapBoardPiece3D'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoardHex } from '../types'
import { getBoardHex3DCoords } from '../utils/map-utils'

// Ghost pieces use a lower opacity so the arrow pops against them
const OPERATION_PREVIEW_OPACITY = 0.35
const ARROW_COLOR = 0xff8800
const SHAFT_RADIUS = 0.055
const HEAD_RADIUS = 0.16
const HEAD_LENGTH_FRAC = 0.32 // fraction of total length used for the arrowhead

// Draws a thick cylinder+cone arrow from the original piece to the preview position.
// Uses depthTest:false so it always renders on top of geometry.
// Only renders when there is an actual positional difference (skips rotation-only changes).
function PreviewArrow({
  originalBp,
  previewBp,
}: {
  originalBp: BoardPiece
  previewBp: BoardPiece
}) {
  const {
    x: ox,
    z: oz,
    yBaseCap: oyBase,
  } = getBoardHex3DCoords({
    ...originalBp.pieceCoords,
    altitude: originalBp.altitude + 1,
  })
  const {
    x: px,
    z: pz,
    yBaseCap: pyBase,
  } = getBoardHex3DCoords({
    ...previewBp.pieceCoords,
    altitude: previewBp.altitude + 1,
  })

  // Float above the top surface so the arrow clears the piece geometry
  const floatY = HEXGRID_HEX_HEIGHT * 0.7
  const from = new Vector3(ox, oyBase + floatY, oz)
  const to = new Vector3(px, pyBase + floatY, pz)

  const dir = to.clone().sub(from)
  const length = dir.length()

  const groupRef = useRef<Group>(null)
  const shaftRef = useRef<ThreeMesh | null>(null)
  const headRef = useRef<ThreeMesh | null>(null)

  // Pulsing opacity via useFrame
  useFrame(({ clock }) => {
    const pulse = 0.65 + 0.35 * Math.sin(clock.getElapsedTime() * 4)
    if (shaftRef.current) {
      ;(shaftRef.current.material as MeshBasicMaterial).opacity = pulse
    }
    if (headRef.current) {
      ;(headRef.current.material as MeshBasicMaterial).opacity = pulse
    }
  })

  useEffect(() => {
    return () => {
      shaftRef.current?.geometry.dispose()
      headRef.current?.geometry.dispose()
    }
  }, [])

  if (length < 0.01) return null

  dir.normalize()

  const headLength = length * HEAD_LENGTH_FRAC
  const shaftLength = length - headLength

  // Cylinders point along +Y by default; rotate to match direction vector
  const up = new Vector3(0, 1, 0)
  const quat = new Quaternion().setFromUnitVectors(up, dir)

  // Shaft midpoint and head base
  const shaftMid = from.clone().addScaledVector(dir, shaftLength / 2)
  const headBase = from
    .clone()
    .addScaledVector(dir, shaftLength + headLength / 2)

  const arrowMat = () =>
    new MeshBasicMaterial({
      color: ARROW_COLOR,
      transparent: true,
      opacity: 1,
      depthTest: false,
    })

  if (!shaftRef.current) {
    const geo = new CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, shaftLength, 8)
    shaftRef.current = new Mesh(geo, arrowMat())
  } else {
    shaftRef.current.geometry.dispose()
    shaftRef.current.geometry = new CylinderGeometry(
      SHAFT_RADIUS,
      SHAFT_RADIUS,
      shaftLength,
      8,
    )
  }
  shaftRef.current.position.copy(shaftMid)
  shaftRef.current.quaternion.copy(quat)
  shaftRef.current.renderOrder = 999

  if (!headRef.current) {
    const geo = new CylinderGeometry(0, HEAD_RADIUS, headLength, 12)
    headRef.current = new Mesh(geo, arrowMat())
  } else {
    headRef.current.geometry.dispose()
    headRef.current.geometry = new CylinderGeometry(
      0,
      HEAD_RADIUS,
      headLength,
      12,
    )
  }
  headRef.current.position.copy(headBase)
  headRef.current.quaternion.copy(quat)
  headRef.current.renderOrder = 999

  return (
    <group ref={groupRef}>
      <primitive object={shaftRef.current} />
      <primitive object={headRef.current} />
    </group>
  )
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
      const mesh = child as ThreeMesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      for (const mat of mats) {
        if (!mat.transparent || mat.opacity !== OPERATION_PREVIEW_OPACITY) {
          mat.transparent = true
          mat.opacity = OPERATION_PREVIEW_OPACITY
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

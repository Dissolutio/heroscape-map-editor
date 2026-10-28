import { useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { CubeCoordinate, Piece } from '../types'
import { Pieces } from '../types'
import {
  HEXGRID_HEXCAP_FLUID_HEIGHT,
  HEXGRID_HEX_HEIGHT,
} from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { LaurWallArchPreview } from './models/LaurWallArchModel'
import { LaurWallLongPreview } from './models/LaurWallLongModel'
import { LaurWallRuinPreview } from './models/LaurWallRuinModel'
import { LaurWallShortPreview } from './models/LaurWallShortModel'
import ModelLoader from './models/ModelLoader'

const ignoreRaycast = () => undefined

export function LaurAddonPreview({
  piece,
  coords,
  altitude,
  rotation,
  unsupported = false,
  isRaycastable = true,
}: {
  piece: Piece
  coords: CubeCoordinate
  altitude: number
  rotation: number
  unsupported?: boolean
  isRaycastable?: boolean
}) {
  const groupRef = useRef<Group>(null)
  useFrame(() => {
    if (isRaycastable || !groupRef.current) return
    groupRef.current.traverse((child) => {
      const mesh = child as Mesh
      if (mesh.isMesh && mesh.raycast !== ignoreRaycast) {
        mesh.raycast = ignoreRaycast
      }
    })
  })

  let preview = null
  if (
    piece.id === Pieces.laurWallRuin1 ||
    piece.id === Pieces.laurWallRuin2 ||
    piece.id === Pieces.laurWallRuin3
  ) {
    preview = <LaurWallRuinPreview unsupported={unsupported} />
  } else if (
    piece.id === Pieces.laurWallShort ||
    piece.id === Pieces.laurWallShortStackable
  ) {
    preview = <LaurWallShortPreview unsupported={unsupported} />
  } else if (
    piece.id === Pieces.laurWallLong ||
    piece.id === Pieces.laurWallLongStackable
  ) {
    preview = <LaurWallLongPreview unsupported={unsupported} />
  } else if (piece.id === Pieces.laurWallArch) {
    preview = <LaurWallArchPreview unsupported={unsupported} />
  }
  if (!preview) return null

  const { x, z, yWithBase } = getBoardHex3DCoords({ ...coords, altitude })
  return (
    <group
      ref={groupRef}
      position={[
        x,
        yWithBase + HEXGRID_HEX_HEIGHT,
        z + HEXGRID_HEXCAP_FLUID_HEIGHT / 2,
      ]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
    >
      <Suspense fallback={<ModelLoader />}>{preview}</Suspense>
    </group>
  )
}

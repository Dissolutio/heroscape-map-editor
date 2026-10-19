import { useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import type { Group, Mesh } from 'three'
import useBoundStore from '../store/store'
import { type CubeCoordinate, HexTerrain, type Piece } from '../types'
import {
  getLandAltitudeIncrement,
  isFluidTerrainHex,
} from '../utils/board-utils'
import {
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
  PIECE_PREVIEW_OPACITY,
} from '../utils/constants'
import { getBoardHex3DCoords } from '../utils/map-utils'
import { hexTerrainColor } from './maphex/hexColors'
import {
  Subterrain1,
  Subterrain2,
  Subterrain3,
  Subterrain4,
  Subterrain5,
  Subterrain6,
  Subterrain6B,
  Subterrain7,
  Subterrain7B,
  Subterrain9,
  Subterrain24,
} from './models/LandSubterrain'
import { getSubterrainSize } from './models/LandSubterrainInstanced'
import ModelLoader from './models/ModelLoader'

const ignoreRaycast = () => undefined

/**
 * A see-through solid or fluid land tile, drawn where it would go: the pen
 * hover (PiecePreview) and a drag (DragPreview3D) both use it. Its
 * materials are its own (created here), never the shared model cache.
 */
export function LandPieceGhost({
  piece,
  supportHex,
  rotation,
  isRaycastable = true,
}: {
  piece: Piece
  /** The hex the tile sits on, at its placement altitude. */
  supportHex: CubeCoordinate & { altitude: number; terrain?: string }
  rotation: number
  /** false: the pointer passes through (a drag ghost sits under it) */
  isRaycastable?: boolean
}) {
  const groupRef = useRef<Group>(null)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  // the tile model loads later (Suspense), so check every frame
  useFrame(() => {
    if (isRaycastable || !groupRef.current) return
    groupRef.current.traverse((child) => {
      const mesh = child as Mesh
      if (mesh.isMesh && mesh.raycast !== ignoreRaycast) {
        mesh.raycast = ignoreRaycast
      }
    })
  })

  const isFluidPiece = isFluidTerrainHex(piece.terrain)
  const subterrainColor =
    piece.terrain === HexTerrain.swamp
      ? hexTerrainColor.swampCap // override, to distinguish preview from swamp water
      : hexTerrainColor?.[piece.terrain as keyof typeof hexTerrainColor]

  const landSubterrainMaterial = () => {
    if (isLightsAndShadowsRender) {
      return (
        <meshStandardMaterial
          color={subterrainColor}
          transparent
          opacity={PIECE_PREVIEW_OPACITY}
        />
      )
    }
    // not high quality render below
    if (isFluidPiece) {
      return (
        <meshLambertMaterial
          color={subterrainColor}
          transparent
          opacity={PIECE_PREVIEW_OPACITY}
        />
      )
    }
    return (
      <meshMatcapMaterial
        color={subterrainColor}
        transparent
        opacity={PIECE_PREVIEW_OPACITY}
      />
    )
  }
  const getLandMesh = () => {
    switch (getSubterrainSize(piece.id)) {
      case '1':
        return <Subterrain1>{landSubterrainMaterial()}</Subterrain1>
      case '2':
        return <Subterrain2>{landSubterrainMaterial()}</Subterrain2>
      case '3':
        return <Subterrain3>{landSubterrainMaterial()}</Subterrain3>
      case '4':
        return <Subterrain4>{landSubterrainMaterial()}</Subterrain4>
      case '5':
        return <Subterrain5>{landSubterrainMaterial()}</Subterrain5>
      case '6':
        return <Subterrain6>{landSubterrainMaterial()}</Subterrain6>
      case '6B':
        return <Subterrain6B>{landSubterrainMaterial()}</Subterrain6B>
      case '7B':
        return <Subterrain7B>{landSubterrainMaterial()}</Subterrain7B>
      case '7':
        return <Subterrain7>{landSubterrainMaterial()}</Subterrain7>
      case '9':
        return <Subterrain9>{landSubterrainMaterial()}</Subterrain9>
      case '24':
        return <Subterrain24>{landSubterrainMaterial()}</Subterrain24>
      default:
        return null
    }
  }

  const { x, z, yBaseCap } = getBoardHex3DCoords(supportHex)
  // Fluid on fluid, and solid on a half-level fluid, rise a half level (not a whole level)
  const landAltitudeIncrement = getLandAltitudeIncrement(
    piece.terrain,
    isFluidTerrainHex(supportHex.terrain ?? ''),
    supportHex.altitude,
  )
  return (
    <group
      ref={groupRef}
      position={[x, yBaseCap + landAltitudeIncrement * HEXGRID_HEX_HEIGHT, z]}
      rotation={[0, (rotation * -Math.PI) / 3, 0]}
      scale={[1, isFluidPiece ? HEXGRID_HEXCAP_FLUID_SCALE : 1, 1]}
    >
      <Suspense fallback={<ModelLoader />}>{getLandMesh()}</Suspense>
    </group>
  )
}

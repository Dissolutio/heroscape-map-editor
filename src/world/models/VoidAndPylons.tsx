/**
 * Void and Pylons (community custom, VC) in 3D: the two pylons, the
 * Deflector Shield and the Void Mat.
 *
 * Pylons are placed like Laur pillars and the shield like a Laur long wall
 * (MapBoardPiece3D.tsx); port data lives in data/portPieces.ts. The GLBs are
 * authored at rotation 0 with the pylon tabs on the ports (Two-Way north and
 * south, Three-Way north, south-east and south-west) and the shield running
 * along +x from its anchor pylon, exactly like laurwall-long_v2.glb.
 */
import { useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { getLaurAddonHitHex } from '../../data/laurAddonStacking'
import usePieceHoverState from '../../hooks/usePieceHoverState'
import useBoundStore from '../../store/store'
import {
  type BoardHex,
  type BoardPiece,
  HexTerrain,
  Pieces,
  SELECT_PEN_MODE,
} from '../../types'
import { PIECE_PREVIEW_OPACITY } from '../../utils/constants'
import { hexTerrainColor } from '../maphex/hexColors'
import { PLACEMENT_UNSUPPORTED_COLOR } from '../placementPreviewStyle'
import { basicDoubleSideModelMaterial, basicModelMaterial } from './materials'
import { useDisposableGLTF } from './useDisposableGLTF'
import {
  configureVoidMatTexture,
  getVoidMatFallbackMaterial,
  getVoidMatGeometry,
  getVoidMatMaterial,
} from './voidMatResources'

const PYLON_GLB: Record<string, string> = {
  [Pieces.twoWayPylon]: '/pylon2.glb',
  [Pieces.threeWayPylon]: '/pylon3.glb',
}
const SHIELD_GLB = '/deflector-shield.glb'
const SHIELD_OPACITY = 0.55
const HIGHLIGHT_COLOR = 'yellow'

// Each GLB holds a single mesh; take the first one.
function useFirstMeshGeometry(path: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF(path) as any
  return Object.values(nodes).find(
    // biome-ignore lint/suspicious/noExplicitAny: <GLTF node>
    (node: any) => node?.isMesh,
    // biome-ignore lint/suspicious/noExplicitAny: <GLTF node>
  ) as any
}

/**
 * A pylon's meshes, split into its body and its energy beam: the cyan
 * cylinder standing where the real piece takes a glue stick. The beam is any
 * mesh whose object or material name contains "beam" (case ignored). Like
 * the other VC models, only each mesh's geometry is used, so transforms must
 * be applied in Blender before export.
 */
const PYLON_BEAM_NAME = /beam/i
function usePylonMeshes(path: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <mesh names from Blender>
  const { nodes } = useDisposableGLTF(path) as any
  const meshes = Object.values(nodes).filter(
    // biome-ignore lint/suspicious/noExplicitAny: <GLTF node>
    (node: any) => node?.isMesh,
    // biome-ignore lint/suspicious/noExplicitAny: <GLTF node>
  ) as any[]
  const isBeam = (mesh: { name?: string; material?: { name?: string } }) =>
    PYLON_BEAM_NAME.test(mesh.name ?? '') ||
    PYLON_BEAM_NAME.test(mesh.material?.name ?? '')
  return {
    body: meshes.filter((mesh) => !isBeam(mesh)),
    beam: meshes.filter(isBeam),
  }
}

/** The hit hex a pylon hands to placement: like a Laur pillar's. */
export function getPylonHitHex(bp: BoardPiece): BoardHex {
  return {
    ...bp.pieceCoords,
    boardPieceUID: bp.uid,
    altitude: bp.altitude,
    inventoryID: bp.inventoryID,
    pieceID: '',
    pieceRotation: bp.rotation,
    terrain: HexTerrain.voidPylon,
  } as BoardHex
}

export function VoidPylon({
  bp,
  onPointerUp,
}: {
  bp: BoardPiece
  onPointerUp: (e: ThreeEvent<PointerEvent>, hex: BoardHex) => void
}) {
  const { body, beam } = usePylonMeshes(PYLON_GLB[bp.inventoryID])
  const isSelected = useBoundStore((s) => s.selectedPieceIDs.includes(bp.uid))
  const isHovered = useBoundStore((s) => s.hoveredPieceID === bp.uid)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const hitHex = getPylonHitHex(bp)
  const color =
    isSelected || isHovered
      ? HIGHLIGHT_COLOR
      : hexTerrainColor[HexTerrain.voidPylon]
  return (
    <group
      onPointerUp={(e) => onPointerUp(e, hitHex)}
      onPointerEnter={(e) => onPointerEnter(e, hitHex)}
      onPointerOut={(e) => onPointerOut(e)}
    >
      {body.map((mesh) => (
        <mesh
          key={mesh.uuid}
          receiveShadow={isLightsAndShadowsRender}
          castShadow={isLightsAndShadowsRender}
          geometry={mesh.geometry}
          material={basicModelMaterial(color, isLightsAndShadowsRender)}
        />
      ))}
      {beam.map((mesh) => (
        <mesh
          key={mesh.uuid}
          geometry={mesh.geometry}
          material={basicModelMaterial(
            hexTerrainColor[HexTerrain.deflectorShield],
            isLightsAndShadowsRender,
          )}
        />
      ))}
    </group>
  )
}

export function VoidPylonPreview({
  inventoryID,
  opacity = PIECE_PREVIEW_OPACITY,
}: {
  inventoryID: string
  opacity?: number
}) {
  const { body, beam } = usePylonMeshes(PYLON_GLB[inventoryID])
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <>
      {body.map((mesh) => (
        <mesh
          key={mesh.uuid}
          geometry={mesh.geometry}
          material={basicModelMaterial(
            hexTerrainColor[HexTerrain.voidPylon],
            isLightsAndShadowsRender,
            opacity,
          )}
        />
      ))}
      {beam.map((mesh) => (
        <mesh
          key={mesh.uuid}
          geometry={mesh.geometry}
          material={basicModelMaterial(
            hexTerrainColor[HexTerrain.deflectorShield],
            isLightsAndShadowsRender,
            opacity,
          )}
        />
      ))}
    </>
  )
}

function DeflectorShieldModel({
  color,
  opacity,
}: {
  color: string
  opacity: number
}) {
  const mesh = useFirstMeshGeometry(SHIELD_GLB)
  const isLightsAndShadowsRender = useBoundStore(
    (s) => s.isLightsAndShadowsRender,
  )
  return (
    <mesh
      receiveShadow={isLightsAndShadowsRender}
      geometry={mesh?.geometry}
      material={basicDoubleSideModelMaterial(
        color,
        isLightsAndShadowsRender,
        opacity,
      )}
    />
  )
}

/** A placed shield; clicks and hover work like a Laur long wall's. */
export function DeflectorShieldAddon({
  bp,
  onPointerUpPaintPiece,
}: {
  bp: BoardPiece
  onPointerUpPaintPiece: (
    event: ThreeEvent<PointerEvent>,
    hex: BoardHex,
  ) => void
}) {
  const { onPointerEnter, onPointerOut } = usePieceHoverState()
  const penMode = useBoundStore((s) => s.penMode)
  const toggleSelectedPieceID = useBoundStore((s) => s.toggleSelectedPieceID)
  const isSelected = useBoundStore((s) => s.selectedPieceIDs.includes(bp.uid))
  const isHovered = useBoundStore((s) => s.hoveredPieceID === bp.uid)
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) {
      event.stopPropagation()
      return
    }
    if (penMode !== SELECT_PEN_MODE) {
      onPointerUpPaintPiece(event, getLaurAddonHitHex(bp))
      return
    }
    event.stopPropagation()
    toggleSelectedPieceID(
      bp.uid,
      event.shiftKey || event.ctrlKey || event.metaKey,
      { x: event.point.x, z: event.point.z },
    )
  }
  return (
    <group
      onPointerUp={onPointerUp}
      onPointerEnter={(e) => onPointerEnter(e, getLaurAddonHitHex(bp))}
      onPointerOut={(e) => onPointerOut(e)}
    >
      <DeflectorShieldModel
        color={
          isSelected || isHovered
            ? HIGHLIGHT_COLOR
            : hexTerrainColor[HexTerrain.deflectorShield]
        }
        opacity={SHIELD_OPACITY}
      />
    </group>
  )
}

export function DeflectorShieldPreview({
  unsupported = false,
}: {
  unsupported?: boolean
}) {
  return (
    <DeflectorShieldModel
      color={
        unsupported
          ? PLACEMENT_UNSUPPORTED_COLOR
          : hexTerrainColor[HexTerrain.deflectorShield]
      }
      opacity={Math.min(SHIELD_OPACITY, PIECE_PREVIEW_OPACITY)}
    />
  )
}

/** Just above the empty table hexes (their top is HEX_HEIGHT / 40). */
export const VOID_MAT_Y_OFFSET = 0.012

/**
 * The mat: a flat textured mesh in its outline's shape, under everything
 * else. It never takes the pointer, so clicks and hover reach the table hex
 * or piece underneath; selecting it by click goes through the empty table hex
 * (createEmptyHexClickHandler).
 */
export function VoidMat3D({
  isHighlighted = false,
  isMarker = false,
  opacity,
}: {
  isHighlighted?: boolean
  isMarker?: boolean
  opacity?: number
}) {
  const geometry = getVoidMatGeometry(isMarker)
  const texture = useTexture('/textures/void-mat.webp')
  useLayoutEffect(() => {
    configureVoidMatTexture(texture)
  }, [texture])
  return (
    <mesh
      geometry={geometry}
      material={getVoidMatMaterial(texture, isHighlighted, opacity)}
      raycast={() => null}
      renderOrder={-1}
    />
  )
}

/** Flat stand-in while the texture loads. */
export function VoidMatFallback({
  isHighlighted = false,
  isMarker = false,
  opacity,
}: {
  isHighlighted?: boolean
  isMarker?: boolean
  opacity?: number
}) {
  const geometry = getVoidMatGeometry(isMarker)
  return (
    <mesh
      geometry={geometry}
      material={getVoidMatFallbackMaterial(
        isHighlighted ? HIGHLIGHT_COLOR : hexTerrainColor[HexTerrain.voidMat],
        opacity,
      )}
      raycast={() => null}
    />
  )
}

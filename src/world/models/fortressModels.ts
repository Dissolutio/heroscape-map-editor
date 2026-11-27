// Virtualscape 3D models for the castle/fortress pieces (scripts/virtualscape).
// Placement, footprints, conflicts, SVG/PDF and saved maps are independent of
// the 3D models.
import { Pieces } from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'

export type FortressModelPart =
  | 'castleBase'
  | 'castleWall'
  | 'fortressDoor'
  | 'fortressArch'
  | 'fortressLadder'
  | 'fortressBattlement'

export const FORTRESS_MODEL_URLS: Record<FortressModelPart, string> = {
  castleBase: '/vs-castle-base.glb',
  castleWall: '/vs-castle-wall.glb',
  fortressDoor: '/vs-fortress-door.glb',
  fortressArch: '/vs-fortress-arch.glb',
  fortressLadder: '/vs-fortress-ladder.glb',
  fortressBattlement: '/vs-fortress-battlement.glb',
}

/** The model parts each fortress piece draws (the arch with a door adds it). */
export const FORTRESS_PIECE_PARTS: Record<string, FortressModelPart[]> = {
  [Pieces.castleBaseCorner]: ['castleBase'],
  [Pieces.castleBaseStraight]: ['castleBase'],
  [Pieces.castleBaseEnd]: ['castleBase'],
  [Pieces.castleWallCorner]: ['castleWall'],
  [Pieces.castleWallStraight]: ['castleWall'],
  [Pieces.castleWallEnd]: ['castleWall'],
  [Pieces.castleArch]: ['fortressArch', 'fortressDoor'],
  [Pieces.castleArchNoDoor]: ['fortressArch'],
  [Pieces.ladder]: ['fortressLadder'],
  [Pieces.battlement]: ['fortressBattlement'],
}

/** The GLB files a placed piece loads, or [] if none. */
export function getFortressModelUrlsForPiece(inventoryID: string) {
  const parts = FORTRESS_PIECE_PARTS[inventoryID] ?? []
  return [...new Set(parts.map((part) => getFortressModelUrl(part)))]
}

/** Not a piece yet: converted Virtualscape banner GLB. */
export const VS_FORTRESS_BANNER_URL = '/vs-fortress-banner.glb'

export function getFortressModelUrl(part: FortressModelPart) {
  return FORTRESS_MODEL_URLS[part]
}

// Shape node names in the Virtualscape GLBs.
export type CastleShape = 'Corner' | 'Straight' | 'End'

export function vsCastleNodeName(kind: 'Base' | 'Wall', shape: CastleShape) {
  return `VsCastle${kind}${shape}`
}

/**
 * Where each Virtualscape model must land: the classic model's bottom and top
 * in its own frame (the group the app positions it in). The model is fitted
 * piecewise (fortressHeightFit.ts): its body is stretched from its true
 * bottom to its shoulder onto these, and its receiver keeps its real height.
 * Pieces the app stacks on them then land where they always have.
 */

// The classic wall body is a one-level unit stretched to scaleY levels; its
// cap is 0.1 thick on top of that.
export const CLASSIC_CAP_THICKNESS = 0.1

export const classicWallTop = (scaleY: number) =>
  scaleY * HEXGRID_HEX_HEIGHT + CLASSIC_CAP_THICKNESS

/** Classic bottoms and tops of the fixed-height pieces (the wall stretches). */
export const CLASSIC_HEIGHTS = {
  // body 0..0.35 plus a 0.1 cap
  castleBase: { bottom: 0, top: 0.45 },
  // body 0..3.5 plus 0.1 caps; the door fits with the arch
  fortressArch: { bottom: 0, top: 3.6 },
  fortressLadder: { bottom: 0, top: 0.7 },
  fortressBattlement: { bottom: 0.1, top: 1.75 },
} as const

export type VsFitTarget = {
  dstBottom: number
  dstTop: number
  shoulder: 'walkway' | 'top'
  keepReceiver: boolean
}

/**
 * The fit for one part. `scaleY` is the classic wall's stretch (walls only);
 * `isTopCovered` drops the receiver of a wall or base with a piece on top.
 */
export function vsFitTarget(
  part: Exclude<FortressModelPart, 'fortressDoor'>,
  { scaleY = 9.99, isTopCovered = false } = {},
): VsFitTarget {
  if (part === 'castleWall') {
    return {
      dstBottom: 0,
      dstTop: classicWallTop(scaleY),
      shoulder: 'walkway',
      keepReceiver: !isTopCovered,
    }
  }
  const { bottom, top } = CLASSIC_HEIGHTS[part]
  return {
    dstBottom: bottom,
    dstTop: top,
    // Bases have a receiver; ladders keep their hooks above the top rung.
    shoulder:
      part === 'castleBase' || part === 'fortressLadder' ? 'walkway' : 'top',
    keepReceiver: part === 'castleBase' ? !isTopCovered : true,
  }
}

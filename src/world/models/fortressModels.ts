// Which 3D models the castle/fortress pieces use: Hexoscape's own ("classic")
// or the ones converted from Virtualscape (scripts/virtualscape). Only the
// 3D models change; placement, footprints, conflicts, SVG/PDF and saved maps
// do not depend on this.
import { Pieces } from '../../types'
import { HEXGRID_HEX_HEIGHT } from '../../utils/constants'

export type FortressModelSet = 'classic' | 'vs'

export const FORTRESS_MODEL_SETS: FortressModelSet[] = ['classic', 'vs']

export const FORTRESS_MODEL_SET_LABELS: Record<FortressModelSet, string> = {
  classic: 'Classic',
  vs: 'Virtualscape',
}

export type FortressModelPart =
  | 'castleBase'
  | 'castleWall'
  | 'fortressDoor'
  | 'fortressArch'
  | 'fortressLadder'
  | 'fortressBattlement'

export const FORTRESS_MODEL_URLS: Record<
  FortressModelSet,
  Record<FortressModelPart, string>
> = {
  classic: {
    castleBase: '/adjustable-castle-walls.glb',
    castleWall: '/adjustable-castle-walls.glb',
    fortressDoor: '/castle-arch-handmade.glb',
    fortressArch: '/castle-arch-handmade.glb',
    fortressLadder: '/handmade-ladder.glb',
    fortressBattlement: '/handmade-battlement.glb',
  },
  vs: {
    castleBase: '/vs-castle-base.glb',
    castleWall: '/vs-castle-wall.glb',
    fortressDoor: '/vs-fortress-door.glb',
    fortressArch: '/vs-fortress-arch.glb',
    fortressLadder: '/vs-fortress-ladder.glb',
    fortressBattlement: '/vs-fortress-battlement.glb',
  },
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

/** The GLB files a placed piece loads for this model set, or [] if none. */
export function getFortressModelUrlsForPiece(
  inventoryID: string,
  set: FortressModelSet,
) {
  const parts = FORTRESS_PIECE_PARTS[inventoryID] ?? []
  return [...new Set(parts.map((part) => getFortressModelUrl(part, set)))]
}

/** Not a piece yet: only previewed on the dev-only model comparison page. */
export const VS_FORTRESS_BANNER_URL = '/vs-fortress-banner.glb'

export function getFortressModelUrl(
  part: FortressModelPart,
  set: FortressModelSet,
) {
  return FORTRESS_MODEL_URLS[set][part]
}

export const isFortressModelSet = (value: unknown): value is FortressModelSet =>
  value === 'classic' || value === 'vs'

/** `?fortress=vs` or `?fortress=classic` overrides the saved setting. */
export function getFortressModelOverride(
  search: string,
): FortressModelSet | null {
  const value = new URLSearchParams(search).get('fortress')
  return isFortressModelSet(value) ? value : null
}

export function resolveFortressModelSet(
  setting: FortressModelSet,
  search: string,
): FortressModelSet {
  return getFortressModelOverride(search) ?? setting
}

// Shape node names in the Virtualscape GLBs.
export type CastleShape = 'Corner' | 'Straight' | 'End'

export function vsCastleNodeName(kind: 'Base' | 'Wall', shape: CastleShape) {
  return `VsCastle${kind}${shape}`
}

/**
 * The Virtualscape models are drawn at Hexoscape's hex size and level height,
 * but the classic models these sit in for are not: each is fitted, in Y only,
 * so its walkable top lands where the classic model's top is. Pieces the app
 * stacks on them then land where they always have. `walkableTop` comes from
 * the GLB node's extras (written by the converter).
 */

// The classic wall body is a one-level unit stretched to scaleY levels; its
// cap is 0.1 thick on top of that.
export const CLASSIC_CAP_THICKNESS = 0.1

export function vsWallScaleY(scaleY: number, walkableTop: number) {
  return (scaleY * HEXGRID_HEX_HEIGHT + CLASSIC_CAP_THICKNESS) / walkableTop
}

// The classic base reaches 0.45 (body plus cap) and stands in the middle of
// the ObstacleBase plinth, whose top is at 0.0875 in the base's frame.
export const CLASSIC_BASE_TOP = 0.45
export const OBSTACLE_BASE_TOP_IN_BASE_FRAME = 0.0875

export function vsBaseTransformY(walkableTop: number) {
  const scale =
    (CLASSIC_BASE_TOP - OBSTACLE_BASE_TOP_IN_BASE_FRAME) / walkableTop
  return { offset: OBSTACLE_BASE_TOP_IN_BASE_FRAME, scale }
}

// The classic arch body is 3.5 tall with 0.1 caps on top.
export const CLASSIC_ARCH_TOP = 3.6

export function vsArchScaleY(walkableTop: number) {
  return CLASSIC_ARCH_TOP / walkableTop
}

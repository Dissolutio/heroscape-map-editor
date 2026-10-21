/**
 * Which land hexes the conflict evaluator treats a Laur wall add-on as
 * physically blocking. Add-ons still have no grid expansion and render
 * straight from boardPieces.
 *
 * Covers lwl2 (laurWallLongStackable), lwr2 and lwr3 (laurWallRuin2/3). Each
 * sits on a Laur square or triangle pillar at `anchor` and reaches out from
 * it (see the +x extent of the models and the `rotation * -60deg` turn in
 * world/MapBoardPiece3D.tsx):
 *  - integer rotation d: over the hex side toward neighbour d, partially
 *    blocking that one hex (ruins only)
 *  - half-step d+0.5: over the vertex between neighbours d and d+1 and on
 *    along the side they share, blocking land on both. For lwl2 that is the
 *    span to the next pillar two hexes away; it is valid at half-steps only.
 * The anchor hex itself is never listed: the pillar already stands there.
 */
import type { CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'

/**
 * The footprint source says 10 levels; registered metadata says 12 for these
 * pieces. Keep this measured footprint value unchanged until verified.
 */
const LAUR_ADDON_HEIGHT_IN_LEVELS = 10

const HALF_STEP_ONLY = new Set<string>([Pieces.laurWallLongStackable])
const ANY_ROTATION = new Set<string>([
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
])

export type LaurAddonFootprint = {
  /** Land hexes the add-on blocks, at the add-on's altitude band. */
  blockedHexes: CubeCoordinate[]
  /** The add-on's altitude, as given (its BoardPiece altitude). */
  altitude: number
  heightInLevels: number
}

/**
 * The land hexes a Laur wall add-on blocks, or null when the piece is not
 * covered here or the rotation is not valid for it. Never throws.
 */
export function getLaurAddonFootprint({
  inventoryID,
  anchor,
  altitude,
  rotation,
}: {
  inventoryID: string
  anchor: CubeCoordinate
  altitude: number
  rotation: number
}): LaurAddonFootprint | null {
  if (!HALF_STEP_ONLY.has(inventoryID) && !ANY_ROTATION.has(inventoryID)) {
    return null
  }
  const halfSteps = rotation * 2
  if (!Number.isInteger(halfSteps)) return null
  const normalized = (((halfSteps % 12) + 12) % 12) / 2 // 0, 0.5, ... 5.5
  const isHalfStep = !Number.isInteger(normalized)
  if (!isHalfStep && HALF_STEP_ONLY.has(inventoryID)) return null

  const d = Math.floor(normalized)
  const directions = isHalfStep
    ? [HEX_DIRECTIONS[d], HEX_DIRECTIONS[(d + 1) % 6]]
    : [HEX_DIRECTIONS[d]]
  return {
    blockedHexes: directions.map((dir) => hexUtilsAdd(anchor, dir)),
    altitude,
    heightInLevels: LAUR_ADDON_HEIGHT_IN_LEVELS,
  }
}

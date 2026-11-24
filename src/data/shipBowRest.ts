import type { BoardHexes, BoardPiece } from '../types'
import { HexTerrain, Pieces } from '../types'
import { isFluidTerrainHex } from '../utils/board-utils'
import {
  HEXGRID_HEX_HEIGHT,
  HEXGRID_HEXCAP_FLUID_SCALE,
} from '../utils/constants'
import { genBoardHexID } from '../utils/map-utils'
import { piecesSoFar } from './pieces'
import getPieceTemplateCoords from './rotationTransforms'
import { isHexBaseLevelOpen } from './vertical-obstruction-templates'

/**
 * How far the 3D drop goes for a piece standing on a single fluid tile: the
 * same drop the other pieces use on fluid caps (map-utils
 * yDropForBeingOnFluidTile), half a level.
 */
export const SHIP_BOW_FLUID_REST_DROP =
  HEXGRID_HEX_HEIGHT - HEXGRID_HEX_HEIGHT * HEXGRID_HEXCAP_FLUID_SCALE

/*
 Ship Bow resting on fluid (John, 2026-11-12). Visual only: the bow's
 altitude, level, cells and conflicts stay at the full level
 (getShipPlacementAltitude), as on solid. Only the model drops half a level
 when the bow rests on a single fluid tile. The Ship Wall is held by friction
 and never drops.

 The bow rests on its resting hexes: every template hex whose range includes
 level 1 (not the figurehead and not the notch hexes). Under each one, the
 hex at the placement altitude has a top: a fluid tile's top is half a level
 below its altitude (one tile on solid or the table is at a whole altitude and
 a half-level top; two stacked are at X.5 and a whole-level top), anything
 else is at its altitude. The table is level 0. When the highest top is at a
 half level, the model drops by half a level. When it is a whole level (solid,
 two stacked fluid tiles, solid under at least one hex, the table), or no
 hex is there at all, it does not.
*/

/** The y offset (world units, 0 or negative) of the Ship Bow's 3D model. */
export function getShipBowRestOffset(
  piece: Pick<
    BoardPiece,
    'inventoryID' | 'altitude' | 'rotation' | 'pieceCoords'
  >,
  boardHexes: BoardHexes,
): number {
  if (piece.inventoryID !== Pieces.shipBow) return 0
  const template = piecesSoFar[Pieces.shipBow].template
  const coords = getPieceTemplateCoords({
    clickedHex: piece.pieceCoords,
    rotation: piece.rotation,
    template,
    isVsTile: false,
  })
  let highestTop: number | undefined
  coords.forEach((hex, i) => {
    if (isHexBaseLevelOpen(Pieces.shipBow, i)) return
    const under =
      boardHexes[genBoardHexID({ ...hex, altitude: piece.altitude })]
    if (!under) return
    const top =
      under.terrain !== HexTerrain.empty && isFluidTerrainHex(under.terrain)
        ? under.altitude - 0.5
        : under.altitude
    if (highestTop === undefined || top > highestTop) highestTop = top
  })
  if (highestTop === undefined || Number.isInteger(highestTop)) return 0
  return -SHIP_BOW_FLUID_REST_DROP
}

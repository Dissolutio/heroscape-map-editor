import { type BoardHex, type BoardHexes, HexTerrain } from '../types.ts'
import {
  isFluidTerrainHex,
  isJungleTerrainHex,
  isSolidTerrainHex,
} from '../utils/board-utils.ts'
import { isFluidCapVisible } from '../utils/fluidStacks.ts'

export type InstanceBoardHexes = {
  subTerrainHexes: BoardHex[]
  emptyHexCaps: BoardHex[]
  solidHexCaps: BoardHex[]
  fluidHexCaps: BoardHex[]
}
/**
 * Sorts board hexes into the legacy instanced cap and subterrain buckets.
 * Hexes the per-hex land renderer draws are left out of the cap buckets.
 */
export function getInstanceBoardHexes(
  boardHexes: BoardHexes,
  boardHexesArr: BoardHex[],
  isTakingPicture: boolean,
  viewingLevel: number,
  perHexLandIDs: Set<string>,
) {
  return boardHexesArr
    .filter((bh) => bh.altitude <= viewingLevel)
    .reduce(
      (result: InstanceBoardHexes, current) => {
        const isEmptyCap =
          !isTakingPicture && current?.terrain === HexTerrain.empty
        const isSolidCap = isSolidTerrainHex(current?.terrain) // We render solid caps for aesthetics, even if they are not caps for building on click
        // a covered fluid cap still shows when a solid overhangs it with clearance
        const isFluidCap =
          isFluidTerrainHex(current?.terrain) &&
          isFluidCapVisible(current, boardHexes)
        const isSubTerrain =
          isSolidTerrainHex(current?.terrain) ||
          (isJungleTerrainHex(current?.terrain) && current.isObstacleOrigin)
        const isPerHexLand = perHexLandIDs.has(current.id)
        // const isSubTerrain = isSolidTerrainHex(current.terrain) || isFluidTerrainHex(current.terrain)
        if (isEmptyCap) {
          result.emptyHexCaps.push(current)
        }
        if (isSolidCap && !isPerHexLand) {
          result.solidHexCaps.push(current)
        }
        if (isFluidCap && !isPerHexLand) {
          result.fluidHexCaps.push(current)
        }
        if (isSubTerrain) {
          result.subTerrainHexes.push(current)
        }
        return result
      },
      {
        emptyHexCaps: [],
        solidHexCaps: [],
        fluidHexCaps: [],
        subTerrainHexes: [],
      },
    )
}

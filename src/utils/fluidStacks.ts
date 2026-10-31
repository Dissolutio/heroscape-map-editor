import type { BoardHex, BoardHexes, CubeCoordinate } from '../types'
import {
  isFluidTerrainHex,
  isSolidTerrainHex,
  isWholeLevelAltitude,
} from './board-utils'
import {
  HEXGRID_FLUID_LEVEL_INCREMENT,
  HEXGRID_LEVEL_INCREMENT,
} from './constants'
import { genBoardHexID } from './map-utils'

/**
 * The app stacks each fluid tile on fluid exactly half a level up, but the
 * physical tiles are a little more than half the height of a solid tile.
 * Measured by the owner: 2, 4, 6 and 8 stacked fluid tiles line up with 1, 2,
 * 3 and 4 solid tiles, 9 lines up with 5, and 10 is noticeably taller than 5.
 * So straight runs longer than this get a warning.
 */
export const MAX_FLUID_STACK_BEFORE_WARNING = 8

// Fluid on fluid always rises exactly half a level (getLandAltitudeIncrement).
const FLUID_STACK_STEP = 0.5

const isFluidHexAt = (
  boardHexes: BoardHexes,
  coord: CubeCoordinate,
  altitude: number,
) =>
  isFluidTerrainHex(boardHexes[genBoardHexID({ ...coord, altitude })]?.terrain)

/**
 * How many fluid tiles are stacked straight down from the fluid hex at
 * (coord, surface), counting it. 0 if there is no fluid hex there. A solid
 * tile or a gap in the column ends the run.
 */
export function getFluidRunLengthAt(
  boardHexes: BoardHexes,
  coord: CubeCoordinate,
  surface: number,
) {
  let count = 0
  let altitude = surface
  while (isFluidHexAt(boardHexes, coord, altitude)) {
    count++
    altitude -= FLUID_STACK_STEP
  }
  return count
}

/** The longest straight run of stacked fluid tiles anywhere on the board. */
export function getTallestFluidStack(boardHexes: BoardHexes) {
  let tallest = 0
  for (const hex of Object.values(boardHexes)) {
    if (!isFluidTerrainHex(hex.terrain)) continue
    // only measure from the top of each run
    if (isFluidHexAt(boardHexes, hex, hex.altitude + FLUID_STACK_STEP)) continue
    tallest = Math.max(
      tallest,
      getFluidRunLengthAt(boardHexes, hex, hex.altitude),
    )
  }
  return tallest
}

/** The user-facing warning for a fluid run of this length, or null if it is fine. */
export function getFluidStackWarning(runLength: number): string | null {
  if (runLength <= MAX_FLUID_STACK_BEFORE_WARNING) return null
  return `Fluid stacks are modeled at half height, but real tiles are slightly taller. Stacks over ${MAX_FLUID_STACK_BEFORE_WARNING} may exceed the map (10 tiles are taller than 5 solid levels); note this for builders.`
}

/**
 * Whether to draw the cap of a fluid hex. Rendering only; isCap keeps its
 * meaning ("a unit can stand here").
 *
 * A fluid tile is half a level tall, so a fluid hex at altitude A has its top
 * at A - 0.5. Anything sitting flush on it lands at A + 0.5 (fluid on fluid,
 * or solid on a half-level fluid). A solid on a whole-level fluid rises a
 * whole level (getLandAltitudeIncrement), to A + 1, and its bottom at A leaves
 * half a level of clearance above the fluid, so the cap shows. That is also
 * how a multi-hex solid overhangs a fluid hex from a neighbouring stack.
 */
export function isFluidCapVisible(hex: BoardHex, boardHexes: BoardHexes) {
  if (hex.isCap) return true
  if (!isWholeLevelAltitude(hex.altitude)) return false
  const hexAt = (altitude: number) =>
    boardHexes[genBoardHexID({ ...hex, altitude })]
  if (hexAt(hex.altitude + HEXGRID_FLUID_LEVEL_INCREMENT)) return false
  return isSolidTerrainHex(
    hexAt(hex.altitude + HEXGRID_LEVEL_INCREMENT)?.terrain,
  )
}

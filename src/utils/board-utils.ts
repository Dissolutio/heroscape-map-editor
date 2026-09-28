import { type BoardHexes, HexTerrain, Pieces } from '../types'
import {
  HEXGRID_FLUID_LEVEL_INCREMENT,
  HEXGRID_LEVEL_INCREMENT,
} from './constants'

export function isFluidTerrainHex(terrain: string) {
  return (
    terrain === HexTerrain.wellspringWater ||
    terrain === HexTerrain.water ||
    terrain === HexTerrain.lava ||
    terrain === HexTerrain.swampWater ||
    terrain === HexTerrain.ice ||
    terrain === HexTerrain.toxicWater ||
    terrain === HexTerrain.shadow
  )
}
export function isSolidTerrainHex(terrain: string) {
  return (
    terrain === HexTerrain.grass ||
    terrain === HexTerrain.rock ||
    terrain === HexTerrain.sand ||
    terrain === HexTerrain.road ||
    terrain === HexTerrain.snow ||
    terrain === HexTerrain.lavaField ||
    terrain === HexTerrain.concrete ||
    terrain === HexTerrain.asphalt ||
    terrain === HexTerrain.dungeon ||
    terrain === HexTerrain.toxic ||
    terrain === HexTerrain.ancientTerrain ||
    terrain === HexTerrain.wood ||
    terrain === HexTerrain.wallWalk ||
    terrain === HexTerrain.swamp
  )
}
export function isJungleTerrainHex(terrain: string) {
  return terrain === HexTerrain.brush || terrain === HexTerrain.palm
}
export function isEvergreenTree(terrain: string) {
  return terrain === HexTerrain.tree || terrain === HexTerrain.snowTree
}
export function isCastleTerrain(terrain: string) {
  return terrain === HexTerrain.castleWall || terrain === HexTerrain.castleBase
}

export function isBridgingObstaclePieceID(id: string) {
  // isObstaclePieceSupported: EXCEPTION MADE FOR OBSTACLES WITH FLUID BASES, THEY CAN BRIDGE (be placed without all hexes supported underneath)
  return (
    id === Pieces.glacier4 ||
    id === Pieces.glacier6 ||
    id === Pieces.glacier3 ||
    id === Pieces.outcrop3 ||
    id === Pieces.lavaRockOutcrop3
  )
}
export const getBoardHexObstacleOriginsAndHexesAndEmpties = (
  boardHexes: BoardHexes,
): BoardHexes => {
  return Object.values(boardHexes).reduce((acc, hex) => {
    if (hex.isObstacleOrigin || hex.terrain === 'empty') {
      acc[hex.id] = hex
    }
    return acc
  }, {} as BoardHexes)
}
// The altitude a newly-placed land piece rises above whatever it is built on.
// Only fluid-on-fluid stacking uses the half increment; every other combination
// (solid on anything, or fluid on solid/table) keeps the original whole-level rise.
export function getLandAltitudeIncrement(
  pieceTerrain: string,
  isUnderFluid: boolean,
) {
  return isFluidTerrainHex(pieceTerrain) && isUnderFluid
    ? HEXGRID_FLUID_LEVEL_INCREMENT
    : HEXGRID_LEVEL_INCREMENT
}
// Half-level altitudes (X.5) only ever come from fluid-on-fluid stacking. Since they are
// always built from exact sums of 0.5/1 starting at 0, this is safe from float drift.
export function isWholeLevelAltitude(altitude: number) {
  return Number.isInteger(altitude)
}
// Governs what a land pen-mode (solid or fluid) is allowed to target: solid land can go
// on solid/table/empty or on a fluid hex ONLY if that fluid sits on a whole level (never
// on a half-level fluid cap); fluid can stack on solid/table/empty or on ANY fluid hex.
export function canPlaceLandTileOnHex(
  pieceTerrain: string,
  hexTerrain: string | undefined,
  hexAltitude: number | undefined,
) {
  if (!hexTerrain || hexTerrain === HexTerrain.empty) return true
  if (isSolidTerrainHex(hexTerrain)) return true
  if (isFluidTerrainHex(hexTerrain)) {
    if (isFluidTerrainHex(pieceTerrain)) return true
    return hexAltitude !== undefined && isWholeLevelAltitude(hexAltitude)
  }
  return false
}

export const isLaurWallAddonPieceID = (pieceID: string): boolean => {
  return (
    pieceID === Pieces.laurWallRuin1 ||
    pieceID === Pieces.laurWallRuin2 ||
    pieceID === Pieces.laurWallRuin3 ||
    pieceID === Pieces.laurWallLong ||
    pieceID === Pieces.laurWallArch ||
    pieceID === Pieces.laurWallLongStackable ||
    pieceID === Pieces.laurWallShort ||
    pieceID === Pieces.laurWallShortStackable
  )
}

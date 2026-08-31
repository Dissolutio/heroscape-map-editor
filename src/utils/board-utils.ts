import { type BoardHexes, HexTerrain, Pieces } from '../types'

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

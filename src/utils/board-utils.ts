import { piecesSoFar } from '../data/pieces'
import { type BoardHexes, HexTerrain, Pieces } from '../types'
import { decodePieceID } from './map-utils'
export function isFluidTerrainHex(terrain: string) {
  return (
    terrain === HexTerrain.wellspringWater ||
    terrain === HexTerrain.water ||
    terrain === HexTerrain.lava ||
    terrain === HexTerrain.swampWater ||
    terrain === HexTerrain.ice ||
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
    terrain === HexTerrain.wallWalk ||
    terrain === HexTerrain.swamp
  )
}
export function isRenderedFromPieceIDPiece(inventoryID: string) {
  return (
    inventoryID === Pieces.battlement ||
    inventoryID === Pieces.roadWall ||
    inventoryID === Pieces.laurWallRuin ||
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallLong
  )
}
export function isJungleTerrainHex(terrain: string) {
  return terrain === HexTerrain.brush || terrain === HexTerrain.palm
}
export function isEvergreenTree(terrain: string) {
  return terrain === HexTerrain.tree || terrain === HexTerrain.snowTree
}
export function isCastleTerrain(terrain: string) {
  return terrain === HexTerrain.castle
}

export function isBridgingObstaclePieceID(id: string) {
  // isObstaclePieceSupported: EXCEPTION MADE FOR OBSTACLES WITH FLUID BASES, THEY CAN BRIDGE
  return id === Pieces.glacier4 || id === Pieces.glacier6 || id === Pieces.hive
}
export const getBoardHexObstacleOriginsAndHexesAndEmpties = (
  boardHexes: BoardHexes,
): BoardHexes => {
  return Object.values(boardHexes).reduce((acc, hex) => {
    const inventoryID = decodePieceID(hex.pieceID).inventoryID

    if (hex.isObstacleOrigin || hex.terrain === 'empty') {
      acc[hex.id] = hex
    }
    return acc
  }, {} as BoardHexes)
}

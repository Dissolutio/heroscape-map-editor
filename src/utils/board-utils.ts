import { piecesSoFar } from '../data/pieces'
import { type BoardHexes, HexTerrain, Pieces } from '../types'
import { decodePieceID } from './map-utils'
export function isFluidTerrainHex(terrain: string) {
  if (
    terrain === HexTerrain.wellspringWater ||
    terrain === HexTerrain.water ||
    terrain === HexTerrain.lava ||
    terrain === HexTerrain.swampWater ||
    terrain === HexTerrain.ice ||
    terrain === HexTerrain.shadow
  ) {
    return true
  } else {
    return false
  }
}
export function isSolidTerrainHex(terrain: string) {
  if (
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
  ) {
    return true
  } else {
    return false
  }
}
export function isRenderedFromPieceIDPiece(inventoryID: string) {
  if (
    inventoryID === Pieces.battlement ||
    inventoryID === Pieces.roadWall ||
    inventoryID === Pieces.laurWallRuin ||
    inventoryID === Pieces.laurWallShort ||
    inventoryID === Pieces.laurWallLong
  ) {
    return true
  } else {
    return false
  }
}
export function isJungleTerrainHex(terrain: string) {
  if (
    terrain === HexTerrain.brush ||
    terrain === HexTerrain.palm ||
    terrain === HexTerrain.laurBrush ||
    terrain === HexTerrain.laurPalm ||
    terrain === HexTerrain.swampBrush
  ) {
    return true
  } else {
    return false
  }
}
export function isEvergreenTree(terrain: string) {
  if (terrain === HexTerrain.tree || terrain === HexTerrain.snowTree) {
    return true
  } else {
    return false
  }
}

export function isObstaclePieceID(id: string) {
  if (
    id === Pieces.laurWallPillar ||
    id === Pieces.tree10 ||
    id === Pieces.tree11 ||
    id === Pieces.tree12 ||
    id === Pieces.tree415 ||
    id === Pieces.swampBrush10 ||
    id === Pieces.brush9 ||
    id === Pieces.palm14 ||
    id === Pieces.palm15 ||
    id === Pieces.palm16 ||
    id === Pieces.laurBrush10 ||
    id === Pieces.laurPalm13 ||
    id === Pieces.laurPalm14 ||
    id === Pieces.laurPalm15 ||
    id === Pieces.outcrop1 ||
    id === Pieces.outcrop3 ||
    id === Pieces.lavaRockOutcrop1 ||
    id === Pieces.lavaRockOutcrop3 ||
    id === Pieces.glacier1 ||
    id === Pieces.glacier3 ||
    id === Pieces.glacier4 ||
    id === Pieces.glacier6 ||
    id === Pieces.hive
  ) {
    return true
  } else {
    return false
  }
}
export function isBridgingObstaclePieceID(id: string) {
  // isObstaclePieceSupported: EXCEPTION MADE FOR OBSTACLES WITH FLUID BASES, THEY CAN BRIDGE
  if (id === Pieces.glacier4 || id === Pieces.glacier6 || id === Pieces.hive) {
    return true
  } else {
    return false
  }
}
export const getBoardHexObstacleOriginsAndHexesAndEmpties = (
  boardHexes: BoardHexes,
): BoardHexes => {
  return Object.values(boardHexes).reduce((acc, hex) => {
    const inventoryID = decodePieceID(hex.pieceID).inventoryID
    const isPieceOriginHex =
      piecesSoFar[inventoryID]?.isHexTerrainPiece ||
      (piecesSoFar[inventoryID]?.isObstaclePiece && hex.isObstacleOrigin)

    if (isPieceOriginHex || hex.terrain === 'empty') {
      acc[hex.id] = hex
    }
    return acc
  }, {} as BoardHexes)
}

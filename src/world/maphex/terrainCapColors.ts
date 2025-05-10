import { HexTerrain } from '../../types'
import { hexTerrainColor } from './hexColors'

export const terrainCapColors: { [terrain: string]: string } = {
  // these three use a brown subterrain
  [HexTerrain.grass]: hexTerrainColor.grass,
  [HexTerrain.rock]: hexTerrainColor.rock,
  [HexTerrain.sand]: hexTerrainColor.sand,
  // these below have same color subterrain, so a little different shade on the cap for aesthetics
  [HexTerrain.lavaField]: hexTerrainColor.lavaFieldCap,
  [HexTerrain.road]: hexTerrainColor.roadWall,
  [HexTerrain.wallWalk]: hexTerrainColor.roadWall,
  [HexTerrain.dungeon]: hexTerrainColor.dungeonCap,
  [HexTerrain.snow]: hexTerrainColor.snowCap,
  [HexTerrain.asphalt]: hexTerrainColor.asphaltCap,
  [HexTerrain.concrete]: hexTerrainColor.concreteCap,
  [HexTerrain.swamp]: hexTerrainColor.swampCap,
}

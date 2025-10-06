import { type PieceInventory, Pieces } from '../types'
export * as setInventories from './inventories'

/* 
SHORES:
12 2-hex wood
1 crashed ship bow
2 crashed ship walls
3 cannons
6 rope ladders

FORESTS
2 10H trees
2 12H trees
2 15H 4-hex trees

URBAN LANDSCAPE OF VALHALLA
1 24-hex asphalt
2 7-hex asphalt
1 3-hex asphalt
4 2-hex asphalt
2 1-hex asphalt

1 24-hex concrete
2 7-hex concrete
1 3-hex concrete
4 2-hex concrete
2 1-hex concrete

2 fortified walls

CAVERNS OF VALHALLA
2 24-hex dungeon
5 7-hex dungeon
2 3-hex dungeon
2 2-hex dungeon
7 1-hex dungeon

6 1-hex shadow
6 1-hex shadow (modified, with holes)

3 1-hex rock outcrops
1 3-hex rock outcrop

Rumble at the Rift BB
2 24-hex asphalt

5 7-hex concrete
6 3-hex concrete

5 1-hex shadow tiles

6 1-hex toxic
5 1-hex toxic water

2 fortified walls
*/

export const maxSharedTerrainKit: PieceInventory = {
  // https://www.heroscapers.com/threads/max-shared-terrain-kit-mstk.64183/
  [Pieces.grass1]: 10,
  [Pieces.grass2]: 5, // totk 6
  [Pieces.grass3]: 2, // totk 6
  [Pieces.grass7]: 4, // totk 7
  [Pieces.grass24]: 3, // 2 when using LandsOfValhalla, totk 3
  [Pieces.rock1]: 4, //
  [Pieces.rock2]: 3, // totk 3
  [Pieces.rock3]: 1, // totk 3
  [Pieces.rock7]: 2, // totk 5
  [Pieces.rock24]: 2, // totk 2
  [Pieces.sand1]: 4, // totk 5
  [Pieces.sand2]: 2, // totk 3
  [Pieces.sand3]: 1, // totk 3
  [Pieces.sand7]: 2, // totk 5
  [Pieces.sand24]: 0, // 1 when using LandsOfValhalla, totk 0
  [Pieces.water1]: 12, // totk 12
}
export const tournamentOrganizerTerrainKitPieceSet: PieceInventory = {
  // This is intended by Renegade to make 4 maps, the community may come up with a system as well
  [Pieces.grass1]: 64, // 16
  [Pieces.grass2]: 24, // 8
  [Pieces.grass3]: 24, // 6
  [Pieces.grass7]: 28, // 7
  [Pieces.grass24]: 12, // 3
  [Pieces.rock1]: 20, // 5
  [Pieces.rock2]: 12, // 3
  [Pieces.rock3]: 12, // 3
  [Pieces.rock7]: 20, // 5
  [Pieces.rock24]: 8, // 2
  [Pieces.sand1]: 20, // 5
  [Pieces.sand2]: 12, // 3
  [Pieces.sand3]: 12, // 3
  [Pieces.sand7]: 20, // 5
  [Pieces.water1]: 48, // 12
  [Pieces.laurWallSquarePillar]: 8,
  [Pieces.laurWallLong]: 4,
  [Pieces.laurBrush10]: 12,
}
export const aoa1PieceSet: PieceInventory = {
  [Pieces.grass1]: 10,
  [Pieces.grass2]: 6,
  [Pieces.grass3]: 2,
  [Pieces.grass7]: 4,
  [Pieces.grass24]: 6,
  [Pieces.rock1]: 4,
  [Pieces.rock2]: 5,
  [Pieces.rock3]: 1,
  [Pieces.rock7]: 2,
  [Pieces.rock24]: 2,
  [Pieces.sand1]: 4,
  [Pieces.sand2]: 5,
  [Pieces.sand3]: 1,
  [Pieces.sand7]: 2,
  [Pieces.water1]: 20,
  [Pieces.laurWallSquarePillar]: 8,
  [Pieces.laurWallShort]: 4,
  [Pieces.laurWallRuin1]: 2,
  [Pieces.laurWallLong]: 1,
}
export const ruinsOfValhallaPieceSet: PieceInventory = {
  [Pieces.laurWallTrianglePillar]: 4,
  [Pieces.laurWallPillarStackable]: 6,
  [Pieces.laurWallShortStackable]: 5,
  [Pieces.laurWallRuin2]: 2,
  [Pieces.laurWallRuin3]: 2,
  [Pieces.laurWallArch]: 1,
  [Pieces.laurWallLongStackable]: 5,
}
export const battleBox1PieceSet: PieceInventory = {
  [Pieces.laurPalm15]: 1,
  [Pieces.laurPalm14]: 1,
  [Pieces.grass1]: 4,
  [Pieces.grass3]: 3,
  [Pieces.grass7]: 3,
  [Pieces.grass24]: 2,
  [Pieces.rock1]: 2,
  [Pieces.rock3]: 2,
  [Pieces.rock7]: 2,
  [Pieces.water1]: 6,
  [Pieces.wellspringWater1]: 7,
}
export const landsPieceSet: PieceInventory = {
  [Pieces.grass1]: 10,
  [Pieces.grass2]: 7,
  [Pieces.grass3]: 3,
  [Pieces.grass7]: 5,
  [Pieces.grass24]: 2,
  [Pieces.rock1]: 5,
  [Pieces.rock2]: 6,
  [Pieces.rock3]: 2,
  [Pieces.rock7]: 3,
  [Pieces.rock24]: 2,
  [Pieces.sand1]: 5,
  [Pieces.sand2]: 6,
  [Pieces.sand3]: 2,
  [Pieces.sand7]: 3,
  [Pieces.sand24]: 2,
}
export const snowsPieceSet: PieceInventory = {
  [Pieces.snow1]: 2,
  [Pieces.snow2]: 2,
  [Pieces.snow3]: 2,
  [Pieces.snow7]: 5,
  [Pieces.snow24]: 2,
  [Pieces.snowTree10]: 1,
  [Pieces.snowTree12]: 1,
  [Pieces.ice1]: 20,
  [Pieces.ice3]: 3,
}
export const lavaFieldsPieceSet: PieceInventory = {
  [Pieces.lavaField1]: 2,
  [Pieces.lavaField2]: 2,
  [Pieces.lavaField3]: 2,
  [Pieces.lavaField7]: 5,
  [Pieces.lavaField24]: 2,
  [Pieces.lavaRockOutcrop1]: 3,
  [Pieces.lavaRockOutcrop3]: 1,
  [Pieces.lava1]: 20,
  [Pieces.lava3]: 20,
}
export const roadsOfValhallaPieceSet: PieceInventory = {
  [Pieces.road1]: 16,
  [Pieces.road5]: 2,
  [Pieces.roadWall]: 4,
}
export const swampsPieceSet: PieceInventory = {
  [Pieces.swamp1]: 2,
  [Pieces.swamp2]: 2,
  [Pieces.swamp3]: 2,
  [Pieces.swamp7]: 5,
  [Pieces.swamp24]: 2,
  [Pieces.swampBrush10]: 2,
  [Pieces.swampWater1]: 20,
  [Pieces.swampWater3]: 3,
}
export const watersPieceSet: PieceInventory = {
  [Pieces.water1]: 24,
  [Pieces.water3]: 5,
  [Pieces.wellspringWater1]: 6,
}
export const laurJunglePieceSet: PieceInventory = {
  [Pieces.laurPalm13]: 1,
  [Pieces.laurPalm14]: 1,
  [Pieces.laurPalm15]: 1,
  [Pieces.laurBrush10]: 6,
}
export const ticallaJunglePieceSet: PieceInventory = {
  [Pieces.palm14]: 1,
  [Pieces.palm15]: 1,
  [Pieces.palm16]: 1,
  [Pieces.brush9]: 6,
}
export const fortressPieceSet: PieceInventory = {
  [Pieces.castleBaseCorner]: 10,
  [Pieces.castleBaseStraight]: 7,
  [Pieces.castleBaseEnd]: 4,
  [Pieces.castleWallCorner]: 10,
  [Pieces.castleWallStraight]: 7,
  [Pieces.castleWallEnd]: 4,
  [Pieces.castleArch]: 1,
  [Pieces.battlement]: 50,
  [Pieces.ladder]: 22,
  [Pieces.wallWalk1]: 21,
  [Pieces.wallWalk7]: 1,
  [Pieces.wallWalk9]: 1,
  // [Pieces.flag]: 1,
}
export const marvelPieceSet: PieceInventory = {
  [Pieces.concrete1]: 4,
  [Pieces.concrete2]: 7,
  [Pieces.concrete7]: 3,
  [Pieces.asphalt1]: 3,
  [Pieces.asphalt2]: 8,
  [Pieces.asphalt7]: 3,
  [Pieces.marvel]: 1,
  [Pieces.concrete6]: 1,
}
export const thaelenkPieceSet: PieceInventory = {
  [Pieces.glacier1]: 1,
  [Pieces.glacier3]: 1,
  [Pieces.glacier4]: 1,
  [Pieces.glacier6]: 1,
  [Pieces.snow1]: 12,
  [Pieces.snow2]: 12,
  [Pieces.ice1]: 21,
  [Pieces.ice3]: 1,
  [Pieces.ice4]: 1,
  [Pieces.ice6]: 1,
}
export const volcarrenPieceSet: PieceInventory = {
  [Pieces.lava1]: 11,
  [Pieces.lavaField1]: 5,
  [Pieces.lavaField2]: 5,
  [Pieces.lavaField7]: 4,
}
export const forgottenForestPieceSet: PieceInventory = {
  [Pieces.road1]: 8,
  [Pieces.road2]: 8,
  [Pieces.road5]: 1,
  [Pieces.roadWall]: 2,
  [Pieces.tree415]: 1,
  [Pieces.tree10]: 1,
  [Pieces.tree11]: 2,
  [Pieces.tree12]: 1,
}
export const ms1PieceSet: PieceInventory = {
  [Pieces.grass1]: 16,
  [Pieces.grass2]: 5,
  [Pieces.grass3]: 5,
  [Pieces.grass7]: 5,
  [Pieces.grass24]: 6,
  [Pieces.rock1]: 6,
  [Pieces.rock2]: 3,
  [Pieces.rock3]: 3,
  [Pieces.rock7]: 3,
  [Pieces.rock24]: 2,
  [Pieces.sand1]: 4,
  [Pieces.sand2]: 2,
  [Pieces.sand3]: 2,
  [Pieces.sand7]: 2,
  [Pieces.water1]: 21,
  [Pieces.ruins2]: 1,
  [Pieces.ruins3]: 1,
}
export const ms2PieceSet: PieceInventory = {
  [Pieces.water1]: 8,
  [Pieces.swampWater1]: 34,
  [Pieces.swampWater6]: 1,
  [Pieces.hive]: 1,
  [Pieces.swamp1]: 2,
  [Pieces.swamp2]: 2,
  [Pieces.swamp3]: 2,
  [Pieces.swamp7]: 10,
  [Pieces.swamp24]: 2,
  [Pieces.rock1]: 1,
  [Pieces.rock2]: 1,
  [Pieces.rock3]: 1,
  [Pieces.rock7]: 1,
  [Pieces.sand1]: 1,
  [Pieces.sand2]: 1,
  [Pieces.sand3]: 2,
  [Pieces.sand7]: 5,
}
export const underdarkPieceSet: PieceInventory = {
  [Pieces.grass1]: 1,
  [Pieces.grass2]: 1,
  [Pieces.grass3]: 1,
  [Pieces.dungeon1]: 2,
  [Pieces.dungeon2]: 2,
  [Pieces.dungeon3]: 2,
  [Pieces.dungeon7]: 3,
  [Pieces.dungeon24]: 2,
  [Pieces.rock1]: 1,
  [Pieces.rock2]: 1,
  [Pieces.rock3]: 2,
  [Pieces.rock7]: 3,
  [Pieces.sand1]: 1,
  [Pieces.sand2]: 1,
  [Pieces.sand3]: 0,
  [Pieces.sand7]: 3,
  [Pieces.water1]: 12,
  [Pieces.shadow1]: 8,
  [Pieces.shadow3]: 1,
  [Pieces.outcrop1]: 3,
  [Pieces.outcrop3]: 1,
}

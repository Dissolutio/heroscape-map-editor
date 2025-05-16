import type { Dictionary } from 'lodash'
import { Pieces } from '../types'

export const pieceCodes: Dictionary<string> = {
  '1001': Pieces.grass1,
  '1002': Pieces.grass2,
  '1003': Pieces.grass3,
  '1007': Pieces.grass7,
  '1024': Pieces.grass24,

  '2001': Pieces.rock1,
  '2002': Pieces.rock2,
  '2003': Pieces.rock3,
  '2007': Pieces.rock7,
  '2024': Pieces.rock24,

  '3001': Pieces.sand1,
  '3002': Pieces.sand2,
  '3003': Pieces.sand3,
  '3007': Pieces.sand7,
  '3024': Pieces.sand24,

  '26001': Pieces.dungeon1,
  '26002': Pieces.dungeon2,
  '26003': Pieces.dungeon3,
  '26007': Pieces.dungeon7,
  '26024': Pieces.dungeon24,

  '20001': Pieces.swamp1,
  '20002': Pieces.swamp2,
  '20003': Pieces.swamp3,
  '20007': Pieces.swamp7,
  '20024': Pieces.swamp24,

  '7001': Pieces.lavaField1,
  '7002': Pieces.lavaField2,
  '7003': Pieces.lavaField3,
  '7007': Pieces.lavaField7,
  '7024': Pieces.lavaField24,

  '21001': Pieces.concrete1,
  '21002': Pieces.concrete2,
  '21007': Pieces.concrete7,

  '22001': Pieces.asphalt1,
  '22002': Pieces.asphalt2,
  '22007': Pieces.asphalt7,

  '8001': Pieces.road1,
  '8002': Pieces.road2,
  '8005': Pieces.road5,

  '9001': Pieces.snow1,
  '9002': Pieces.snow2,
  '9003': Pieces.snow3,
  '9007': Pieces.snow7,
  '9024': Pieces.snow24,

  '4001': Pieces.water1,
  '4003': Pieces.water3,

  '17001': Pieces.wellspringWater1,

  '5001': Pieces.ice1,
  '5003': Pieces.ice3,

  '6001': Pieces.lava1,
  '6003': Pieces.lava3,

  '19001': Pieces.swampWater1,
  '19003': Pieces.swampWater3,

  '25001': Pieces.shadow1,
  '25003': Pieces.shadow3,

  '24014': Pieces.palm14,
  '24015': Pieces.palm15,
  '24016': Pieces.palm16,
  '24002': Pieces.brush9,

  '10011': Pieces.tree10,
  '10012': Pieces.tree11,
  '10013': Pieces.tree12,
  '10004': Pieces.tree415,

  '11002': Pieces.ruins2,
  '11003': Pieces.ruins3,

  '23006': Pieces.hive,
  '13001': Pieces.glacier1,
  '13003': Pieces.glacier3,
  '13004': Pieces.glacier4,
  '13006': Pieces.glacier6,
  '27001': Pieces.outcrop1,
  '27003': Pieces.outcrop3,
  // marvel ruin
  '11006': Pieces.marvel, // marvel ruins also create two elevated spaces/boardHexes
  '11007': Pieces.marvelBroken, // marvel ruins also create two elevated spaces/boardHexes
  // edge add-ons
  '12004': Pieces.roadWall,
  '16301': Pieces.battlement,
  '16402': Pieces.ladder,
  // '16403': Pieces.flag,
  // castle
  '16001': Pieces.wallWalk1,
  '16007': Pieces.wallWalk7,
  '16009': Pieces.wallWalk9,
  '16101': Pieces.castleBaseCorner,
  '16102': Pieces.castleBaseStraight,
  '16103': Pieces.castleBaseEnd,
  '16201': Pieces.castleWallCorner,
  '16202': Pieces.castleWallStraight,
  '16203': Pieces.castleWallEnd,
  '16401': Pieces.castleArch, // with door
  '16404': Pieces.castleArchNoDoor, // no door
  // startzone
  '15001': 'startArea',
  // laurWallPillar
  '17101': Pieces.laurWallPillar,
}
export const startAreaColorsToPlayerID = {
  // Keys are the colorf values of StartAreaTiles from virtualscape (the colorf values are these tiles only differentiating property)
  255: '1', // red rgba(255,0,0,0)
  65280: '2', // green rgba(0,255,0,0)
  16711680: '3', // blue rgba(0,0,255,0)
  65535: '4', // yellow rgba(255,255,0,0)
  16711935: '5', // violet rgba(255,0,255,0)
  16776960: '6', // cyan rgba(0,255,255,0)
  33023: '7', // orange  rgba(255,128,0,0)
  16711808: '8', // purple rgba(128,0,255,0)
}

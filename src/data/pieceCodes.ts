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
  '11006': Pieces.marvel,
  '11007': Pieces.marvelBroken,
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
  // glyph
  '14063': Pieces.glyphPower, // virtualscape had named/revealed power glyphs but we transform them all into unrevealed "?" glyphs
  // startzone
  // '15001': 'startArea', // from virtualscape, we morph into below based on color
  '15002': Pieces.startZone1,
  '15003': Pieces.startZone2,
  '15004': Pieces.startZone3,
  '15005': Pieces.startZone4,
  '15006': Pieces.startZone5,
  '15007': Pieces.startZone6,
  '15008': Pieces.startZone7,
  '15009': Pieces.startZone8,
  // laurWallPillar
  '17101': Pieces.laurWallSquarePillar,
}

export const virtualscapeNamedPieceCodes: Dictionary<string> = {
  'custom.ancient_land_1': Pieces.ancientTerrain1,
  'custom.ancient_land_2': Pieces.ancientTerrain2,
  'custom.ancient_land_24': Pieces.ancientTerrain24,
  'custom.ancient_land_3': Pieces.ancientTerrain3,
  'custom.ancient_land_7': Pieces.ancientTerrain7,
  'custom.ancient_shroudshroom': Pieces.shroudshroom13,
  'custom.aoa_long_wall': Pieces.laurWallLong,
  'custom.aoa_pillar': Pieces.laurWallSquarePillar,
  'custom.aoa_ruined_wall': Pieces.laurWallRuin1,
  'custom.aoa_ruined_wall_b': Pieces.laurWallRuin2,
  'custom.aoa_short_wall': Pieces.laurWallShort,
  'custom.aoa_treasure_glyph': Pieces.glyphTreasure,
  'custom.aoa_triangle_pillar': Pieces.laurWallTrianglePillar,
  'custom.aoa_wall_arch': Pieces.laurWallArch,
  'custom.asphalt_24': Pieces.asphalt24,
  'core.asphalt_3': Pieces.asphalt3,
  'core.concrete_24': Pieces.concrete24,
  'custom.concrete_3': Pieces.concrete3,
  'core.cov_outcrop_3': Pieces.outcrop3,
  'core.gale_bush': Pieces.brush9,
  'core.gale_palm_14': Pieces.palm14,
  'core.gale_palm_15': Pieces.palm15,
  'core.gale_palm_16': Pieces.palm16,
  'core.ice_3': Pieces.ice3,
  'core.ice_4': Pieces.ice4,
  'core.ice_6': Pieces.ice6,
  'core.lava_3': Pieces.lava3,
  'core.lava_field_24': Pieces.lavaField24,
  'core.lava_field_3': Pieces.lavaField3,
  'core.lava_outcrop_1': Pieces.lavaRockOutcrop1,
  'core.lava_outcrop_3': Pieces.lavaRockOutcrop3,
  'custom.gi_joe_wall': Pieces.fortifiedWall,
  'custom.mature_shroudshroom': Pieces.shroudshroom10,
  'core.void_mat': Pieces.voidMat,
  'core.sand_24': Pieces.sand24,
  'core.shadow_3': Pieces.shadow3,
  'core.shov_cannon': Pieces.cannon,
  'core.shov_rope_ladder': Pieces.ropeLadder,
  'core.shov_ship_bow': Pieces.shipBow,
  'core.shov_ship_wall': Pieces.shipWall,
  'core.snow_24': Pieces.snow24,
  'core.snow_3': Pieces.snow3,
  'core.snow_7': Pieces.snow7,
  'core.snow_tree_10': Pieces.snowTree10,
  'core.snow_tree_12': Pieces.snowTree12,
  'core.swamp_water_3': Pieces.swampWater3,
  'core.swamp_water_6': Pieces.swampWater6,
  'custom.toxic_land_1': Pieces.toxic1,
  'core.toxic_land_3': Pieces.toxic3,
  'core.toxic_outcrop_1': Pieces.toxicOutcrop1,
  'core.toxic_outcrop_3': Pieces.toxicOutcrop3,
  'custom.toxic_water_1': Pieces.toxicWater1,
  'core.water_3': Pieces.water3,
  'custom.wellspring_water_1': Pieces.wellspringWater1,
  'core.wood_2': Pieces.wood2,
  'custom.young_shroudshroom': Pieces.shroudshroom7,
  'custom.pylon_2way': Pieces.twoWayPylon,
  'custom.pylon_3way': Pieces.threeWayPylon,
  'custom.energy_wall': Pieces.deflectorShield,
}

export const virtualscapeNamedPieceNames: Dictionary<string> =
  Object.fromEntries(
    Object.entries(virtualscapeNamedPieceCodes).map(([name, pieceID]) => [
      pieceID,
      name,
    ]),
  )

export const virtualscapePieceCodesByID: Dictionary<string> =
  Object.fromEntries(
    Object.entries(pieceCodes).map(([code, pieceID]) => [pieceID, code]),
  )

export const virtualscapeLaurPillarBaseName = 'custom.aoa_pillar_base'

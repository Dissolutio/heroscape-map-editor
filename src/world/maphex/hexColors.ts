import type { Dictionary } from 'lodash'
import { HexTerrain, Pieces } from '../../types'

export const virtualscapeTileColors: Dictionary<string> = {
  [HexTerrain.grass]: 'rgb(0,160,0)',
  [HexTerrain.rock]: 'rgb(170, 170, 170)',
  [HexTerrain.sand]: 'rgb(206,172,40)',
  [HexTerrain.road]: 'rgb(160, 160, 160)',
  [HexTerrain.lavaField]: 'rgb(160,32,32)',
  [HexTerrain.asphalt]: 'rgb(120, 120, 120)',
  [HexTerrain.concrete]: 'rgb(220, 220, 220)',
  [HexTerrain.swamp]: 'rgb(111,105,21)',
  [HexTerrain.dungeon]: 'rgb(220, 220, 220)',
  [HexTerrain.snow]: 'rgb(255, 255, 255)',
  [HexTerrain.water]: 'rgb(55, 148, 253)',
  [HexTerrain.ice]: 'rgb(180,180,255)',
  [HexTerrain.lava]: 'rgb(255,64,64)',
  [HexTerrain.shadow]: 'rgb(0, 0, 0)',
  [HexTerrain.swampWater]: 'rgb(222,210,42)',
  [HexTerrain.glyphPower]: 'rgb(64,0,0)',
  [HexTerrain.ruin]: 'rgb(160, 0, 0)',
  [HexTerrain.roadWall]: 'rgb(120, 120, 120)',
  [HexTerrain.marvelRuin]: 'rgb(220, 220, 220)',
  [HexTerrain.outcrop]: 'rgb(180,180,180)',
  [HexTerrain.wallWalk]: 'rgb(190,190,190)',
  [HexTerrain.castleBase]: 'rgb(220, 220, 220)',
  [HexTerrain.castleWall]: 'rgb(220, 220, 220)',
  castle2: 'rgb(50, 50, 50)', // Castle tiles in virtualscape have a second color for the castle interior shape
  [HexTerrain.battlement]: 'rgb(80, 80, 80)',
  castleFlag: 'rgb(0,100,0)',
  [HexTerrain.palm]: 'rgb(120,255,120)',
  [HexTerrain.brush]: 'rgb(255,255,0)',
  [HexTerrain.tree]: 'rgb(0,85,0)',
  [HexTerrain.ladder]: 'rgb(255,20,00)',
  [HexTerrain.glacier]: 'rgb(180,180,255)',
  [HexTerrain.hive]: 'rgb(193,121,65)',
  [HexTerrain._vsFigure]: 'rgb(255, 255, 255)',
  [HexTerrain._vsPersonal]: 'rgb(160, 160, 160)',
}

export const hexTerrainColor = {
  ...virtualscapeTileColors,
  [HexTerrain.empty]: '#020300',
  // [HexTerrain.empty]: '#FFF',
  // All these colors below have been verified on coolors: lock a color and explore! https://coolors.co/fcecc9-336aeb-fcb0b3-f93943-355a44
  // [HexTerrain.glyphPower]: 'rgb(120, 1, 22)', // virtualscape
  // [HexTerrain.glyphPower]: 'rgb(217, 8, 18)', // brighter glyph for icon
  [HexTerrain.glyphPower]: '#942a34', // superfrog
  // [HexTerrain.glyphTreasure]: 'rgb(245, 177, 53)',
  [HexTerrain.glyphTreasure]: '#847040', // superfrog
  [HexTerrain.marvelRuin]: 'rgb(153, 51, 65)', // matched with concrete on coolors Cordovan : https://coolors.co/d0d4dc-993341-ce8147-607196-334139
  // [HexTerrain.grass]: '#759B1C',
  // [HexTerrain.grass]: '#4A9A4E', // sample from Renegade map pdfs, but not the palette I generated for everything else :(
  [HexTerrain.grass]: '#7c9a3c', // superfrog
  // [HexTerrain.rock]: '#3D6A7B',
  [HexTerrain.rock]: '#7b8481', // superfrog
  // [HexTerrain.sand]: '#B4AD2D',
  [HexTerrain.sand]: '#be9e5f', // superfrog
  // [HexTerrain.dirt]: '#C46E71',
  [HexTerrain.dirt]: '#975a3a', // superfrog
  [HexTerrain.tree]: '#355A44',
  treeBase: '#A34C00',
  // [HexTerrain.water]: '#336AEB',
  [HexTerrain.water]: '#028bc4', // superfrog
  [HexTerrain.wellspringWater]: '#BA70FF',
  [HexTerrain.ruin]: '#A2A0A6',
  [HexTerrain.castleWall]: '#B6B5BA',
  [HexTerrain.castleBase]: '#B6B5BA',
  [HexTerrain.ladder]: '#D15D23',
  [HexTerrain.battlement]: '#ACABB0',
  castleDoor: '#913B3F',
  [HexTerrain.wallWalk]: '#a8a597', //same as road
  [HexTerrain.road]: '#a8a597', // superfrog
  [HexTerrain.toxic]: '#93FF32', // superfrog
  toxicCap: '#303030', // same as asphaltcap
  [HexTerrain.toxicWater]: '#93FF32', // superfrog
  // roadCap: '#787D79',
  roadCap: '#929186', // superfrog
  [HexTerrain.roadWall]: '#787D79',
  // [HexTerrain.snow]: '#EEEBFF',
  [HexTerrain.snow]: '#c0bec6', // superfrog
  // [`${HexTerrain.snow}Cap`]: '#FFF',
  [`${HexTerrain.snow}Cap`]: '#bcbdc5', // superfrog
  // [HexTerrain.ice]: '#55DBCB',
  [HexTerrain.ice]: '#ced5cc', // superfrog
  // [HexTerrain.lavaField]: '#A30029',
  [HexTerrain.lavaField]: '#881c05', // superfrog
  // lavaFieldCap: '#4F4840',
  lavaFieldCap: '#484540', // superfrog
  // [HexTerrain.lava]: '#FA003F',
  [HexTerrain.lava]: '#b00100', // superfrog
  [HexTerrain.asphalt]: '#363636', // superfrog
  // asphaltCap: '#4A3A7E',
  asphaltCap: '#303030', // superfrog
  // [HexTerrain.concrete]: '#D0D4DC',
  [HexTerrain.concrete]: '#a0a090', // superfrog
  // concreteCap: '#DCDFE5',
  concreteCap: '#a2a493', // superfrog
  // [HexTerrain.dungeon]: '#6E675E',
  [HexTerrain.dungeon]: '#7a7972', // superfrog
  // dungeonCap: '#ACB9A2',
  dungeonCap: '#b3b1aa', // superfrog
  // [HexTerrain.shadow]: '#362E38',
  [HexTerrain.shadow]: '#0f0f0d', // superfrog
  [HexTerrain.outcrop]: '#5F5464',
  hiveModel1: '#668958',
  // swampCap: '#136600',
  swampCap: '#31743c', // superfrog
  // [HexTerrain.swamp]: '#0f4f00',
  [HexTerrain.swamp]: '#776c36', // superfrog
  // [HexTerrain.laurWall]: '#7F7CAF',
  [HexTerrain.laurWall]: '#999999',
  // [HexTerrain.laurWallAddon]: '#7F7CAF',
  // laurModelColor2: '#7774AA',
  laurModelColor2: '#909090',
  // [HexTerrain.swampWater]: '#37590D', //dark moss green
  [HexTerrain.swampWater]: '#7a6c35', // superfrog

  [HexTerrain.palm]: '#0f4f00', // only gets used as subterrain color, not in model
  ticallaPalmModel1: '#B07156', // palm trunk
  ticallaPalmModel2: '#45f529', // accompanying brush
  ticallaPalmModel3: '#1A8F00', // palm leaf
  [HexTerrain.brush]: '#0f4f00', // only gets used as subterrain color, not in model
  swampUnderbrush1: '#F96269', // the swamp big leaf plant
  swampUnderbrush2: '#E0A23E', // the swamp small leaf plant
  swampUnderbrush3: '#7E7A4E', // the swamp cactus
  ticallaBrush1: '#1EA300',
  ticallaBrush2: '#25CC00',
  ticallaBrush3: '#22B800',
  laurBrush: '#0f4f00', // only gets used as subterrain color, not in model
  laurBrush1: '#1EA300',
  laurBrush2: '#25CC00',
  laurBrush3: '#22B800',
  laurPalm1: '#1EA300',
  laurPalm2: '#25CC00',
  laurPalm3: '#22B800',

  ticallaPalmTrunk: '#B07156',
  ticallaPalmCanopy: '#1A8F00',
  ticallaTriLeaf: '#1EA300',
  ticallaNeedleFern: '#1A8F00',
  ticallaPineappleFern: '#1EA300',
  laurFatLeaf: '#1EA300',
  laurTriLeaf: '#1EA300',
  laurTriCactus: '#1A8F00',
  laurRoundCactus: '#1A8F00',
  swampFatLeaf: '#FB4C00',
  swampTriLeaf: '#7E632A',
  swampTriCactus: '#7D9A32',
  swampRoundCactus: '#7D9A32',

  // Virtualscape StartZones
  [Pieces.startZone1]: 'rgb(255,0,0)',
  [Pieces.startZone2]: 'rgb(0,255,0)',
  [Pieces.startZone3]: 'rgb(0,0,255)',
  [Pieces.startZone4]: 'rgb(255,255,0)',
  [Pieces.startZone5]: 'rgb(255,0,255)',
  [Pieces.startZone6]: 'rgb(0,255,255)',
  [Pieces.startZone7]: 'rgb(255,128,0)',
  [Pieces.startZone8]: 'rgb(128,0,255)',
}
export const terrainCapColors: { [terrain: string]: string } = {
  [HexTerrain.empty]: hexTerrainColor.castle,
  // these tiles have a totally different color for their subterrain
  [HexTerrain.grass]: hexTerrainColor.grass,
  [HexTerrain.rock]: hexTerrainColor.rock,
  [HexTerrain.sand]: hexTerrainColor.sand,
  [HexTerrain.toxic]: hexTerrainColor.toxicCap,
  // these below have same color subterrain, so a little different shade on the cap for aesthetics
  [HexTerrain.lavaField]: hexTerrainColor.lavaFieldCap,
  [HexTerrain.road]: hexTerrainColor.roadCap,
  [HexTerrain.wallWalk]: hexTerrainColor.roadCap,
  [HexTerrain.dungeon]: hexTerrainColor.dungeonCap,
  [HexTerrain.snow]: hexTerrainColor.snowCap,
  [HexTerrain.asphalt]: hexTerrainColor.asphaltCap,
  [HexTerrain.concrete]: hexTerrainColor.concreteCap,
  [HexTerrain.swamp]: hexTerrainColor.swampCap,
}

export const svgColors = {
  [Pieces.startZone1]: 'rgb(17, 10, 58)',
  [Pieces.startZone2]: 'rgb(135, 67, 22)',
  [Pieces.startZone3]: 'rgb(99, 132, 37)',
  [Pieces.startZone4]: 'rgb(76, 40, 168)',
  [Pieces.startZone5]: 'rgb(8, 87, 37)',
  [Pieces.startZone6]: 'rgb(255, 125, 0)',
  [Pieces.startZone7]: 'rgb(177, 0, 143)',
  [Pieces.startZone8]: 'rgb(227, 0, 150)',
  // [Pieces.startZone9]: 'rgb(213, 0, 22)',
  empty: 'rgb(0, 0, 0)',
  jungleText: '#000000',
  glacierText: '#000000',
  evergreenText: '#FFFFFF',
  // STARTZONES
  blueSZ: 'rgb(57, 61, 157)',
  darkBlueSZ: 'rgb(21, 28, 51)',
  brownSZ: 'rgb(121, 61, 26)',
  orangeSZ: 'rgb(230, 28, 36)',
  redSZ: 'rgb(192, 26, 44)',
  greenSZ: 'rgb(54, 127, 52)',

  // RENEGADE STARTZONES
  reneBlueSZ: '#0C163A',
  reneBrownSZ: '#7E461E',

  // OUTLINES
  outline1: '#E50101', // renegade-hexoscape
  outline2: '#E67421', // renegade-hexoscape
  outline3: '#020202', // renegade-hexoscape
  outline7: '#B02E94', // renegade-hexoscape
  outline24: '#BDBDBD', // renegade-hexoscape
  outlineMarvel: '#000000',
  outlineGlyph: '#000000', // renegade-hexoscape
  outlineWater: '#132E8E', // // hive, ALL fluid tiles
  outlineTree: '#013E12',
  outlineJungle: '#7E461E', // renegade-hexoscape
  outlineSwampUnderbrush: '#633215', // renegade-hexoscape
  outlineLaurWall: '#FF06C8',
  outlineLavaOutcrop: '#7E461E', // renegade-hexoscape
  outlineOutcrop: '#7E461E', // renegade-hexoscape

  // OBSTACLES
  [HexTerrain.ladder]: 'rgb(173, 75, 35)',
  [HexTerrain.ruin]: 'rgb(160, 0, 0)', // virtualscape
  [HexTerrain.fortifiedWall]: '#FF06C8',
  [HexTerrain.roadWall]: '#FF06C8',
  fillJungle: '#FFE606',
  fillSwampUnderbrush: 'rgb(33, 56, 27)',
  // [HexTerrain.palm]: 'rgb(67, 249, 57)', // virtualscape
  [HexTerrain.tree]: '#269C48',
  [HexTerrain.laurWall]: '#6B1463',
  [HexTerrain.laurWallAddon]: '#FF06C8',
  [HexTerrain.castleWall]: 'rgb(80, 79, 84)',
  [HexTerrain.castleBase]: 'rgb(80, 79, 84)',
  castleInterior: 'rgb(208, 212, 220)', // light french gray, based off of hexTerrainColor.castle
  [HexTerrain.lavaRockOutcrop]: '#FF0000',
  outcropText: '#DAD0D0',
  lavaRockOutcropText: '#DAD0D0',
  [HexTerrain.outcrop]: '#3E3C3E',

  // TERRAIN
  [HexTerrain.grass]: '#269C48',
  [HexTerrain.rock]: '#696767',
  [HexTerrain.sand]: '#D9E176',
  [HexTerrain.road]: '#DEDEDE',
  [HexTerrain.wallWalk]: '#DEDEDE',
  outlineRoad5: '#696767',
  [HexTerrain.swamp]: '#0E3D00',
  [HexTerrain.dungeon]: '#73988D',
  [HexTerrain.lavaField]: '#84090F',
  [HexTerrain.asphalt]: '#121212',
  [HexTerrain.concrete]: '#DEDEDE',
  [HexTerrain.snow]: '#FFFFFF',
  [HexTerrain.ancientTerrain]: '#B55908',
  [HexTerrain.toxic]: '#121212',
  [HexTerrain.toxicWater]: '#0CEB00',
  roadDecor: '#696767',
  snowDecor: '#506CC7',
  iceDecor: '#FFFFFF',
  toxicLandDecor: '#0CEB00',
  toxicWaterDecor: '#000000',

  [HexTerrain.water]: '#25A8B0',
  // [HexTerrain.wellspringWater]: 'rgb(225,194,255)', // used this in virtualscape to differentiate from snow
  [HexTerrain.wellspringWater]: '#FFFFFF', // used this in virtualscape to differentiate from snow
  [HexTerrain.swampWater]: '#ACA521',
  [HexTerrain.lava]: '#FF0000',
  [HexTerrain.shadow]: '#000000',
  [HexTerrain.ice]: '#8EA3E8',
  iceFlake: '#FFFFFF',
  [HexTerrain.hive]: '#ACA521',

  // GYLPHS
  // glyph: 'rgb(244, 106, 22)', // renegade
  // [HexTerrain.glyphPower]: 'rgb(64, 0, 0)', // virtualscape
  // [HexTerrain.glyphTreasure]: 'rgb(245, 131, 0)',
  [HexTerrain.glyphPower]: 'rgb(120, 1, 22)',
  [HexTerrain.glyphTreasure]: 'rgb(245, 177, 53)',
}
export const svgSubLevelColors = {
  jungleText: '#C5BCBC',
  glacierText: '#808080',
  evergreenText: '#FFFFFF',
  // OUTLINES
  outline1: '#F4C5C5',
  outline2: '#F3DCCB',
  outline3: '#DAD0D0',
  outline7: '#F0C7E7',
  outline24: '#DEDEDE',
  outlineMarvel: '#808080',
  outlineWater: '#BBC3E1', // hive, ALL fluid tiles
  outlineGlyph: '#C5BCBC', // hive, ALL fluid tiles
  outlineTree: '#799681',
  outlineJungle: '#E8B590',
  outlineSwampUnderbrush: '#B1998A',
  outlineLaurWall: '#FFC8E9',
  outlineLavaOutcrop: '#E8B590',
  outlineOutcrop: '#E8B590',

  // OBSTACLES
  [HexTerrain.ladder]: '#D6A591',
  [HexTerrain.ruin]: '#D08080', // virtualscape
  [HexTerrain.fortifiedWall]: '#FFC8E9',
  [HexTerrain.roadWall]: '#FFC8E9',
  fillJungle: '#EBE5B5',
  fillSwampUnderbrush: '#909C8D)',
  [HexTerrain.tree]: '#9CD7AD',
  [HexTerrain.laurWall]: '#E1C8DF',
  [HexTerrain.laurWallAddon]: '#FFC8E9',
  [HexTerrain.castleBase]: '#A8A7AA',
  [HexTerrain.castleWall]: '#A8A7AA',
  // castleInterior: 'rgb(208, 212, 220)', // light french gray, based off of hexTerrainColor.castle
  [HexTerrain.lavaRockOutcrop]: '#FFA7A7',
  outcropText: '#DAD0D0',
  lavaRockOutcropText: '#DAD0D0',
  [HexTerrain.outcrop]: '#9F9E9F',

  // TERRAIN
  [HexTerrain.grass]: '#C3E9CD',
  [HexTerrain.rock]: '#CDCDCD',
  [HexTerrain.sand]: '#F4F7D0',
  [HexTerrain.water]: '#A6D5D8',
  // #CDCDCD
  [HexTerrain.road]: '#EEEEEE',
  [HexTerrain.wallWalk]: '#EEEEEE',
  outlineRoad5: '#B4B3B3',
  [HexTerrain.swamp]: '#9DAF96',
  [HexTerrain.dungeon]: '#C9D9D4',
  [HexTerrain.lavaField]: '#A47F81',
  [HexTerrain.asphalt]: '#7A7A7A',
  [HexTerrain.concrete]: '#EEEEEE',
  [HexTerrain.snow]: '#FFFFFF',
  roadDecor: '#CDCDCD',
  snowDecor: '#B0BEEC',
  iceDecor: '#FFFFFF',
  toxicLandDecor: '#B2F2AF',
  toxicWaterDecor: '#DAD0D0',

  [HexTerrain.wellspringWater]: '#FFFFFF', // used this in virtualscape to differentiate from snow
  [HexTerrain.swampWater]: '#D3D2B2',
  [HexTerrain.lava]: '#FFA7A7',
  [HexTerrain.shadow]: '#2E2D2D',
  [HexTerrain.ice]: '#B4C2EF',
  [HexTerrain.ancientTerrain]: '#E4D0BE',
  [HexTerrain.toxic]: '#7A7A7A',
  [HexTerrain.toxicWater]: '#B2F2AF',
  iceFlake: '#FFFFFF',
  [HexTerrain.hive]: '#D3D2B2',

  // GYLPHS
  // glyph: 'rgb(244, 106, 22)', // renegade
  // [HexTerrain.glyphPower]: 'rgb(120, 1, 22)',
  // [HexTerrain.glyphTreasure]: 'rgb(245, 177, 53)',
}

// const renegadeValkyriePaintColors = {
//     // selected by color picker on webp image of renegade paint set, so probably horrible
//     utgarRed: '#b13e3f',
//     aquillaYellow: '#daa040',
//     jandarBlue: '#2d72b8',
//     einarPurple: '#6c4496',
//     vydarGray: '#4f5264',
//     ullarGreen: '#7eb24b',
//     revnaOchre: '#676345',
//     valkrill: '#89845d', // this one, from "Tainted Gold" is a gradient and could be way off
// }

// const valkyrieColorsFromLogos = {
//     utgarRed: '#81272e',
//     jandarBlue: '#5279b2',
//     vydarGray: '#8598a8',
//     ullarGreen: '#306a3a',
//     aquillaYellow: '#cab800',
//     einarPurple: '#582c67',
//     revnaOchre: '#c7c3aa',
//     valkrill: '#A5A03B',
// }

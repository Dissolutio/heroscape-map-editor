import type { Dictionary } from 'lodash'
import { HexTerrain } from '../../types'

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
  [HexTerrain.glyph]: 'rgb(64,0,0)',
  [HexTerrain.ruin]: 'rgb(160, 0, 0)',
  [HexTerrain.roadWall]: 'rgb(120, 120, 120)',
  [HexTerrain.marvelRuin]: 'rgb(220, 220, 220)',
  [HexTerrain.outcrop]: 'rgb(180,180,180)',
  [HexTerrain.wallWalk]: 'rgb(190,190,190)',
  [HexTerrain.castle]: 'rgb(220, 220, 220)',
  castle2: 'rgb(50, 50, 50)', // Castle tiles in virtualscape have a second color for some reason
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

export const hexTerrainColor: Dictionary<string> = {
  ...virtualscapeTileColors,
  [HexTerrain.empty]: '#020300',
  // All these colors below have been verified on coolors: lock a color and explore! https://coolors.co/fcecc9-336aeb-fcb0b3-f93943-355a44
  [HexTerrain.glyphPower]: 'rgb(120, 1, 22)', // virtualscape
  [HexTerrain.glyphTreasure]: 'rgb(245, 177, 53)',
  [HexTerrain.grass]: '#759B1C',
  // [HexTerrain.grass]: '#4A9A4E', // sample from Renegade map pdfs, but not the palette I generated for everything else :(
  [HexTerrain.rock]: '#3D6A7B',
  [HexTerrain.sand]: '#B4AD2D',
  [HexTerrain.dirt]: '#C46E71',
  [HexTerrain.tree]: '#355A44',
  treeBase: '#A34C00',
  [HexTerrain.water]: '#336AEB',
  [HexTerrain.wellspringWater]: '#BA70FF',
  [HexTerrain.ruin]: '#A2A0A6',
  [HexTerrain.castle]: '#B6B5BA',
  [HexTerrain.ladder]: '#D15D23',
  [HexTerrain.battlement]: '#ACABB0',
  castleDoor: '#913B3F',
  [HexTerrain.wallWalk]: '#97969C', //same as road
  [HexTerrain.road]: '#97969C',
  [HexTerrain.roadWall]: '#787D79',
  [HexTerrain.snow]: '#EEEBFF',
  [`${HexTerrain.snow}Cap`]: '#FFF',
  [HexTerrain.ice]: '#55DBCB',
  [HexTerrain.lavaField]: '#A30029',
  lavaFieldCap: '#4F4840',
  [HexTerrain.lava]: '#FA003F',
  [HexTerrain.asphalt]: '#413370',
  asphaltCap: '#4A3A7E',
  [HexTerrain.concrete]: '#D0D4DC',
  concreteCap: '#DCDFE5',
  [HexTerrain.dungeon]: '#6E675E',
  dungeonCap: '#ACB9A2',
  [HexTerrain.shadow]: '#362E38',
  [HexTerrain.outcrop]: '#5F5464',
  hiveModel1: '#668958',
  swampCap: '#136600',
  [HexTerrain.swamp]: '#0f4f00',
  [HexTerrain.laurWall]: '#7F7CAF',
  laurModelColor2: '#7774AA',
  [HexTerrain.swampWater]: '#37590D', //dark moss green
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
}

export const svgColors = {
  // RENEGADE COLORS, unless noted
  empty: 'rgb(0, 0, 0)',
  // STARTZONES
  blueSZ: 'rgb(57, 61, 157)',
  darkBlueSZ: 'rgb(21, 28, 51)',
  brownSZ: 'rgb(121, 61, 26)',
  orangeSZ: 'rgb(230, 28, 36)',
  redSZ: 'rgb(192, 26, 44)',
  greenSZ: 'rgb(54, 127, 52)',
  // OUTLINES
  outline1: 'rgb(230, 28, 36)',
  outline2: 'rgb(229, 99, 26)',
  outline3: 'rgb(17, 15, 14)',
  outline7: 'rgb(175, 27, 148)',
  outline24: 'rgb(188, 188, 186)',
  outlineWater: 'rgb(43, 56, 139)', // ice, swampwater too
  outlineLava: hexTerrainColor[HexTerrain.lava],
  outlineWellspringWater: 'rgb(41, 56, 136)',
  outlineTree: 'rgb(29, 60, 30)',
  outlineJungle: 'rgb(121, 61, 26)',
  outlineLaurWall: 'rgb(215, 38, 156)',
  // OBSTACLES
  // glyph: 'rgb(244, 106, 22)', // renegade
  fillJungle: 'rgb(249, 233, 8)',
  [HexTerrain.palm]: 'rgb(67, 249, 57)',
  [HexTerrain.tree]: 'rgb(51, 160, 62)',
  [HexTerrain.laurWall]: 'rgb(98, 28, 96)',
  // TERRAIN
  [HexTerrain.grass]: 'rgb(0, 161, 0)',
  [HexTerrain.rock]: 'rgb(98, 97, 98)',
  [HexTerrain.glyphPower]: 'rgb(64, 0, 0)', // virtualscape
  // [HexTerrain.glyphTreasure]: 'rgb(245, 131, 0)',
  [HexTerrain.glyphTreasure]: 'rgb(245, 177, 53)',
  [HexTerrain.sand]: 'rgb(211, 231, 90)',
  [HexTerrain.swamp]: 'rgb(27, 46, 22)',
  [HexTerrain.dungeon]: 'rgb(124, 177, 152)',
  [HexTerrain.lavaField]: 'rgb(163, 0, 41)',
  [HexTerrain.snow]: 'rgb(255,255,255)',
  [HexTerrain.water]: 'rgb(67, 172, 176)',
  [HexTerrain.wellspringWater]: 'rgb(255,255,255)',
  // [HexTerrain.wellspringWater]: 'rgb(225,194,255)', // used this in virtualscape to differentiate from snow
  [HexTerrain.swampWater]: 'rgb(162, 166, 32)',
  [HexTerrain.ice]: 'rgb(148, 158, 215)',
  [HexTerrain.outcrop]: '#3E3C3E',
  iceFlake: 'rgb(242, 243, 250)', // there is variation in the snowflake color
  snowFlake: '#629BD0', // there is variation in the snowflake color
}
// const hsColors = {
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

import type { Dictionary } from 'lodash'
import { type CubeCoordinate, Pieces } from '../types'
import {
  CUBE_EAST,
  CUBE_NW,
  CUBE_SE,
  CUBE_SW,
  CUBE_WEST,
  ORIGIN_000,
} from '../utils/constants'

const basic1 = [ORIGIN_000]
const basic2 = [ORIGIN_000, CUBE_EAST]
const basic3 = [...basic2, CUBE_SE]
const basic7 = [
  ...basic3,
  CUBE_SW,
  {
    // right
    q: 1,
    r: 1,
    s: -2,
  },
  {
    // bottom-left
    q: -1,
    r: 2,
    s: -1,
  },
  {
    // bottom-right
    q: 0,
    r: 2,
    s: -2,
  },
]
const basic24 = [
  ...basic7,
  {
    q: 1,
    r: 2,
    s: -3,
  },
  {
    q: -2,
    r: 3,
    s: -1,
  },
  {
    q: -1,
    r: 3,
    s: -2,
  },
  {
    q: 0,
    r: 3,
    s: -3,
  },
  {
    q: 1,
    r: 3,
    s: -4,
  },
  {
    q: 2,
    r: 3,
    s: -5,
  },
  {
    q: -2,
    r: 4,
    s: -2,
  },
  {
    q: -1,
    r: 4,
    s: -3,
  },
  {
    q: 0,
    r: 4,
    s: -4,
  },
  {
    q: 1,
    r: 4,
    s: -5,
  },
  {
    q: 2,
    r: 4,
    s: -6,
  },
  {
    q: -3,
    r: 5,
    s: -2,
  },
  {
    q: -2,
    r: 5,
    s: -3,
  },
  {
    q: -1,
    r: 5,
    s: -4,
  },
  {
    q: 0,
    r: 5,
    s: -5,
  },
  {
    q: 1,
    r: 5,
    s: -6,
  },
  {
    q: 2,
    r: 5,
    s: -7,
  },
]
const straight3 = [
  // castleArch
  ...basic2,
  {
    q: 2,
    r: 0,
    s: -2,
  },
]
const straight4 = [
  // roadwall4
  ...straight3,
  {
    q: 3,
    r: 0,
    s: -3,
  },
]
const straight5 = [
  // road5(bridge)
  ...straight4,
  {
    q: 4,
    r: 0,
    s: -4,
  },
]
const glacier4 = [
  // glacier4, tree4
  ...basic3,
  {
    q: 1,
    r: 1,
    s: -2,
  },
]
const glacier6 = [
  // marro hive, glacier-6
  ...basic3,
  CUBE_SW,
  {
    // top-right corner
    q: 2,
    r: 0,
    s: -2,
  },
  {
    // bottom-right corner
    q: 1,
    r: 1,
    s: -2,
  },
]
const marvel6 = [
  ORIGIN_000,
  CUBE_SE,
  CUBE_SW,
  CUBE_WEST,
  {
    q: 1,
    r: 1,
    s: -2,
  },
  {
    q: 2,
    r: 1,
    s: -3,
  },
]
const wallWalk7 = [
  ...basic3,
  {
    q: 2,
    r: 0,
    s: -2,
  },
  {
    q: 3,
    r: 0,
    s: -3,
  },
  {
    q: 1,
    r: 1,
    s: -2,
  },
  {
    q: 2,
    r: 1,
    s: -3,
  },
]
const wallWalk9 = [
  ...wallWalk7,
  {
    q: 4,
    r: 0,
    s: -4,
  },
  {
    q: 3,
    r: 1,
    s: -4,
  },
]

const ruinsCornerExterior = [CUBE_NW, CUBE_WEST]
const ruins2 = [...glacier6, ...ruinsCornerExterior]
const ruins3 = [
  ...glacier6,
  {
    // top-right of ruins footprint
    q: 3,
    r: 0,
    s: -3,
  },
  {
    // bottom-right of ruins footprint
    q: 2,
    r: 1,
    s: -3,
  },
  ...ruinsCornerExterior,
]
const tileTemplates: Dictionary<CubeCoordinate[]> = {
  '1': basic1,
  '2': basic2,
  '3': basic3,
  '4': glacier4, // glacier base is ice4
  '5': straight5, // currently, road is only land with a 5-hex
  '6': glacier6, // glacier base is ice6
  '7': basic7,
  '24': basic24,
  // hex obstructions below
  [Pieces.laurWallSquarePillar]: basic1,
  [Pieces.laurWallRuin1]: basic1,
  [Pieces.laurWallShort]: basic1,
  [Pieces.laurWallLong]: basic1,
  [Pieces.laurWallArch]: basic1,
  [Pieces.tree10]: basic1,
  [Pieces.tree11]: basic1,
  [Pieces.tree12]: basic1,
  [Pieces.tree415]: glacier4,
  [Pieces.palm14]: basic1,
  [Pieces.palm15]: basic1,
  [Pieces.palm16]: basic1,
  [Pieces.brush9]: basic1,
  [Pieces.laurPalm13]: basic1,
  [Pieces.laurPalm14]: basic1,
  [Pieces.laurPalm15]: basic1,
  [Pieces.laurBrush10]: basic1,
  [Pieces.outcrop1]: basic1,
  [Pieces.outcrop3]: basic3,
  [Pieces.glacier1]: basic1,
  [Pieces.glacier3]: basic3,
  [Pieces.glacier4]: glacier4,
  [Pieces.glacier6]: glacier6,
  [Pieces.hive]: glacier6,
  // edge stuff below
  [Pieces.ruins2]: ruins2,
  [Pieces.ruins3]: ruins3,
  [Pieces.marvel]: marvel6,
  [Pieces.marvelBroken]: marvel6,
  // castle
  [Pieces.wallWalk1]: basic1,
  [Pieces.wallWalk7]: wallWalk7,
  [Pieces.wallWalk9]: wallWalk9,
  [Pieces.castleArch]: straight3,
  [Pieces.castleBaseCorner]: basic1,
  [Pieces.castleBaseStraight]: basic1,
  [Pieces.castleBaseEnd]: basic1,
  [Pieces.castleWallCorner]: basic1,
  [Pieces.castleWallStraight]: basic1,
  [Pieces.castleWallEnd]: basic1,
  [Pieces.ladder]: basic1,
  [Pieces.battlement]: basic1,

  [Pieces.roadWall]: straight4,
}

export default tileTemplates

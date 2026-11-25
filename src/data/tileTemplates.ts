import type { Dictionary } from 'lodash'
import { type CubeCoordinate, Pieces } from '../types'
import {
  CUBE_EAST,
  CUBE_NE,
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
// Both ships: the hex NE of the origin and the hex E of that one interlock with
// the ship. Land sits in them at the ship's own level; the hull overhangs them,
// and level 7 above them is the ship's deck (see shipDeck.ts).
export const SHIP_NOTCH_OFFSETS: CubeCoordinate[] = [
  CUBE_NE,
  {
    // E of CUBE_NE
    q: 2,
    r: -1,
    s: -1,
  },
]
const shipBow = [
  ...basic2,
  CUBE_NW,
  {
    // E of CUBE_EAST
    q: 2,
    r: 0,
    s: -2,
  },
  {
    // NE of CUBE_NW
    q: 1,
    r: -2,
    s: 1,
  },
  // small same level blocker on far end of long wing
  {
    // 3x CUBE_EAST
    q: 3,
    r: 0,
    s: -3,
  },
  // Figurehead, only obstructs levels 3-13 relative to piece level
  CUBE_WEST,
  // the two notch hexes (block space only, levels 2-6): land sits in them at
  // level 1, the hull overhangs them above that
  ...SHIP_NOTCH_OFFSETS,
]
// Ship Wall: the 3 main hexes and the knub (as straight4), then the two notch
// hexes (block space only, level 2)
const shipWall = [...straight4, ...SHIP_NOTCH_OFFSETS]
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
/**
 * Void Mat (VC): the origin hex plus 13 auxiliary hexes, the 14 full hexes
 * printed on the mat, in rows of 2, 3, 4, 3 and 2 (John, 2026-11-25). Cube
 * offsets at rotation 0; O is the origin. The printed ring of half hexes
 * around them is drawn only (src/world/models/voidMatGeometry.ts) and is not
 * part of the footprint.
 *
 *       O   .          r+0: (0,0,0) (1,0,-1)
 *     .   .   .        r+1: q -1..1
 *   .   .   .   .      r+2: q -2..1
 *     .   .   .        r+3: q -2..0
 *       .   .          r+4: q -2..-1
 *
 * Page 1 of assets-src/void-and-pylons/printable-void-terrain-mats.pdf prints
 * the same 14 hexes sideways (flat-top); turned 30 degrees it is this layout.
 */
const voidMat = [
  // row r+0: 2 hexes
  { q: 0, r: 0, s: 0 },
  { q: 1, r: 0, s: -1 },
  // row r+1: 3 hexes
  { q: -1, r: 1, s: 0 },
  { q: 0, r: 1, s: -1 },
  { q: 1, r: 1, s: -2 },
  // row r+2: 4 hexes
  { q: -2, r: 2, s: 0 },
  { q: -1, r: 2, s: -1 },
  { q: 0, r: 2, s: -2 },
  { q: 1, r: 2, s: -3 },
  // row r+3: 3 hexes
  { q: -2, r: 3, s: -1 },
  { q: -1, r: 3, s: -2 },
  { q: 0, r: 3, s: -3 },
  // row r+4: 2 hexes
  { q: -2, r: 4, s: -2 },
  { q: -1, r: 4, s: -3 },
]
const fortifiedWall = [
  ...basic3,
  CUBE_SW,
  CUBE_WEST,
  CUBE_NE,
  {
    // top-right of wall footprint
    q: 2,
    r: -1,
    s: -1,
  },
  {
    // bottom-left of wall footprint
    q: -2,
    r: 1,
    s: 1,
  },
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
  [Pieces.laurWallLongStackable]: basic1,
  [Pieces.laurWallRuin2]: basic1,
  [Pieces.laurWallRuin3]: basic1,
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
  [Pieces.shipBow]: shipBow,
  [Pieces.shipWall]: shipWall,
  // edge stuff below
  [Pieces.ruins2]: ruins2,
  [Pieces.ruins3]: ruins3,
  [Pieces.fortifiedWall]: fortifiedWall,
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
  // Void and Pylons (VC)
  [Pieces.voidMat]: voidMat,
  [Pieces.voidMarker]: basic1,
  [Pieces.twoWayPylon]: basic1,
  [Pieces.threeWayPylon]: basic1,
  [Pieces.deflectorShield]: basic1,
}

export default tileTemplates

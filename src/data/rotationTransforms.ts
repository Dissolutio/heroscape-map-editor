import { Dictionary } from 'lodash'
import { CubeCoordinate, Pieces } from '../types'
import { CUBE_EAST, CUBE_SE, CUBE_SW, ORIGIN_000 } from '../utils/constants'
import { hexUtilsAdd, hexUtilsRotateAroundOrigin_000 } from '../utils/hex-utils'
import tileTemplates from './tileTemplates'

export default function getPieceTemplateCoords({
  clickedHex,
  rotation,
  template,
  isVsTile,
}: {
  clickedHex: CubeCoordinate
  rotation: number
  template: string
  isVsTile: boolean
}): CubeCoordinate[] {
  const originOfTileTransform =
    rotationTransforms?.[template]?.[rotation] ?? ORIGIN_000
  const originOfTile = hexUtilsAdd(clickedHex, originOfTileTransform)
  return tileTemplates[template]
    .map((t) => {
      return hexUtilsRotateAroundOrigin_000(t, rotation)
    })
    .map((t) =>
      isVsTile ? hexUtilsAdd(t, originOfTile) : hexUtilsAdd(t, clickedHex),
    )
}

const t1 = [
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
]
const straight2 = [
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  CUBE_SE,
  CUBE_SW,
]
const t3 = [
  // glacier3, outcrop3
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  CUBE_SE,
  CUBE_SE,
  CUBE_SW,
]
const t7 = [
  // rose/circle style 7
  ORIGIN_000,
  CUBE_EAST,
  { q: 1, r: 1, s: -2 },
  { q: 0, r: 2, s: -2 },
  { q: -1, r: 2, s: -1 },
  CUBE_SW,
]
const t24 = [
  ORIGIN_000,
  CUBE_EAST,
  { q: 2, r: 3, s: -5 },
  { q: 2, r: 5, s: -7 },
  { q: -5, r: 7, s: -2 },
  { q: -5, r: 2, s: 3 },
]
const straight3 = [
  // straight3, arch3/door3, ruins3
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  { q: 2, r: 0, s: -2 },
  { q: 0, r: 2, s: -2 },
  { q: -2, r: 2, s: 0 },
]
const straight4 = [
  // straight4, roadWall4
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  { q: 3, r: 0, s: -3 },
  { q: 0, r: 3, s: -3 },
  { q: -3, r: 3, s: 0 },
]
const straight5 = [
  //  road5: road is the only land tile with a 5-hex piece
  ORIGIN_000,
  ORIGIN_000,
  ORIGIN_000,
  { q: 4, r: 0, s: -4 },
  { q: 0, r: 4, s: -4 },
  { q: -4, r: 4, s: 0 },
]
const glacier6 = [
  // glacier6, hive
  ORIGIN_000,
  CUBE_EAST,
  CUBE_SE,
  { q: 1, r: 1, s: -2 },
  { q: 0, r: 2, s: -2 },
  { q: -2, r: 2, s: 0 },
]
const glacier4 = [
  // glacier4
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  { q: 1, r: 1, s: -2 },
  { q: -1, r: 2, s: -1 },
  CUBE_SW,
]
const castle7 = [
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  { q: 2, r: 1, s: -3 },
  { q: 0, r: 3, s: -3 },
  { q: -3, r: 3, s: 0 },
]
const castle9 = [
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  { q: 3, r: 1, s: -4 },
  { q: 0, r: 4, s: -4 },
  { q: -4, r: 4, s: 0 },
]
const marvel6 = [
  ORIGIN_000,
  ORIGIN_000,
  CUBE_EAST,
  { q: 3, r: 1, s: -4 },
  { q: -1, r: 4, s: -3 },
  { q: -4, r: 3, s: 1 },
]
const rotationTransforms: Dictionary<CubeCoordinate[]> = {
  // land tiles (solid and fluid) will use their size to lookup their rotations
  '1': t1,
  '2': straight2,
  '3': t3,
  '4': glacier4, // glacier base is ice4
  '5': straight5, // only road5 uses this
  '6': glacier6, // glacier base is ice6
  '7': t7,
  '24': t24,
  // obstacles will use their template name to lookup their rotations
  [Pieces.laurWallPillar]: t1,
  [Pieces.tree10]: t1,
  [Pieces.tree11]: t1,
  [Pieces.tree12]: t1,
  [Pieces.tree415]: glacier4,
  [Pieces.palm14]: t1,
  [Pieces.palm15]: t1,
  [Pieces.palm16]: t1,
  [Pieces.brush9]: t1,
  [Pieces.outcrop1]: t1,
  [Pieces.outcrop3]: t3,
  [Pieces.glacier1]: t1,
  [Pieces.glacier3]: t3,
  [Pieces.glacier4]: glacier4,
  [Pieces.glacier6]: glacier6,
  [Pieces.hive]: glacier6,
  // EDGE OBSTACLES
  [Pieces.ruins2]: straight2,
  [Pieces.ruins3]: straight3,
  // HEX/EDGE
  [Pieces.marvel]: marvel6,
  [Pieces.concrete6]: marvel6,
  [Pieces.marvelBroken]: marvel6,
  // ADDONS
  [Pieces.roadWall]: straight4,
  // CASTLE
  [Pieces.castleArch]: straight3,
  [Pieces.wallWalk1]: t1,
  [Pieces.wallWalk7]: castle7,
  [Pieces.wallWalk9]: castle9,
  [Pieces.castleBaseCorner]: t1, // THESE FACE LEFT THOUGH!
  [Pieces.castleBaseStraight]: t1, // THESE FACE LEFT THOUGH!
  [Pieces.castleBaseEnd]: t1, // THESE FACE LEFT THOUGH!
  [Pieces.castleWallCorner]: t1, // THESE FACE LEFT THOUGH!
  [Pieces.castleWallStraight]: t1, // THESE FACE LEFT THOUGH!
  [Pieces.castleWallEnd]: t1, // THESE FACE LEFT THOUGH!
}

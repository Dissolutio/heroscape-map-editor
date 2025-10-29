/* 
This file is going to be 1-1 with the tileTemplates file.
Each hex in a land piece has an interlocking shape to it, one of 7 (so far) combinations.
These arrays map each tile in the template to an interlocking hex shape, and a rotation for that shape.
*/

import type { Dictionary } from 'lodash'
import { Pieces } from '../types'

const basic1 = [0]
const basic2 = [1, 4]
const basic3 = [2, 4, 0]
const basic7 = [3, 4, 0, 2, 5, 1, 0]
const basic24 = [
  3,
  4,
  0,
  2,
  5,
  3,
  0, // basic 7
  5, // far right of 3rd row
  2,
  0,
  0,
  5,
  4, // 4th row down
  3,
  0,
  0,
  0,
  5, // 5th row down
  1,
  1,
  1,
  1,
  1,
  5, // 6th row down
]
const glacier4 = [
  // ice4
  2,
  4,
  1, // basic3
  5,
]
const straight5 = [
  // road5 (bridge)
  1, 0, 0, 0, 4,
]
const glacier6 = [
  // ice6, swampWater6
  3,
  4,
  1, // basic3
  1, // SW
  4, // top-right corner
  0, // bottom-right corner
]
const marvel6 = [
  // concrete6: base of marvel ruin
  4,
  0,
  1,
  2, // glacier4
  0, // bottom-right middle
  4, // bottom-right corner
]
const wallWalk7 = [
  2,
  4,
  1, // basic3
  4,
  4, // 2 rightmost on top row
  1,
  0, // 2 rightmost on bottom row
]
const wallWalk9 = [
  2,
  4,
  1, // basic3
  4,
  4, // 2 rightmost on top row
  1,
  1, // 2 rightmost on bottom row
  4, // top right
  0, // bottom right
]
const interlockRotationTemplates: Dictionary<number[]> = {
  '1': basic1,
  '2': basic2,
  '3': basic3,
  '4': glacier4, // glacier base is ice4
  '5': straight5, // currently, road is only land with a 5-hex
  '6': glacier6, // glacier base is ice6
  '7': basic7,
  '24': basic24,
  // castle
  [Pieces.wallWalk1]: basic1,
  [Pieces.wallWalk7]: wallWalk7,
  [Pieces.wallWalk9]: wallWalk9,
  [Pieces.marvel]: marvel6,
}

export default interlockRotationTemplates

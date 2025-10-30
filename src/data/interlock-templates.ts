/* 
Each hex in a land piece has an interlocking shape to it, one of 7 (so far) combinations.
This arrays map each tile in the template to an interlocking hex shape. Another
array will map a rotation to the interlocking shape.
*/

import type { Dictionary } from 'lodash'
import { Pieces } from '../types'

const basic1 = ['6']
const basic2 = ['5', '5']
const basic3 = ['4', '4', '4']
const basic7 = ['3', '3', '0', '3', '3', '3', '3']
const basic24 = [
  '3',
  '3',
  '0',
  '3',
  '2',
  '1',
  '0', // basic 7
  '2', // far right of 3rd row
  '3',
  '0',
  '0',
  '1',
  '3', // 4th row down
  '1',
  '0',
  '0',
  '0',
  '2', // 5th row down
  '4',
  '2',
  '2',
  '2',
  '2',
  '4', // 6th row down
]
const glacier4 = [
  // ice4
  '4',
  '3',
  '3', // basic3
  '4',
]
const straight5 = [
  // road5 (bridge)
  '5',
  '4B',
  '4B',
  '4B',
  '5',
]
const glacier6 = [
  // ice6, swampWater6
  '3',
  '2',
  '2', // basic3
  '4', // SW
  '4', // top-right corner
  '3', // bottom-right corner
]
const marvel6 = [
  // concrete6: base of marvel ruin
  '3',
  '3B',
  '3',
  '4', // glacier4
  '4B', // bottom-right middle
  '5', // bottom-right corner
]
const wallWalk7 = [
  '4',
  '2',
  '3', // basic3
  '2',
  '4', // 2 rightmost on top row
  '2',
  '3', // 2 rightmost on bottom row
]
const wallWalk9 = [
  '4',
  '2',
  '3',
  '2',
  '2',
  '2',
  '2', // wallWalk7 pattern
  '4', // top right
  '3', // bottom right
]
const interlockTemplates: Dictionary<string[]> = {
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

export default interlockTemplates

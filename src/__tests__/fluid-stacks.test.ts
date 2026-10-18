/**
 * TALL FLUID STACKS (utils/fluidStacks.ts)
 *
 * The app treats every fluid tile stacked on fluid as exactly half a level,
 * but the physical tiles are a little more than half a solid tile: 8 stacked
 * fluid tiles still line up with 4 solid ones, while 10 are noticeably taller
 * than 5. So a straight run of more than 8 fluid tiles gets a warning. A solid
 * tile (or a gap) in the column ends the run.
 */
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import {
  MAX_FLUID_STACK_BEFORE_WARNING,
  getFluidRunLengthAt,
  getFluidStackWarning,
  getTallestFluidStack,
} from '../utils/fluidStacks'
import { type Board, makeTable, place } from './helpers/board'

const table = makeTable()
const c = table.center

const waterStack = (count: number, board: Board = table, from = 0) => {
  let b = board
  let altitude = from
  for (let i = 0; i < count; i++) {
    b = place({
      board: b,
      pieceID: 'w1',
      at: c,
      altitude,
      permissive: true,
    }).board
    altitude += i === 0 ? 1 : 0.5
  }
  return { board: b, top: altitude }
}

describe('fluid stack runs', () => {
  it('the threshold is 8', () => {
    expect(MAX_FLUID_STACK_BEFORE_WARNING).toBe(8)
  })

  it('counts a straight run of stacked water, measured at its top', () => {
    const { board, top } = waterStack(9)
    expect(getFluidRunLengthAt(board.boardHexes, c, top)).toBe(9)
    expect(getTallestFluidStack(board.boardHexes)).toBe(9)
  })

  it('a single water tile on the table is a run of 1; no fluid is 0', () => {
    expect(getTallestFluidStack(waterStack(1).board.boardHexes)).toBe(1)
    expect(getTallestFluidStack(table.boardHexes)).toBe(0)
  })

  it('a solid tile in the column resets the count', () => {
    // 5 water, then grass on the half-level stack, then 5 more water
    const lower = waterStack(5)
    const grass = place({
      board: lower.board,
      pieceID: 'g1',
      at: c,
      altitude: lower.top,
      permissive: true,
    }).board
    const upper = waterStack(5, grass, lower.top + 0.5)
    expect(getTallestFluidStack(upper.board.boardHexes)).toBe(5)
  })

  it('only warns past 8', () => {
    expect(getFluidStackWarning(8)).toBeNull()
    expect(getFluidStackWarning(9)).toBe(
      'Fluid stacks are modeled at half height, but real tiles are slightly taller. Stacks over 8 may exceed the map (10 tiles are taller than 5 solid levels); note this for builders.',
    )
  })

  it('a saved map with a 9-tile water stack is measured as 9 after loading', () => {
    const altitudes = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]
    const saved = altitudes.map((altitude, i) => ({
      uid: `w${i}`,
      inventoryID: 'w1',
      altitude,
      rotation: 0,
      pieceCoords: c,
    }))
    const map = buildupJsonFileMap(saved, {
      id: 'tall',
      name: 'tall stack',
      author: '',
      version: 1,
      shape: 'rectangle',
      width: 15,
      length: 15,
    })
    expect(getTallestFluidStack(map.boardHexes)).toBe(9)
    expect(
      getFluidStackWarning(getTallestFluidStack(map.boardHexes)),
    ).not.toBeNull()
  })
})

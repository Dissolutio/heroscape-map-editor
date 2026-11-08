import { describe, expect, it } from 'vitest'
import {
  getLadderOverlayLevels,
  getLadderStacks,
} from '../pdf-svg-shared/ladderStack'
import { type BoardPiece, Pieces } from '../types'
import { HEX_DIRECTIONS } from '../utils/hex-utils'

const at = { q: 0, r: 0, s: 0 }

const ladder = (
  uid: string,
  altitude: number,
  rotation = 0,
  coords = at,
): BoardPiece => ({
  uid,
  inventoryID: Pieces.ladder,
  altitude,
  rotation,
  pieceCoords: coords,
})

const summary = (boardPieces: BoardPiece[]) =>
  getLadderStacks(boardPieces).map((stack) => ({
    run: stack.runIndex,
    count: stack.count,
    bottom: stack.bottom.uid,
    uids: stack.pieces.map((piece) => piece.uid),
  }))

describe('ladder stack model', () => {
  it('has no stacks and no overlay levels without ladders', () => {
    const grass: BoardPiece = { ...ladder('grass', 0), inventoryID: 'g1' }
    expect(getLadderStacks([])).toEqual([])
    expect(getLadderStacks([grass])).toEqual([])
    expect(getLadderOverlayLevels([grass])).toEqual([])
  })

  it('makes one stack of one from a single ladder', () => {
    expect(summary([ladder('single', 1)])).toEqual([
      { run: 0, count: 1, bottom: 'single', uids: ['single'] },
    ])
  })

  it('counts every ladder of a run of consecutive ladder altitudes', () => {
    // listed out of order: the run is built from sorted altitudes
    const stacks = summary([
      ladder('top', 5),
      ladder('bottom', 1),
      ladder('middle', 3),
    ])
    expect(stacks).toEqual([
      {
        run: 0,
        count: 3,
        bottom: 'bottom',
        uids: ['bottom', 'middle', 'top'],
      },
    ])
  })

  it('splits two runs on one edge when land sits between them', () => {
    const stacks = summary([
      ladder('a0', 1),
      ladder('a1', 3),
      ladder('b0', 9),
      ladder('b1', 11),
      ladder('b2', 13),
    ])
    expect(stacks).toEqual([
      { run: 0, count: 2, bottom: 'a0', uids: ['a0', 'a1'] },
      { run: 1, count: 3, bottom: 'b0', uids: ['b0', 'b1', 'b2'] },
    ])
    // an odd gap between ladders is not a consecutive ladder altitude either
    expect(
      summary([ladder('x', 1), ladder('y', 4)]).map((s) => s.count),
    ).toEqual([1, 1])
  })

  it('keeps runs on different edges separate', () => {
    const sameHexOtherRotation = ladder('rot1', 1, 1)
    const otherHex = ladder('hex2', 3, 0, { q: 2, r: 0, s: -2 })
    const stacks = getLadderStacks([
      ladder('rot0-a', 1),
      ladder('rot0-b', 3),
      sameHexOtherRotation,
      otherHex,
    ])
    expect(stacks.map((s) => [s.bottom.uid, s.count, s.runIndex])).toEqual([
      ['rot0-a', 2, 0],
      ['rot1', 1, 0],
      ['hex2', 1, 0],
    ])
    expect(new Set(stacks.map((s) => s.edgeId)).size).toBe(3)
  })

  it('treats the same edge seen from either hex as one edge', () => {
    const direction = HEX_DIRECTIONS[0]
    const neighbor = {
      q: direction.q,
      r: direction.r,
      s: direction.s,
    }
    const stacks = getLadderStacks([
      ladder('here', 1, 0),
      ladder('there', 3, 3, neighbor),
    ])
    expect(stacks).toHaveLength(1)
    expect(stacks[0].count).toBe(2)
    // the stack is placed at the bottom ladder: its hex and its rotation
    expect(stacks[0].bottom.pieceCoords).toEqual(at)
    expect(stacks[0].bottom.rotation).toBe(0)
  })

  it('places a stack by the bottom ladder rotation', () => {
    const stacks = getLadderStacks([ladder('r4-a', 1, 4), ladder('r4-b', 3, 4)])
    expect(stacks).toHaveLength(1)
    expect(stacks[0].bottom.uid).toBe('r4-a')
    expect(stacks[0].bottom.rotation).toBe(4)
  })

  it('makes as many overlay levels as the most runs on any one edge', () => {
    // one run on edge A and edge B: a single level holding both
    const oneLevel = getLadderOverlayLevels([
      ladder('a', 1, 0),
      ladder('b', 1, 1),
    ])
    expect(oneLevel).toHaveLength(1)
    expect(oneLevel[0].map((s) => s.bottom.uid)).toEqual(['a', 'b'])

    // edge A has three runs, edge B one, edge C two
    const levels = getLadderOverlayLevels([
      ladder('a1', 1, 0),
      ladder('a2', 5, 0),
      ladder('a3', 9, 0),
      ladder('b1', 3, 1),
      ladder('c1', 1, 2),
      ladder('c1-top', 3, 2),
      ladder('c2', 7, 2),
    ])
    expect(levels).toHaveLength(3)
    expect(levels.map((level) => level.map((s) => s.bottom.uid))).toEqual([
      ['a1', 'b1', 'c1'],
      ['a2', 'c2'],
      ['a3'],
    ])
    // every edge shows its k-th run counted from the bottom, with its count
    expect(levels[0].map((s) => s.count)).toEqual([1, 1, 2])
    expect(levels[1].map((s) => s.count)).toEqual([1, 1])
  })
})

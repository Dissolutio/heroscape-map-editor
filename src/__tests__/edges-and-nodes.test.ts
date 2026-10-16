/**
 * EDGES AND NODES: where the grid model is today, and what the next one must do
 *
 * Terminology used here (my reading of the project goal; correct me if it is
 * wrong): an EDGE is the side shared by two neighboring hexes, a NODE is the
 * corner shared by three. Pieces that sit ON an edge (ladders, battlements,
 * road walls, ruins, fortified walls) or on a corner (the half-step rotations
 * x.5 used by Laur wall addons) do not fit a model whose only unit is the hex.
 *
 * TODAY there is no first-class edge or node. Such a piece is stored as
 * "an anchor hex + a rotation" and the occupancy matrix (boardHexes) is only
 * ever asked about hexes. The first two groups below are EXECUTABLE FACTS about
 * that representation, chiefly that the same physical edge or corner has
 * several different names. The last group is the acceptance checklist for
 * the new model, as `it.todo`, to be turned into real tests as it is built.
 */
import { describe, expect, it } from 'vitest'
import type { CubeCoordinate } from '../types'
import {
  HEX_DIRECTIONS,
  hexUtilsAdd,
  hexUtilsGetRadialFarNeighborForRotation,
  hexUtilsGetRadialNearNeighborsForRotation,
} from '../utils/hex-utils'

const key = (c: CubeCoordinate) => `${c.q},${c.r}`
const negate = (c: CubeCoordinate): CubeCoordinate => ({
  q: -c.q,
  r: -c.r,
  s: -c.s,
})
const ORIGIN: CubeCoordinate = { q: 0, r: 0, s: 0 }
const HALF_STEPS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]

describe('today: an edge is (hex, direction 0..5) and every edge has two names', () => {
  it('the opposite direction is always (k + 3) % 6, and the two steps cancel', () => {
    for (let k = 0; k < 6; k++) {
      const there = HEX_DIRECTIONS[k]
      const back = HEX_DIRECTIONS[(k + 3) % 6]
      expect(key(hexUtilsAdd(there, back))).toBe(key(ORIGIN))
      expect(key(back)).toBe(key(negate(there)))
    }
  })

  it('so an edge can be named from either side: (H, k) and (H + dir(k), k + 3) join the same two hexes', () => {
    // A battlement or road wall on the East side of hex H is also on the West
    // side of the hex East of H. Both descriptions join the same pair of hexes,
    // but they are different (coords, rotation) values, so they produce
    // different piece ids and nothing in the engine knows they are one edge.
    for (let k = 0; k < 6; k++) {
      const h: CubeCoordinate = { q: 3, r: -1, s: -2 }
      const neighbor = hexUtilsAdd(h, HEX_DIRECTIONS[k])
      const fromNeighborBackToH = hexUtilsAdd(
        neighbor,
        HEX_DIRECTIONS[(k + 3) % 6],
      )
      expect(key(fromNeighborBackToH)).toBe(key(h))
    }
  })
})

describe('today: a node is (hex, half-step rotation x.5) and every node has three names', () => {
  it('a half-step rotation points at the corner between two adjacent directions', () => {
    for (const rotation of HALF_STEPS) {
      const [a, b] = hexUtilsGetRadialNearNeighborsForRotation(rotation)
      // the two near neighbors are themselves neighbors of each other...
      const apart = hexUtilsAdd(b, negate(a))
      expect(
        Math.max(Math.abs(apart.q), Math.abs(apart.r), Math.abs(apart.s)),
      ).toBe(1)
      // ...and the "far" hex in that direction is the sum of the two steps
      expect(key(hexUtilsGetRadialFarNeighborForRotation(rotation))).toBe(
        key(hexUtilsAdd(a, b)),
      )
    }
  })

  it('the corner (H, x.5) is also (A, x.5 + 2) and (B, x.5 + 4), where A and B are its two near neighbors', () => {
    // Three hexes meet at every corner, and each one can anchor a piece there
    // with a different (coords, rotation). Verified by computing, for each of
    // the three names, the set of hexes that meet at the corner it denotes.
    const cornerHexes = (anchor: CubeCoordinate, rotation: number) => {
      const [a, b] = hexUtilsGetRadialNearNeighborsForRotation(rotation)
      return [anchor, hexUtilsAdd(anchor, a), hexUtilsAdd(anchor, b)]
        .map(key)
        .sort()
        .join('|')
    }
    const h: CubeCoordinate = { q: 2, r: 5, s: -7 }
    for (const rotation of HALF_STEPS) {
      const [a, b] = hexUtilsGetRadialNearNeighborsForRotation(rotation)
      const names: [CubeCoordinate, number][] = [
        [h, rotation],
        [hexUtilsAdd(h, a), (rotation + 2) % 6],
        [hexUtilsAdd(h, b), (rotation + 4) % 6],
      ]
      const meeting = names.map(([anchor, rot]) => cornerHexes(anchor, rot))
      expect(new Set(meeting).size).toBe(1)
    }
  })
})

describe('target model: acceptance checklist (to become real tests as the feature is built)', () => {
  // Identity
  it.todo(
    'an edge has ONE canonical key, whichever neighboring hex it is described from',
  )
  it.todo(
    'a node has ONE canonical key, whichever of its three hexes it is described from',
  )
  it.todo(
    'canonical keys are stable for negative and zero coordinates (no "-0" keys)',
  )
  it.todo(
    'the edges of a hex are its 6 sides and the nodes of a hex are its 6 corners; each edge touches 2 nodes and each node touches 3 edges',
  )
  // Occupancy and conflicts
  it.todo(
    'two pieces on the same edge conflict, even when placed from opposite hexes',
  )
  it.todo(
    'two pieces on the same node conflict, even when named from different hexes',
  )
  it.todo(
    'a piece on an edge does not conflict with a different edge of the same hex',
  )
  it.todo(
    'edge and node pieces never claim whole hexes in the occupancy matrix',
  )
  // Fit
  it.todo(
    'edge/node pieces can be validated against their supporting hexes (e.g. a ladder or battlement needs a wall on the edge it is placed on)',
  )
  // Compatibility
  it.todo(
    'every existing saved map and share link (altitude~q~r~rotation~id) still loads, with edge/node pieces migrated to canonical form',
  )
  it.todo(
    'pieces keep their current ids; only their anchor is reinterpreted, so URL length does not grow',
  )
  it.todo(
    'undo/redo, the conflict list, and the PDF/SVG exports treat migrated edge and node pieces exactly as before',
  )
})

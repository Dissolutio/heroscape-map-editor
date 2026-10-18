/**
 * HEX GRID FOUNDATIONS
 *
 * The coordinate system everything else stands on: signed cube coordinates
 * (q + r + s = 0), six neighbor directions numbered 0..5 clockwise starting at
 * East, and "odd-r" offset coordinates only at the Virtualscape boundary.
 * These tests pin the facts other code relies on, so that the planned
 * edge/node work can be built on them without rediscovering the conventions.
 */
import { describe, expect, it } from 'vitest'
import tileTemplates from '../data/tileTemplates'
import type { CubeCoordinate } from '../types'
import { HEXGRID_HEX_RADIUS } from '../utils/constants'
import {
  HEX_DIRECTIONS,
  cubeToPixel,
  hexUtilsAdd,
  hexUtilsCubeToOddR,
  hexUtilsGenHexagonGrid,
  hexUtilsGenRectangleGrid,
  hexUtilsOddRToCube,
  hexUtilsRotateAroundOrigin_000,
} from '../utils/hex-utils'
import { makeHexagonScenario, makeRectangleScenario } from '../utils/map-gen'
import { genBoardHexID } from '../utils/map-utils'

const directions = [0, 1, 2, 3, 4, 5].map((k) => HEX_DIRECTIONS[k])
const key = (c: CubeCoordinate) => `${c.q},${c.r}`

describe('cube coordinates and directions', () => {
  it('the six directions are distinct unit steps that satisfy q+r+s=0', () => {
    expect(new Set(directions.map(key)).size).toBe(6)
    for (const d of directions) {
      expect(d.q + d.r + d.s).toBe(0)
      expect(Math.max(Math.abs(d.q), Math.abs(d.r), Math.abs(d.s))).toBe(1)
    }
  })

  it('rotating East by k steps gives direction k (directions are numbered clockwise from East)', () => {
    for (let k = 0; k < 6; k++) {
      const rotated = hexUtilsRotateAroundOrigin_000(HEX_DIRECTIONS[0], k)
      expect(key(rotated)).toBe(key(HEX_DIRECTIONS[k]))
    }
  })

  it('rotation wraps: six steps is the same as none', () => {
    for (const d of directions) {
      expect(key(hexUtilsRotateAroundOrigin_000(d, 6))).toBe(key(d))
    }
  })

  it('rotation is a bijection on a tile template (no hex lost or doubled)', () => {
    for (const templateName of ['7', '24']) {
      const template = tileTemplates[templateName]
      for (let rotation = 0; rotation < 6; rotation++) {
        const rotated = template.map((h) =>
          hexUtilsRotateAroundOrigin_000(h, rotation),
        )
        expect(new Set(rotated.map(key)).size).toBe(template.length)
      }
    }
  })

  it('every neighbor is exactly one hex-spacing away on screen', () => {
    // the world is regular: nothing is stretched, so the math in
    // getBoardHex3DCoords and the SVG/PDF layout can share one formula
    const spacing = Math.sqrt(3) * HEXGRID_HEX_RADIUS
    const origin = cubeToPixel({ q: 0, r: 0, s: 0 })
    for (const d of directions) {
      const p = cubeToPixel(d)
      expect(Math.hypot(p.x - origin.x, p.y - origin.y)).toBeCloseTo(spacing, 9)
    }
  })

  it('a hex id is "altitude~q~r" and does not care about negative zero', () => {
    expect(genBoardHexID({ q: 3, r: -2, s: -1, altitude: 4 })).toBe('4~3~-2')
    // hexUtilsOddRToCube(0, 0) really does produce s = -0 (see its own comment)
    expect(genBoardHexID({ q: -0, r: 0, s: -0, altitude: 0 })).toBe('0~0~0')
  })
})

describe('generated grids', () => {
  const isValidCube = (c: CubeCoordinate) => c.q + c.r + c.s === 0

  it.each([0, 1, 2, 5, 11])(
    'a hexagon of radius %i has 3n(n+1)+1 distinct, valid hexes',
    (radius) => {
      const grid = hexUtilsGenHexagonGrid(radius)
      expect(grid).toHaveLength(3 * radius * (radius + 1) + 1)
      expect(new Set(grid.map(key)).size).toBe(grid.length)
      expect(grid.every(isValidCube)).toBe(true)
    },
  )

  it('rectangle grid: the FIRST argument is the number of rows (r), the second the hexes per row', () => {
    // The parameters are named (mapWidth, mapHeight) in hex-utils.ts, which
    // reads backwards: "width" counts rows and "height" counts hexes within a
    // row. map-gen passes (length, width) in that order, so it works, but it
    // is an easy place for a future change to flip an axis. This pins it.
    const grid = hexUtilsGenRectangleGrid(4, 9)
    expect(new Set(grid.map((h) => h.r)).size).toBe(4)
    expect(grid.filter((h) => h.r === 0)).toHaveLength(9)
    expect(grid).toHaveLength(36)
    expect(grid.every(isValidCube)).toBe(true)
    expect(new Set(grid.map(key)).size).toBe(36)
  })

  it('a rectangle scenario has length x width hexes', () => {
    const { boardHexes } = makeRectangleScenario({ length: 6, width: 11 })
    expect(Object.keys(boardHexes)).toHaveLength(66)
  })

  it('a hexagon scenario of "size" N is a hexagon of radius N-1', () => {
    // size 1 is a single hex, size 2 is 7 hexes, the default size 12 is 397
    for (const size of [1, 2, 3, 12]) {
      const { boardHexes } = makeHexagonScenario({ size })
      const radius = size - 1
      expect(Object.keys(boardHexes)).toHaveLength(
        3 * radius * (radius + 1) + 1,
      )
    }
  })

  it('every hex of a fresh scenario is empty table at altitude 0', () => {
    const { boardHexes, boardPieces } = makeRectangleScenario({
      length: 5,
      width: 5,
    })
    expect(boardPieces).toEqual([])
    for (const hex of Object.values(boardHexes)) {
      expect(hex.terrain).toBe('empty')
      expect(hex.altitude).toBe(0)
    }
  })
})

describe('odd-r offset conversion (Virtualscape boundary)', () => {
  it('round-trips offset -> cube -> offset for rows 0 and up', () => {
    for (let y = 0; y <= 9; y++) {
      for (let x = -3; x <= 9; x++) {
        const cube = hexUtilsOddRToCube(x, y)
        expect(cube.q + cube.r + cube.s).toBe(0)
        expect(hexUtilsCubeToOddR(cube)).toEqual({ x, y })
      }
    }
  })

  it(
    'KNOWN GAP (latent): offset <-> cube round-trips on negative odd rows',
    () => {
      for (const y of [-1, -3]) {
        const cube = hexUtilsOddRToCube(0, y)
        expect(hexUtilsCubeToOddR(cube)).toEqual({ x: 0, y })
      }
    },
  )

  it('round-trips cube -> odd-r -> cube for negative odd rows', () => {
    for (let r = -9; r < 0; r++) {
      for (let q = -4; q <= 4; q++) {
        const cube = { q, r, s: -q - r }
        const offset = hexUtilsCubeToOddR(cube)
        expect(hexUtilsOddRToCube(offset.x, offset.y)).toEqual(cube)
      }
    }
  })

  it('keeps the previous odd-r conversion results for non-negative rows', () => {
    for (let y = 0; y <= 9; y++) {
      for (let x = -3; x <= 9; x++) {
        const previousQ = x - (y - (y % 2)) / 2
        expect(hexUtilsOddRToCube(x, y)).toEqual({
          q: previousQ,
          r: y,
          s: -previousQ - y,
        })

        const q = x
        const r = y
        expect(hexUtilsCubeToOddR({ q, r, s: -q - r })).toEqual({
          x: q + (r - (r & 1)) / 2,
          y: r,
        })
      }
    }
  })
})

describe('moving by direction', () => {
  it('walking six steps in one direction lands six hexes away on that axis', () => {
    let at: CubeCoordinate = { q: 0, r: 0, s: 0 }
    for (let i = 0; i < 6; i++) at = hexUtilsAdd(at, HEX_DIRECTIONS[1])
    expect(at).toEqual({ q: 0, r: 6, s: -6 })
  })
})

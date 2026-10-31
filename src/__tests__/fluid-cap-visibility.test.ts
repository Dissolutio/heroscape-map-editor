/**
 * FLUID CAPS UNDER A SOLID (utils/fluidStacks.ts isFluidCapVisible)
 *
 * A fluid tile is half a level tall. A solid on a whole-level fluid rises a
 * whole level, so half a level of clearance stays above the fluid and its cap
 * shows, e.g. a 2-hex grass on a grass stack that overhangs a water tile.
 * isCap still means "a unit can stand here" and stays false under the solid;
 * only drawing changes. Fluid on fluid, and a solid sitting flush on a
 * half-level fluid, still hide the cap.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildupJsonFileMap } from '../data/buildupMap'
import type { GraphicsTier } from '../local-storage/settings'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { isFluidTerrainHex } from '../utils/board-utils'
import { isFluidCapVisible } from '../utils/fluidStacks'
import { HEX_DIRECTIONS, hexUtilsAdd } from '../utils/hex-utils'
import { getInstanceBoardHexes } from '../world/instanceBoardHexes'
import {
  buildLandHexInstanceData,
  getLandHexFluidCapJoinMask,
  getLandHexInstanceIDs,
} from '../world/models/landHexInstances'
import { type Board, hexAt, makeTable, place } from './helpers/board'

const genericColors = {
  genericSolidCapColor: '#e63cc8',
  genericSolidSideColor: '#a01e8c',
  genericFluidCapColor: '#ff96e6',
  genericFluidSideColor: '#c864b4',
}
const TIERS: GraphicsTier[] = ['low', 'medium', 'high']

const table = makeTable()
const c = table.center
// East of c; a g2 at e with rotation 3 puts its second hex on c.
const e = hexUtilsAdd(c, HEX_DIRECTIONS[0])

const put = (
  board: Board,
  pieceID: string,
  at: CubeCoordinate,
  altitude: number,
  rotation = 0,
) => place({ board, pieceID, at, altitude, rotation, permissive: true }).board

/** water at c, grass at e, and a 2-hex grass on e overhanging c */
const overhang = () => {
  let b = put(table, 'w1', c, 0)
  b = put(b, 'g1', e, 0)
  return put(b, 'g2', e, 1, 3)
}

/** capVisible of the instance for hexID, per tier */
const capVisibleByTier = (board: Board, hexID: string) =>
  TIERS.map((tier) => {
    const datum = buildLandHexInstanceData(
      board.boardHexes,
      board.boardPieces,
      Number.POSITIVE_INFINITY,
      genericColors,
      undefined,
      tier,
    ).find((item) => item.hex.id === hexID)
    if (!datum) throw new Error(`no instance for ${hexID} on ${tier}`)
    return datum.capVisible
  })

/** whether the legacy Low renderer puts the hex in its fluid cap bucket */
const isInLegacyFluidCaps = (board: Board, hexID: string) =>
  getInstanceBoardHexes(
    board.boardHexes,
    Object.values(board.boardHexes),
    false,
    Number.POSITIVE_INFINITY,
    new Set(),
  ).fluidHexCaps.some((hex) => hex.id === hexID)

const expectFluidCap = (board: Board, hexID: string, visible: boolean) => {
  const hex = board.boardHexes[hexID]
  expect(isFluidTerrainHex(hex.terrain)).toBe(true)
  expect(isFluidCapVisible(hex, board.boardHexes)).toBe(visible)
  expect(capVisibleByTier(board, hexID)).toEqual([visible, visible, visible])
  expect(isInLegacyFluidCaps(board, hexID)).toBe(visible)
}

describe('fluid cap visibility', () => {
  it('a water tile alone shows its cap', () => {
    const b = put(table, 'w1', c, 0)
    const water = hexAt(b, c, 1)
    expect(water?.isCap).toBe(true)
    expectFluidCap(b, water?.id ?? '', true)
  })

  it('a solid overhanging a whole-level water tile leaves its cap visible', () => {
    const b = overhang()
    const water = hexAt(b, c, 1)
    const above = hexAt(b, c, 2)
    expect(above?.terrain).toBe('grass')
    // isCap keeps meaning "a unit can stand here"
    expect(water?.isCap).toBe(false)
    expectFluidCap(b, water?.id ?? '', true)
    // the grass above still has its cap, and solids always show theirs
    expect(above?.isCap).toBe(true)
    expect(capVisibleByTier(b, above?.id ?? '')).toEqual([true, true, true])
  })

  it('a solid sitting flush on a half-level water tile hides its cap', () => {
    let b = put(table, 'w1', c, 0)
    b = put(b, 'w1', c, 1)
    b = put(b, 'g1', c, 1.5)
    expect(hexAt(b, c, 2)?.terrain).toBe('grass')
    expectFluidCap(b, hexAt(b, c, 1.5)?.id ?? '', false)
    expectFluidCap(b, hexAt(b, c, 1)?.id ?? '', false)
  })

  it('fluid on fluid hides the lower cap and shows the upper one', () => {
    let b = put(table, 'w1', c, 0)
    b = put(b, 'w1', c, 1)
    expectFluidCap(b, hexAt(b, c, 1)?.id ?? '', false)
    expectFluidCap(b, hexAt(b, c, 1.5)?.id ?? '', true)
  })

  it('a solid a whole level over a half-level water tile shows its cap', () => {
    // water stack at c (1, 1.5), grass column at e (1, 2), then a 2-hex grass
    // on top of the column overhanging c with a whole level of clearance
    let b = put(table, 'w1', c, 0)
    b = put(b, 'w1', c, 1)
    b = put(b, 'g1', e, 0)
    b = put(b, 'g1', e, 1)
    b = put(b, 'g2', e, 2, 3)
    expect(hexAt(b, c, 3)?.terrain).toBe('grass')
    expectFluidCap(b, hexAt(b, c, 1.5)?.id ?? '', true)
  })

  it('a multi-hex water tile with one hex overhung shows every cap', () => {
    let b = put(table, 'w3', c, 0)
    const waterHexes = Object.values(b.boardHexes).filter(
      (hex) => hex.altitude === 1 && isFluidTerrainHex(hex.terrain),
    )
    expect(waterHexes).toHaveLength(3)
    // a water hex with an empty table hex beside it: grass goes there, and
    // a g2 from the grass reaches back over the water hex (rotation d)
    const [target, d] = waterHexes
      .flatMap((hex) => [0, 1, 2, 3, 4, 5].map((dir) => [hex, dir] as const))
      .find(([hex, dir]) => {
        const from = hexUtilsAdd(hex, HEX_DIRECTIONS[(dir + 3) % 6])
        return hexAt(b, from, 0) && !hexAt(b, from, 1)
      }) ?? [undefined, 0]
    if (!target) throw new Error('no water hex with a free neighbour')
    const beside = hexUtilsAdd(target, HEX_DIRECTIONS[(d + 3) % 6])
    const joinMasksBefore = waterHexes.map((hex) =>
      getLandHexFluidCapJoinMask(hex, b.boardHexes),
    )
    b = put(b, 'g1', beside, 0)
    b = put(b, 'g2', beside, 1, d)
    expect(hexAt(b, target, 2)?.terrain).toBe('grass')

    for (const hex of waterHexes) {
      const current = b.boardHexes[hex.id]
      expect(current.isCap).toBe(hex.id !== target.id)
      expectFluidCap(b, hex.id, true)
    }
    // the water tile still reads as one joined surface
    expect(
      waterHexes.map((hex) => getLandHexFluidCapJoinMask(hex, b.boardHexes)),
    ).toEqual(joinMasksBefore)
  })
})

describe('regression: Cove of Bilfrost (fluid cap under an overhang)', () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL('./fixtures/fluid-cap-under-overhang.json', import.meta.url),
      'utf8',
    ),
  ) as { hexMap: HexMap; boardPieces: BoardPiece[] }
  const loaded = buildupJsonFileMap(fixture.boardPieces, fixture.hexMap)
  const board = {
    boardHexes: loaded.boardHexes,
    boardPieces: loaded.boardPieces,
  }
  const waterCoords = { q: 0, r: 0, s: 0 }

  it('loads all three pieces', () => {
    expect(loaded.droppedPieces).toEqual([])
    expect(board.boardPieces).toHaveLength(3)
  })

  it('the water cap is drawn on every tier while isCap stays false', () => {
    const water = hexAt(board, waterCoords, 1)
    expect(water?.terrain).toBe('water')
    expect(water?.isCap).toBe(false)
    expectFluidCap(board, water?.id ?? '', true)
    expect(
      getLandHexInstanceIDs(board.boardHexes, board.boardPieces, 99),
    ).toContain(water?.id)
  })

  it('the grass above the water keeps its cap', () => {
    const above = hexAt(board, waterCoords, 2)
    expect(above?.terrain).toBe('grass')
    expect(above?.boardPieceUID).toBe('sV2gZPngQ4')
    expect(above?.isCap).toBe(true)
    expect(capVisibleByTier(board, above?.id ?? '')).toEqual([true, true, true])
  })
})

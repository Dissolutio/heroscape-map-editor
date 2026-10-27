import { describe, expect, it } from 'vitest'
import { cloneBoard, makeTable, place } from './helpers/board'
import { Pieces, type BoardHex } from '../types'
import {
  buildLandHexInstanceData,
  getLandHexColors,
  getLandHexDisplayColors,
  getLandHexSideVisibilityMask,
} from '../world/models/landHexInstances'

const genericColors = {
  genericSolidCapColor: '#e63cc8',
  genericSolidSideColor: '#a01e8c',
  genericFluidCapColor: '#ff96e6',
  genericFluidSideColor: '#c864b4',
}

describe('land hex instance data', () => {
  it('creates one instance per supported land hex with surface levels', () => {
    const table = makeTable(9)
    const first = place({
      board: table,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
    })
    const second = place({
      board: first.board,
      pieceID: Pieces.genericFluid1,
      at: {
        q: table.center.q + 3,
        r: table.center.r,
        s: table.center.s - 3,
      },
      altitude: 0,
    })
    const data = buildLandHexInstanceData(
      second.board.boardHexes,
      second.board.boardPieces,
      1,
      genericColors,
    )

    expect(data).toHaveLength(2)
    expect(data.map(({ isFluid }) => isFluid)).toEqual([false, true])
    expect(data.map(({ levels }) => levels)).toEqual([1, 1])
    expect(data.map(({ capLayer, sideLayer }) => [capLayer, sideLayer])).toEqual(
      [
        [-1, -1],
        [-1, -1],
      ],
    )
    expect(
      buildLandHexInstanceData(
        second.board.boardHexes,
        second.board.boardPieces,
        0,
        genericColors,
      ),
    ).toHaveLength(0)
  })

  it('omits unsupported and explicitly excluded piece families', () => {
    const table = makeTable(9)
    const placed = place({
      board: table,
      pieceID: Pieces.glacier1,
      at: table.center,
      altitude: 0,
      permissive: true,
    })
    const data = buildLandHexInstanceData(
      placed.board.boardHexes,
      placed.board.boardPieces,
      5,
      genericColors,
    )

    expect(data).toEqual([])
  })
})

describe('land hex side visibility', () => {
  it('maps all six cube directions to the matching side-mask bit', () => {
    const directions = [
      { q: 1, r: 0, s: -1 },
      { q: 0, r: 1, s: -1 },
      { q: -1, r: 1, s: 0 },
      { q: -1, r: 0, s: 1 },
      { q: 0, r: -1, s: 1 },
      { q: 1, r: -1, s: 0 },
    ]

    directions.forEach((offset, direction) => {
      const table = makeTable(9)
      const center = place({
        board: table,
        pieceID: Pieces.grass1,
        at: table.center,
        altitude: 0,
      })
      const neighbor = place({
        board: center.board,
        pieceID: Pieces.grass1,
        at: {
          q: table.center.q + offset.q,
          r: table.center.r + offset.r,
          s: table.center.s + offset.s,
        },
        altitude: 0,
      })
      const hex = Object.values(neighbor.board.boardHexes).find(
        (candidate) =>
          candidate.q === table.center.q &&
          candidate.r === table.center.r &&
          candidate.altitude === 1,
      ) as BoardHex

      expect(
        getLandHexSideVisibilityMask(hex, neighbor.board.boardHexes),
      ).toBe(0b111111 ^ (1 << direction))
    })
  })

  it('hides fluid-to-fluid and fluid-to-solid sides at the same level', () => {
    const table = makeTable(9)
    const fluid = place({
      board: table,
      pieceID: Pieces.water1,
      at: table.center,
      altitude: 0,
    })
    const neighborCoords = {
      q: table.center.q + 1,
      r: table.center.r,
      s: table.center.s - 1,
    }
    const fluidNeighbor = place({
      board: fluid.board,
      pieceID: Pieces.water1,
      at: neighborCoords,
      altitude: 0,
    })
    const fluidHex = Object.values(fluidNeighbor.board.boardHexes).find(
      (hex) =>
        hex.q === table.center.q &&
        hex.r === table.center.r &&
        hex.altitude === 1,
    ) as BoardHex
    const solidNeighbor = place({
      board: fluid.board,
      pieceID: Pieces.grass1,
      at: neighborCoords,
      altitude: 0,
    })
    const fluidNextToSolid = Object.values(solidNeighbor.board.boardHexes).find(
      (hex) =>
        hex.q === table.center.q &&
        hex.r === table.center.r &&
        hex.altitude === 1,
    ) as BoardHex

    expect(getLandHexSideVisibilityMask(fluidHex, fluidNeighbor.board.boardHexes))
      .toBe(0b111110)
    expect(
      getLandHexSideVisibilityMask(
        fluidNextToSolid,
        solidNeighbor.board.boardHexes,
      ),
    ).toBe(0b111110)
  })

  it('does not cull across levels and leaves map-edge sides visible', () => {
    const table = makeTable(3)
    const placed = place({
      board: table,
      pieceID: Pieces.grass1,
      at: table.center,
      altitude: 0,
    })
    const hex = Object.values(placed.board.boardHexes).find(
      (candidate) =>
        candidate.q === table.center.q &&
        candidate.r === table.center.r &&
        candidate.altitude === 1,
    ) as BoardHex

    expect(
      getLandHexSideVisibilityMask(hex, placed.board.boardHexes),
    ).toBe(0b111111)

    const higher = place({
      board: cloneBoard(placed.board),
      pieceID: Pieces.grass1,
      at: {
        q: table.center.q + 1,
        r: table.center.r,
        s: table.center.s - 1,
      },
      altitude: 1,
      permissive: true,
    })
    expect(getLandHexSideVisibilityMask(hex, higher.board.boardHexes)).toBe(
      0b111111,
    )
  })
})

describe('land hex colors', () => {
  it('uses terrain, dirt, and generic cap/side colors', () => {
    expect(getLandHexColors('grass', genericColors)).toMatchObject({
      cap: '#7c9a3c',
      side: '#975a3a',
      isFluid: false,
    })
    expect(getLandHexColors('generic', genericColors)).toMatchObject({
      cap: '#e63cc8',
      side: '#a01e8c',
      isFluid: false,
    })
    expect(getLandHexColors('genericFluid', genericColors)).toMatchObject({
      cap: '#ff96e6',
      side: '#c864b4',
      isFluid: true,
    })
  })

  it('highlights both surfaces without changing their base colors', () => {
    const datum = { capColor: '#123456', sideColor: '#abcdef' }
    expect(getLandHexDisplayColors(datum, false)).toEqual({
      cap: '#123456',
      side: '#abcdef',
    })
    expect(getLandHexDisplayColors(datum, true)).toEqual({
      cap: 'yellow',
      side: 'yellow',
    })
  })
})

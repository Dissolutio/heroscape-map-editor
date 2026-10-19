import { describe, expect, it } from 'vitest'
import libraryOfLaur from '../../public/json-maps/Web_4_Library_of_Laur.json'
import { buildupJsonFileMap } from '../data/buildupMap'
import { expandMoveGroup, getMoveGroup } from '../data/moveGroup'
import type { BoardPiece, CubeCoordinate, HexMap } from '../types'
import { Pieces } from '../types'
import {
  HEX_DIRECTIONS,
  hexUtilsAdd,
  hexUtilsGetRadialFarNeighborForRotation,
} from '../utils/hex-utils'
import { inflateBoardPiecesFromIds } from '../utils/map-utils'
import { type Board, makeTable, place } from './helpers/board'

const put = (
  board: Board,
  uid: string,
  inventoryID: string,
  at: CubeCoordinate,
  altitude = 0,
  rotation = 0,
) =>
  place({
    board,
    uid,
    pieceID: inventoryID,
    at,
    altitude,
    rotation,
    permissive: true,
  }).board

const connectorTypes = [
  {
    pieceID: Pieces.laurWallShort,
    rotations: [0, 1, 2, 3, 4, 5],
    target: (at: CubeCoordinate, rotation: number) =>
      hexUtilsAdd(at, HEX_DIRECTIONS[rotation]),
  },
  {
    pieceID: Pieces.laurWallShortStackable,
    rotations: [0, 1, 2, 3, 4, 5],
    target: (at: CubeCoordinate, rotation: number) =>
      hexUtilsAdd(at, HEX_DIRECTIONS[rotation]),
  },
  {
    pieceID: Pieces.laurWallLong,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    target: (at: CubeCoordinate, rotation: number) =>
      hexUtilsAdd(at, hexUtilsGetRadialFarNeighborForRotation(rotation)),
  },
  {
    pieceID: Pieces.laurWallLongStackable,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    target: (at: CubeCoordinate, rotation: number) =>
      hexUtilsAdd(at, hexUtilsGetRadialFarNeighborForRotation(rotation)),
  },
  {
    pieceID: Pieces.laurWallArch,
    rotations: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    target: (at: CubeCoordinate, rotation: number) =>
      hexUtilsAdd(at, hexUtilsGetRadialFarNeighborForRotation(rotation)),
  },
] as const

const pillarIDs = new Set<string>([
  Pieces.laurWallSquarePillar,
  Pieces.laurWallPillarStackable,
  Pieces.laurWallTrianglePillar,
])

const pillarStackCoords = (boardPieces: BoardPiece[], uids: string[]) =>
  new Set(
    boardPieces
      .filter((bp) => uids.includes(bp.uid) && pillarIDs.has(bp.inventoryID))
      .map(({ pieceCoords: { q, r, s } }) => `${q},${r},${s}`),
  )

describe('getMoveGroup', () => {
  it('returns a lone pillar as its own group and anchor', () => {
    const table = makeTable()
    const board = put(table, 'P', Pieces.laurWallSquarePillar, table.center)

    expect(getMoveGroup(board, 'P')).toEqual({
      uids: ['P'],
      anchorUid: 'P',
    })
  })

  it('groups every pillar at the same hex into one stack', () => {
    const table = makeTable()
    let board = put(table, 'BOTTOM', Pieces.laurWallSquarePillar, table.center)
    board = put(
      board,
      'MIDDLE',
      Pieces.laurWallPillarStackable,
      table.center,
      9,
    )
    board = put(board, 'TOP', Pieces.laurWallTrianglePillar, table.center, 18)

    expect(getMoveGroup(board, 'TOP')).toEqual({
      uids: ['BOTTOM', 'MIDDLE', 'TOP'],
      anchorUid: 'BOTTOM',
    })
  })

  it.each(
    connectorTypes.flatMap(({ pieceID, rotations, target }) =>
      rotations.map((rotation) => [pieceID, rotation, target] as const),
    ),
  )(
    '%s at rotation %s joins the two pillar stacks',
    (pieceID, rotation, getTarget) => {
      const table = makeTable(21)
      const start = table.center
      const end = getTarget(start, rotation)
      let board = put(table, 'START', Pieces.laurWallSquarePillar, start)
      board = put(board, 'END', Pieces.laurWallTrianglePillar, end)
      board = put(board, 'WALL', pieceID, start, 0, rotation)

      expect(getMoveGroup(board, 'WALL')).toEqual({
        uids: ['START', 'END', 'WALL'],
        anchorUid: 'START',
      })
    },
  )

  it('joins a three-pillar, two-wall chain when grabbed at every member', () => {
    const table = makeTable(21)
    const first = table.center
    const second = hexUtilsAdd(first, HEX_DIRECTIONS[0])
    const third = hexUtilsAdd(second, HEX_DIRECTIONS[1])
    let board = put(table, 'P1', Pieces.laurWallSquarePillar, first)
    board = put(board, 'P2', Pieces.laurWallTrianglePillar, second)
    board = put(board, 'P3', Pieces.laurWallSquarePillar, third)
    board = put(board, 'W1', Pieces.laurWallShort, first, 0, 0)
    board = put(board, 'W2', Pieces.laurWallShortStackable, second, 0, 1)

    for (const uid of ['P1', 'P2', 'P3', 'W1', 'W2']) {
      expect(getMoveGroup(board, uid).uids).toEqual([
        'P1',
        'P2',
        'P3',
        'W1',
        'W2',
      ])
    }
    expect(getMoveGroup(board, 'W2').anchorUid).toBe('P2')
  })

  it('includes a Laur arch between its two pillars', () => {
    const table = makeTable(21)
    const start = table.center
    const rotation = 2.5
    const end = hexUtilsAdd(
      start,
      hexUtilsGetRadialFarNeighborForRotation(rotation),
    )
    let board = put(table, 'P1', Pieces.laurWallSquarePillar, start)
    board = put(board, 'P2', Pieces.laurWallTrianglePillar, end)
    board = put(board, 'ARCH', Pieces.laurWallArch, start, 0, rotation)

    expect(getMoveGroup(board, 'ARCH')).toEqual({
      uids: ['P1', 'P2', 'ARCH'],
      anchorUid: 'P1',
    })
  })

  it('attaches a ruin to one pillar but never bridges an adjacent pillar', () => {
    const table = makeTable()
    const first = table.center
    const adjacent = hexUtilsAdd(first, HEX_DIRECTIONS[0])
    let board = put(table, 'P1', Pieces.laurWallSquarePillar, first)
    board = put(board, 'P2', Pieces.laurWallTrianglePillar, adjacent)
    board = put(board, 'RUIN', Pieces.laurWallRuin1, first, 0, 0.5)

    expect(getMoveGroup(board, 'RUIN')).toEqual({
      uids: ['P1', 'RUIN'],
      anchorUid: 'P1',
    })
  })

  it('keeps separate Laur structures separate', () => {
    const table = makeTable(21)
    const first = table.center
    const second = hexUtilsAdd(first, { q: 5, r: -2, s: -3 })
    const firstEnd = hexUtilsAdd(first, HEX_DIRECTIONS[0])
    const secondEnd = hexUtilsAdd(second, HEX_DIRECTIONS[3])
    let board = put(table, 'P1', Pieces.laurWallSquarePillar, first)
    board = put(board, 'P2', Pieces.laurWallTrianglePillar, firstEnd)
    board = put(board, 'W1', Pieces.laurWallShort, first, 0, 0)
    board = put(board, 'P3', Pieces.laurWallSquarePillar, second)
    board = put(board, 'P4', Pieces.laurWallTrianglePillar, secondEnd)
    board = put(board, 'W2', Pieces.laurWallShort, second, 0, 3)

    expect(getMoveGroup(board, 'W1').uids).toEqual(['P1', 'P2', 'W1'])
    expect(getMoveGroup(board, 'W2').uids).toEqual(['P3', 'P4', 'W2'])
  })

  it('anchors a ladder chain at the bottom when grabbed from the middle', () => {
    const table = makeTable()
    let board = put(table, 'BOTTOM', Pieces.ladder, table.center, 0, 2)
    board = put(board, 'MIDDLE', Pieces.ladder, table.center, 2, 2)
    board = put(board, 'TOP', Pieces.ladder, table.center, 4, 2)

    expect(getMoveGroup(board, 'MIDDLE')).toEqual({
      uids: ['BOTTOM', 'MIDDLE', 'TOP'],
      anchorUid: 'BOTTOM',
    })
  })

  it('returns unknown uids and unknown piece types as singletons', () => {
    const table = makeTable()
    const unknown: Board = {
      ...table,
      boardPieces: [
        ...table.boardPieces,
        {
          uid: 'FUTURE',
          inventoryID: 'future-piece',
          altitude: 0,
          rotation: 0,
          pieceCoords: table.center,
        },
      ],
    }

    expect(getMoveGroup(unknown, 'missing')).toEqual({
      uids: ['missing'],
      anchorUid: 'missing',
    })
    expect(getMoveGroup(unknown, 'FUTURE')).toEqual({
      uids: ['FUTURE'],
      anchorUid: 'FUTURE',
    })
  })

  it('expands selected structures once and keeps the grabbed anchor rule', () => {
    const table = makeTable()
    let board = put(table, 'BOTTOM', Pieces.ladder, table.center, 0, 0)
    board = put(board, 'TOP', Pieces.ladder, table.center, 2, 0)
    const other = hexUtilsAdd(table.center, HEX_DIRECTIONS[2])
    board = put(board, 'PILLAR', Pieces.laurWallSquarePillar, other)

    expect(expandMoveGroup(board, ['TOP', 'PILLAR', 'TOP'], 'TOP')).toEqual({
      uids: ['BOTTOM', 'TOP', 'PILLAR'],
      anchorUid: 'BOTTOM',
    })
  })

  it('loads the Laur sample map and finds its isolated pillars quickly', () => {
    const samplePieces = inflateBoardPiecesFromIds(
      Object.keys(libraryOfLaur.boardPieces),
    )
    const board = buildupJsonFileMap(
      samplePieces,
      libraryOfLaur.hexMap as HexMap,
    )
    const laurPieces = board.boardPieces.filter(
      (bp) =>
        pillarIDs.has(bp.inventoryID as never) ||
        connectorTypes.some((type) => type.pieceID === bp.inventoryID) ||
        LAUR_RUINS_FOR_TEST.has(bp.inventoryID),
    )
    const connectors = laurPieces.filter((bp) =>
      connectorTypes.some((type) => type.pieceID === bp.inventoryID),
    )
    const ruins = laurPieces.filter((bp) =>
      LAUR_RUINS_FOR_TEST.has(bp.inventoryID),
    )

    expect(board.droppedPieces).toEqual([])
    expect(laurPieces).toHaveLength(8)
    expect(connectors).toEqual([])
    expect(ruins).toEqual([])
    const startedAt = performance.now()
    const firstGroup = getMoveGroup(board, laurPieces[0].uid)
    expect(performance.now() - startedAt).toBeLessThan(500)
    expect(firstGroup.uids).toEqual([laurPieces[0].uid])
    for (const bp of laurPieces.slice(1)) {
      expect(getMoveGroup(board, bp.uid).uids).toEqual([bp.uid])
    }
    for (const bp of connectors) {
      const group = getMoveGroup(board, bp.uid)
      expect(pillarStackCoords(board.boardPieces, group.uids)).toHaveLength(2)
    }
    for (const bp of ruins) {
      const group = getMoveGroup(board, bp.uid)
      expect(pillarStackCoords(board.boardPieces, group.uids)).toHaveLength(1)
    }
  })
})

const LAUR_RUINS_FOR_TEST = new Set<string>([
  Pieces.laurWallRuin1,
  Pieces.laurWallRuin2,
  Pieces.laurWallRuin3,
])

import { describe, expect, it } from 'vitest'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { getSmartPlacementAltitude } from '../data/smartPlacement'
import { Pieces } from '../types'
import type { BoardHexes, CubeCoordinate } from '../types'
import { HEXGRID_MAX_ALTITUDE } from '../utils/constants'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
} from './helpers/board'

const origin = { q: 1, r: 0, s: -1 }
const grass = { q: 0, r: 0, s: 0 }
const rock = { q: 2, r: 0, s: -2 }

function add(
  board: Board,
  pieceID: string,
  at: CubeCoordinate,
  altitude: number,
  rotation = 0,
) {
  const result = place({ board, pieceID, at, altitude, rotation })
  expect(result.error).toBeUndefined()
  return result.board
}

function exampleBoard() {
  let board: Board = makeTable(3)
  board = add(board, 'g1', grass, 0)
  board = add(board, 'r1', rock, 0)
  return add(board, 'r1', rock, 1)
}

function resolve(
  board: Board,
  pieceID = 'g2',
  rotation = 0,
  altitude = 0,
  at = origin,
) {
  return getSmartPlacementAltitude({
    boardHexes: board.boardHexes,
    piece: piecesSoFar[pieceID],
    pieceCoords: at,
    altitude,
    rotation,
  })
}

describe('altitude-smart placement', () => {
  it.each([
    { rotation: 0, placement: 2, surface: 3, support: rock },
    { rotation: 3, placement: 1, surface: 2, support: grass },
  ])(
    'places the example at surface level $surface for rotation $rotation',
    ({ rotation, placement, surface, support }) => {
      const board = exampleBoard()
      const snapshot = cloneBoard(board)
      const altitude = resolve(board, 'g2', rotation)
      expect(altitude).toBe(placement)
      expect(board).toEqual(snapshot)
      expect(hexAt(board, origin, altitude)).toBeUndefined()

      const result = place({
        board,
        pieceID: 'g2',
        at: origin,
        altitude,
        rotation,
        permissive: true,
      })
      expect(result.error).toBeUndefined()
      expect(result.displacedUIDs).toEqual([])
      expect(hexAt(result.board, origin, surface)?.inventoryID).toBe('g2')
      expect(hexAt(result.board, support, surface)?.inventoryID).toBe('g2')
      expect(
        result.board.boardPieces[result.board.boardPieces.length - 1]?.altitude,
      ).toBe(placement)
      expect(computeConflictedPieceUIDs(result.board.boardPieces)).toEqual([])
    },
  )

  it('keeps the hovered level when it already fits', () => {
    expect(resolve(makeTable(3))).toBe(0)
    const board = exampleBoard()
    expect(resolve(board, 'g2', 0, 2)).toBe(2)
  })

  it('does not raise single-hex pieces', () => {
    expect(resolve(exampleBoard(), 'g1', 0, 0, rock)).toBe(0)
  })

  it('keeps the original altitude if no supported level fits', () => {
    expect(resolve(makeTable(3), 'g2', 0, 5)).toBe(5)
  })

  const landPieces = Object.values(piecesSoFar).filter(
    (piece) => piece.isHexTerrainPiece && piece.size > 1,
  )
  it.each(landPieces)(
    'finds auxiliary support for $id at every rotation',
    (piece) => {
      for (let rotation = 0; rotation < 6; rotation++) {
        const table = makeTable()
        const footprint = getPieceTemplateCoords({
          clickedHex: table.center,
          template: piece.template,
          rotation,
          isVsTile: false,
        })
        let board: Board = table
        board = add(board, 'g1', footprint[1], 0)
        board = add(board, 'g1', footprint[1], 1)
        const altitude = resolve(board, piece.id, rotation, 0, table.center)
        expect(altitude).toBe(2)
        expect(
          place({
            board,
            pieceID: piece.id,
            at: table.center,
            altitude,
            rotation,
          }).error,
        ).toBeUndefined()
      }
    },
  )

  it('raises a bridging glacier with only auxiliary support', () => {
    const piece = piecesSoFar[Pieces.glacier3]
    const footprint = getPieceTemplateCoords({
      clickedHex: origin,
      template: piece.template,
      rotation: 0,
      isVsTile: false,
    })
    const board = add(makeTable(), 'g1', footprint[1], 0)
    expect(resolve(board, piece.id)).toBe(1)
  })

  it('does not let an ordinary multi-hex obstacle bridge', () => {
    const piece = piecesSoFar[Pieces.tree415]
    const footprint = getPieceTemplateCoords({
      clickedHex: origin,
      template: piece.template,
      rotation: 0,
      isVsTile: false,
    })
    const board = add(makeTable(), 'g1', footprint[1], 0)
    expect(resolve(board, piece.id)).toBe(0)
  })

  it('raises an ordinary obstacle once all its hexes have support', () => {
    const piece = piecesSoFar[Pieces.tree415]
    const footprint = getPieceTemplateCoords({
      clickedHex: origin,
      template: piece.template,
      rotation: 0,
      isVsTile: false,
    })
    let board: Board = makeTable()
    for (const coords of footprint) board = add(board, 'g1', coords, 0)
    expect(resolve(board, piece.id)).toBe(1)
  })

  it('checks overhead obstacles, not just the base footprint', () => {
    let board: Board = makeTable()
    board = add(board, 'g1', rock, 0)
    // Permissive placement constructs a floating obstacle above the support.
    board = place({
      board,
      pieceID: Pieces.tree10,
      at: origin,
      altitude: 3,
      permissive: true,
    }).board
    // The glacier would overlap the tree's clearance at altitude 1.
    expect(resolve(board, Pieces.glacier3)).toBe(0)
  })

  it('does not change overlays or wall add-ons', () => {
    const board = exampleBoard()
    expect(resolve(board, Pieces.startZone1)).toBe(0)
    expect(resolve(board, Pieces.laurWallLong)).toBe(0)
  })

  it('does not search beyond the altitude budget', () => {
    const board = place({
      board: makeTable(),
      pieceID: 'g1',
      at: rock,
      altitude: HEXGRID_MAX_ALTITUDE - 1,
      permissive: true,
    }).board
    expect(resolve(board)).toBe(0)
  })

  it('bounds hover work to the footprint, independent of map size', () => {
    const board = exampleBoard()
    let reads = 0
    const boardHexes = new Proxy(board.boardHexes, {
      get(target, key: string) {
        reads++
        return target[key]
      },
      ownKeys() {
        throw new Error('Smart placement must not scan the whole board')
      },
    }) satisfies BoardHexes
    expect(resolve({ ...board, boardHexes })).toBe(2)
    expect(reads).toBeLessThanOrEqual(500)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  decideDrop,
  evaluateDragTarget,
  getDragTargetKey,
  getDraggableSelectionGroup,
  getEdgeDragTarget,
  getGrabOffset,
  isDraggablePiece,
} from '../data/dragMove'
import { applyPieceMoves } from '../data/movePieces'
import { piecesSoFar } from '../data/pieces'
import { resolvePlacement } from '../data/placement'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../types'
import { Pieces } from '../types'
import { cubeToPixel, hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import { type Board, hexAt, makeTable, place } from './helpers/board'

const EDGE_PIECE_IDS = [Pieces.battlement, Pieces.roadWall, Pieces.ropeLadder]

const noOffset = { q: 0, r: 0, s: 0 }

function edgePoint(hex: CubeCoordinate, edge: number) {
  const center = cubeToPixel(hex)
  const neighbor = hexUtilsGetNeighborForRotation(edge)
  const neighborCenter = cubeToPixel({
    q: hex.q + neighbor.q,
    r: hex.r + neighbor.r,
    s: hex.s + neighbor.s,
  })
  return {
    x: (center.x + neighborCenter.x) / 2,
    z: (center.y + neighborCenter.y) / 2,
  }
}

function currentEdge(pieceID: string, rotation: number) {
  return pieceID === Pieces.battlement ? (rotation + 3) % 6 : rotation
}

function placeEdgePiece(
  board: Board,
  pieceID: string,
  uid: string,
  clickedHex: CubeCoordinate,
  edge: number,
) {
  const pointerHex = hexAt(board, clickedHex, 0)
  if (!pointerHex) throw new Error('edge-piece support hex is missing')
  const piece = piecesSoFar[pieceID]
  const resolution = resolvePlacement(piece, pointerHex, edge, board, {
    deferOffMapCheck: true,
  })
  if ('blocked' in resolution) {
    throw new Error(`unexpected placement refusal: ${resolution.blocked}`)
  }
  const placed = place({
    board,
    pieceID,
    at: resolution.coords,
    altitude: resolution.altitude,
    rotation: resolution.rotation,
    uid,
  })
  if (placed.error) throw new Error(placed.error.message)
  return placed.board
}

function setStoreBoard(board: Board) {
  useBoundStore.setState({
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    conflictedPieceUIDs: computeConflictedPieceUIDs(board.boardPieces),
    unsupportedPieceUIDs: [],
    viewingLevel: 0,
  })
  useBoundStore.temporal.getState().clear()
}

describe('edge-piece drag eligibility and targeting', () => {
  it.each(EDGE_PIECE_IDS)('%s is draggable', (pieceID) => {
    expect(isDraggablePiece(piecesSoFar[pieceID])).toBe(true)
  })

  it.each(EDGE_PIECE_IDS)(
    '%s resolves each of the six hovered-hex edges',
    (pieceID) => {
      const hex = { q: 3, r: 3, s: -6 }
      for (let edge = 0; edge < 6; edge++) {
        const rotation = pieceID === Pieces.battlement ? (edge + 3) % 6 : edge
        const bp: BoardPiece = {
          uid: 'EDGE',
          inventoryID: pieceID,
          altitude: -1,
          rotation,
          pieceCoords: hex,
        }
        expect(
          getEdgeDragTarget(
            piecesSoFar[pieceID],
            bp,
            hex,
            edgePoint(hex, edge),
          ),
        ).toEqual({ edgeIndex: edge, rotation: edge })
      }
    },
  )

  it.each(EDGE_PIECE_IDS)(
    '%s uses its current attachment edge as a tie-break',
    (pieceID) => {
      const hex = { q: 3, r: 3, s: -6 }
      const rotation = pieceID === Pieces.battlement ? 1 : 4
      const bp: BoardPiece = {
        uid: 'EDGE',
        inventoryID: pieceID,
        altitude: -1,
        rotation,
        pieceCoords: hex,
      }
      expect(
        getEdgeDragTarget(piecesSoFar[pieceID], bp, hex, {
          ...cubeToPixel(hex),
          z: cubeToPixel(hex).y,
        }),
      ).toEqual({
        edgeIndex: currentEdge(pieceID, rotation),
        rotation: currentEdge(pieceID, rotation),
      })
    },
  )

  it('caches an edge target by the resolved hex and edge, not raw pointer', () => {
    const table = makeTable(8)
    const hex = hexAt(table, { q: 3, r: 3, s: -6 }, 0) as BoardHex
    const bp: BoardPiece = {
      uid: 'EDGE',
      inventoryID: Pieces.roadWall,
      altitude: -1,
      rotation: 0,
      pieceCoords: hex,
    }
    const first = edgePoint(hex, 0)
    const second = { x: first.x + 0.05, z: first.z + 0.03 }
    expect(getDragTargetKey(piecesSoFar[Pieces.roadWall], bp, hex, first)).toBe(
      getDragTargetKey(piecesSoFar[Pieces.roadWall], bp, hex, second),
    )
    expect(
      getDragTargetKey(
        piecesSoFar[Pieces.roadWall],
        bp,
        hex,
        edgePoint(hex, 1),
      ),
    ).not.toBe(getDragTargetKey(piecesSoFar[Pieces.roadWall], bp, hex, first))
  })

  it.each(EDGE_PIECE_IDS)(
    '%s ignores footprint offsets and follows its attachment edge',
    (pieceID) => {
      const piece = piecesSoFar[pieceID]
      const bp: BoardPiece = {
        uid: 'EDGE',
        inventoryID: pieceID,
        altitude: -1,
        rotation: 0,
        pieceCoords: { q: 3, r: 3, s: -6 },
      }
      expect(getGrabOffset(piece, bp, { x: 100, z: -100 })).toEqual(noOffset)
    },
  )
})

describe('edge-piece drag placement', () => {
  it.each(EDGE_PIECE_IDS)(
    '%s uses its pen placement rule at the pointer-selected edge',
    (pieceID) => {
      const board = makeTable(8)
      const source = { q: 1, r: 3, s: -4 }
      const initialEdge = 0
      const placedBoard = placeEdgePiece(
        board,
        pieceID,
        'EDGE',
        source,
        initialEdge,
      )
      const bp = placedBoard.boardPieces[0]
      const destination = { q: 4, r: 3, s: -7 }
      const pointerHex = hexAt(placedBoard, destination, 0)
      if (!pointerHex) throw new Error('drag target hex is missing')
      const edge = 2
      const target = evaluateDragTarget(
        placedBoard,
        piecesSoFar[pieceID],
        bp,
        pointerHex,
        noOffset,
        [bp],
        edgePoint(destination, edge),
      )
      const direction =
        pieceID === Pieces.battlement
          ? edge
          : pieceID === Pieces.roadWall
            ? (edge + 4) % 6
            : undefined
      const step =
        direction === undefined
          ? { q: 0, r: 0, s: 0 }
          : hexUtilsGetNeighborForRotation(direction)
      const expectedCoords = {
        q: destination.q + step.q,
        r: destination.r + step.r,
        s: destination.s + step.s,
      }

      expect(target.resolution).toMatchObject({
        coords: expectedCoords,
        altitude: -1,
        rotation: pieceID === Pieces.battlement ? (edge + 3) % 6 : edge,
      })
      expect(target.members[0]).toMatchObject({
        edgeIndex: edge,
        previewHex: { ...destination, altitude: 0 },
      })
      expect(target.evaluation.status).toBe('ok')
    },
  )

  it('battlements and road walls keep the existing rim exception', () => {
    const board = makeTable(4)
    const rimHex = Object.values(board.boardHexes).find(
      (hex) =>
        hex.altitude === 0 &&
        hex.terrain === 'empty' &&
        !board.boardHexes[
          genBoardHexID({
            q: hex.q + hexUtilsGetNeighborForRotation(0).q,
            r: hex.r + hexUtilsGetNeighborForRotation(0).r,
            s: hex.s + hexUtilsGetNeighborForRotation(0).s,
            altitude: 0,
          })
        ],
    )
    if (!rimHex) throw new Error('table rim hex is missing')

    for (const pieceID of [Pieces.battlement, Pieces.roadWall]) {
      const sourceBoard = placeEdgePiece(
        board,
        pieceID,
        `SOURCE-${pieceID}`,
        { q: 1, r: 1, s: -2 },
        0,
      )
      const source = sourceBoard.boardPieces.find(
        (bp) => bp.uid === `SOURCE-${pieceID}`,
      )
      if (!source) throw new Error('edge source is missing')
      const target = evaluateDragTarget(
        sourceBoard,
        piecesSoFar[pieceID],
        source,
        rimHex,
        noOffset,
        [source],
        edgePoint(rimHex, 0),
      )
      expect(target.evaluation.status).toBe('ok')
      expect(target.resolution).not.toHaveProperty('blocked')
    }
  })

  it.each([Pieces.battlement, Pieces.roadWall])(
    '%s is refused on a castle wall top',
    (pieceID) => {
      const board = makeTable(8)
      const wallAt = { q: 3, r: 3, s: -6 }
      const wall = place({
        board,
        pieceID: Pieces.castleWallStraight,
        at: wallAt,
        altitude: 0,
        uid: 'WALL',
      })
      if (wall.error) throw new Error(wall.error.message)
      const wallTop = hexAt(wall.board, wallAt, 1)
      if (!wallTop) throw new Error('castle wall top is missing')
      const sourceBoard = placeEdgePiece(
        wall.board,
        pieceID,
        'EDGE',
        { q: 1, r: 3, s: -4 },
        0,
      )
      const source = sourceBoard.boardPieces.find((bp) => bp.uid === 'EDGE')
      if (!source) throw new Error('edge source is missing')
      const target = evaluateDragTarget(
        sourceBoard,
        piecesSoFar[pieceID],
        source,
        wallTop,
        noOffset,
        [source],
        edgePoint(wallAt, 1),
      )
      expect(target.resolution).toEqual({ blocked: 'notOnCastleWallTop' })
      expect(decideDrop('EDGE', target)).toMatchObject({
        type: 'cancel',
        reason: 'notOnCastleWallTop',
      })
    },
  )

  it.each(EDGE_PIECE_IDS)(
    '%s moves in one undo step and undo restores the board',
    (pieceID) => {
      let board: Board = makeTable(8)
      const source = { q: 1, r: 3, s: -4 }
      board = placeEdgePiece(board, pieceID, 'EDGE', source, 0)
      const bp = board.boardPieces.find((piece) => piece.uid === 'EDGE')
      const targetHex = hexAt(board, { q: 4, r: 3, s: -7 }, 0)
      if (!bp || !targetHex) throw new Error('edge drag fixture is incomplete')
      const target = evaluateDragTarget(
        board,
        piecesSoFar[pieceID],
        bp,
        targetHex,
        noOffset,
        [bp],
        edgePoint(targetHex, 2),
      )
      if ('blocked' in target.resolution) {
        throw new Error(`unexpected edge refusal: ${target.resolution.blocked}`)
      }
      const decision = decideDrop('EDGE', target)
      if (decision.type !== 'move') throw new Error('expected an edge move')

      setStoreBoard(board)
      const before = structuredClone({
        boardHexes: useBoundStore.getState().boardHexes,
        boardPieces: useBoundStore.getState().boardPieces,
      })
      useBoundStore.getState().movePieces({
        moves: decision.moves ?? [
          {
            uid: decision.uid,
            newPieceCoords: decision.newPieceCoords,
            newAltitude: decision.newAltitude,
            newRotation: decision.newRotation,
          },
        ],
      })

      expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
      const moved = useBoundStore
        .getState()
        .boardPieces.find((piece) => piece.uid === 'EDGE')
      expect(moved).toMatchObject({
        inventoryID: pieceID,
        pieceCoords: target.resolution.coords,
        altitude: target.resolution.altitude,
      })

      useBoundStore.temporal.getState().undo()
      const undone = useBoundStore.getState()
      expect({
        boardHexes: undone.boardHexes,
        boardPieces: undone.boardPieces,
      }).toEqual(before)
    },
  )

  it('keeps a rigid mixed group together without member conflicts', () => {
    let board: Board = makeTable(8)
    board = placeEdgePiece(
      board,
      Pieces.battlement,
      'BATTLEMENT',
      { q: 1, r: 3, s: -4 },
      0,
    )
    board = placeEdgePiece(
      board,
      Pieces.roadWall,
      'ROAD',
      { q: 2, r: 3, s: -5 },
      2,
    )
    board = placeEdgePiece(
      board,
      Pieces.ropeLadder,
      'LADDER',
      { q: 1, r: 4, s: -5 },
      4,
    )
    const grabbed = board.boardPieces.find(
      (piece) => piece.uid === 'BATTLEMENT',
    )
    const pointerHex = hexAt(board, { q: 4, r: 3, s: -7 }, 0)
    if (!grabbed || !pointerHex) throw new Error('mixed group is incomplete')
    const group = getDraggableSelectionGroup(
      ['BATTLEMENT', 'ROAD', 'LADDER'],
      'BATTLEMENT',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable mixed group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      grabbed,
      pointerHex,
      noOffset,
      group,
      edgePoint(pointerHex, 1),
    )
    if ('blocked' in target.resolution) {
      throw new Error(`unexpected edge refusal: ${target.resolution.blocked}`)
    }
    const delta = {
      q: target.resolution.coords.q - grabbed.pieceCoords.q,
      r: target.resolution.coords.r - grabbed.pieceCoords.r,
      s: target.resolution.coords.s - grabbed.pieceCoords.s,
    }

    expect(target.evaluation.status).toBe('ok')
    for (const member of target.members) {
      expect(member.resolution).toMatchObject({
        coords: {
          q: member.bp.pieceCoords.q + delta.q,
          r: member.bp.pieceCoords.r + delta.r,
          s: member.bp.pieceCoords.s + delta.s,
        },
        altitude: member.bp.altitude,
        rotation:
          member.uid === grabbed.uid
            ? target.resolution.rotation
            : member.bp.rotation,
      })
      expect(member.evaluation.status).toBe('ok')
    }
    const decision = decideDrop(grabbed.uid, target)
    if (decision.type !== 'move') throw new Error('expected rigid group move')

    setStoreBoard(board)
    const before = structuredClone({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    })
    useBoundStore.getState().movePieces({ moves: decision.moves ?? [] })
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    expect(useBoundStore.getState().conflictedPieceUIDs).toEqual([])

    useBoundStore.temporal.getState().undo()
    expect({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    }).toEqual(before)
  })

  it('blocks a group dragged below altitude zero', () => {
    let board: Board = makeTable(8)
    board = placeEdgePiece(
      board,
      Pieces.battlement,
      'BATTLEMENT',
      { q: 1, r: 3, s: -4 },
      0,
    )
    board = placeEdgePiece(
      board,
      Pieces.ropeLadder,
      'LADDER',
      { q: 2, r: 3, s: -5 },
      2,
    )
    const grabbed = board.boardPieces.find(
      (piece) => piece.uid === 'BATTLEMENT',
    )
    const targetHex = hexAt(board, { q: 4, r: 3, s: -7 }, 0)
    if (!grabbed || !targetHex) throw new Error('height fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['BATTLEMENT', 'LADDER'],
      'BATTLEMENT',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      grabbed,
      { ...targetHex, altitude: -1 },
      noOffset,
      group,
      edgePoint(targetHex, 0),
    )

    expect(target.evaluation.status).toBe('blocked')
    expect(decideDrop(grabbed.uid, target)).toMatchObject({
      type: 'cancel',
      reason: 'outOfHeight',
    })
  })

  it('records no undo step when dropped on the same edge', () => {
    let board: Board = makeTable(8)
    const source = { q: 1, r: 3, s: -4 }
    board = placeEdgePiece(board, Pieces.ropeLadder, 'EDGE', source, 2)
    const bp = board.boardPieces.find((piece) => piece.uid === 'EDGE')
    const pointerHex = hexAt(board, source, 0)
    if (!bp || !pointerHex) throw new Error('same-edge fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ropeLadder],
      bp,
      pointerHex,
      noOffset,
      [bp],
      edgePoint(source, 2),
    )
    const decision = decideDrop('EDGE', target)
    if (decision.type !== 'move') throw new Error('expected same-edge move')
    setStoreBoard(board)
    useBoundStore.getState().movePieces({
      moves: [
        {
          uid: decision.uid,
          newPieceCoords: decision.newPieceCoords,
          newAltitude: decision.newAltitude,
          newRotation: decision.newRotation,
        },
      ],
    })
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(0)
    expect(useBoundStore.getState().boardPieces).toEqual(board.boardPieces)
  })

  it('moves from frozen conflicted state without mutating the input board', () => {
    let board: Board = makeTable(8)
    board = placeEdgePiece(
      board,
      Pieces.battlement,
      'EDGE',
      { q: 1, r: 3, s: -4 },
      0,
    )
    const ruin = place({
      board,
      pieceID: 'lwr',
      at: { q: 3, r: 3, s: -6 },
      altitude: 0,
      uid: 'RUIN',
    })
    board = ruin.board
    board = place({
      board,
      pieceID: 'g1',
      at: { q: 4, r: 3, s: -7 },
      altitude: 0,
      uid: 'LAND',
      permissive: true,
    }).board
    const conflicts = computeConflictedPieceUIDs(board.boardPieces)
    const edge = board.boardPieces.find((piece) => piece.uid === 'EDGE')
    const before = structuredClone(board)
    if (!edge) throw new Error('frozen-board edge piece is missing')
    const frozenBoard: Board = {
      ...board,
      boardHexes: Object.fromEntries(
        Object.entries(board.boardHexes).map(([id, hex]) => [
          id,
          Object.freeze({ ...hex }),
        ]),
      ),
      boardPieces: board.boardPieces.map((piece) =>
        Object.freeze({ ...piece }),
      ),
    }
    expect(conflicts).toContain('RUIN')
    const result = applyPieceMoves(
      { ...frozenBoard, conflictedPieceUIDs: conflicts },
      [
        {
          uid: edge.uid,
          newPieceCoords: {
            q: edge.pieceCoords.q + 1,
            r: edge.pieceCoords.r,
            s: edge.pieceCoords.s - 1,
          },
          newAltitude: edge.altitude,
          newRotation: edge.rotation,
        },
      ],
    )
    expect(result).not.toBeNull()
    expect(frozenBoard).toEqual(before)
  })
})

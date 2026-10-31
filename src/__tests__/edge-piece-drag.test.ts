import { beforeEach, describe, expect, it } from 'vitest'
import {
  type DragTargetMember,
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
import { type ResolvedPlacement, resolvePlacement } from '../data/placement'
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

function supportCoords(pieceID: string, bp: BoardPiece): CubeCoordinate {
  if (pieceID === Pieces.ropeLadder) return bp.pieceCoords
  const direction =
    pieceID === Pieces.battlement
      ? currentEdge(pieceID, bp.rotation)
      : (currentEdge(pieceID, bp.rotation) + 4) % 6
  const neighbor = hexUtilsGetNeighborForRotation(direction)
  return {
    q: bp.pieceCoords.q - neighbor.q,
    r: bp.pieceCoords.r - neighbor.r,
    s: bp.pieceCoords.s - neighbor.s,
  }
}

function requireResolved(
  resolution: DragTargetMember['resolution'],
): ResolvedPlacement {
  if ('blocked' in resolution) {
    throw new Error(`unexpected placement refusal: ${resolution.blocked}`)
  }
  return resolution
}

function placeEdgePiece(
  board: Board,
  pieceID: string,
  uid: string,
  clickedHex: CubeCoordinate,
  edge: number,
  supportAltitude = 0,
) {
  const pointerHex = hexAt(board, clickedHex, supportAltitude)
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

  it.each(EDGE_PIECE_IDS)(
    '%s keeps a tied current edge, otherwise choosing the lowest index',
    (pieceID) => {
      const hex = { q: 3, r: 3, s: -6 }
      const firstPoint = edgePoint(hex, 0)
      const secondPoint = edgePoint(hex, 1)
      const tiedPoint = {
        x: (firstPoint.x + secondPoint.x) / 2,
        z: (firstPoint.z + secondPoint.z) / 2,
      }
      const makePiece = (edge: number): BoardPiece => ({
        uid: 'EDGE',
        inventoryID: pieceID,
        altitude: -1,
        rotation: pieceID === Pieces.battlement ? (edge + 3) % 6 : edge,
        pieceCoords: hex,
      })

      expect(
        getEdgeDragTarget(
          piecesSoFar[pieceID],
          makePiece(1),
          hex,
          tiedPoint,
        ),
      ).toEqual({ edgeIndex: 1, rotation: 1 })
      expect(
        getEdgeDragTarget(
          piecesSoFar[pieceID],
          makePiece(4),
          hex,
          tiedPoint,
        ),
      ).toEqual({ edgeIndex: 0, rotation: 0 })
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

  it('caches a group edge target by hovered hex, ignoring the edge', () => {
    const table = makeTable(8)
    const hex = hexAt(table, { q: 3, r: 3, s: -6 }, 0) as BoardHex
    const bp: BoardPiece = {
      uid: 'EDGE',
      inventoryID: Pieces.battlement,
      altitude: -1,
      rotation: 3,
      pieceCoords: hex,
    }

    expect(
      getDragTargetKey(
        piecesSoFar[Pieces.battlement],
        bp,
        hex,
        edgePoint(hex, 0),
        true,
      ),
    ).toBe(
      getDragTargetKey(
        piecesSoFar[Pieces.battlement],
        bp,
        hex,
        edgePoint(hex, 4),
        true,
      ),
    )
    expect(
      getDragTargetKey(
        piecesSoFar[Pieces.battlement],
        bp,
        hex,
        edgePoint(hex, 0),
        true,
      ),
    ).toBe(hex.id)
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
    const source = { q: 1, r: 3, s: -4 }
    board = placeEdgePiece(board, Pieces.battlement, 'BATTLEMENT', source, 0)
    board = placeEdgePiece(board, Pieces.battlement, 'BATTLEMENT-2', source, 3)
    board = placeEdgePiece(board, Pieces.roadWall, 'ROAD', source, 2)
    board = placeEdgePiece(board, Pieces.ropeLadder, 'LADDER', source, 4)
    const normal = place({
      board,
      pieceID: 'g1',
      at: { q: 2, r: 3, s: -5 },
      altitude: 0,
      uid: 'NORMAL',
    })
    if (normal.error) throw new Error(normal.error.message)
    board = normal.board
    const grabbed = board.boardPieces.find(
      (piece) => piece.uid === 'BATTLEMENT',
    )
    const pointerHex = hexAt(board, { q: 4, r: 3, s: -7 }, 0)
    if (!grabbed || !pointerHex) throw new Error('mixed group is incomplete')
    const group = getDraggableSelectionGroup(
      ['BATTLEMENT', 'BATTLEMENT-2', 'ROAD', 'LADDER', 'NORMAL'],
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
      const resolution = requireResolved(member.resolution)
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
      if (
        member.piece.id === Pieces.battlement ||
        member.piece.id === Pieces.roadWall ||
        member.piece.id === Pieces.ropeLadder
      ) {
        expect(
          supportCoords(member.piece.id, {
            ...member.bp,
            pieceCoords: resolution.coords,
            rotation: resolution.rotation,
          }),
        ).toMatchObject({
          q: pointerHex.q,
          r: pointerHex.r,
          s: pointerHex.s,
        })
      }
    }
    expect(target.resolution.rotation).toBe(grabbed.rotation)
    expect(
      target.members.find((member) => member.uid === 'NORMAL'),
    ).toMatchObject({
      resolution: {
        coords: {
          q: 5,
          r: 3,
          s: -8,
        },
      },
    })
    expect(
      target.members
        .filter((member) => member.edgeIndex !== undefined)
        .map((member) => member.edgeIndex),
    ).toEqual([0, 3, 2, 4])
    expect(
      target.members
        .filter((member) => member.edgeIndex !== undefined)
        .every((member) => member.previewHex.altitude === 0),
    ).toBe(true)
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

  it('keeps three battlements on one support hex and preserves their edges', () => {
    let board: Board = makeTable(8)
    const source = { q: 1, r: 3, s: -4 }
    for (const [index, edge] of [0, 2, 4].entries()) {
      board = placeEdgePiece(
        board,
        Pieces.battlement,
        `BATTLEMENT-${index}`,
        source,
        edge,
      )
    }
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'BATTLEMENT-0')
    const destination = { q: 4, r: 3, s: -7 }
    const pointerHex = hexAt(board, destination, 0)
    if (!grabbed || !pointerHex) {
      throw new Error('battlement group is incomplete')
    }
    const group = getDraggableSelectionGroup(
      ['BATTLEMENT-0', 'BATTLEMENT-1', 'BATTLEMENT-2'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable battlement group')
    const pointerEdge = 1
    expect(currentEdge(Pieces.battlement, grabbed.rotation)).not.toBe(
      pointerEdge,
    )
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      grabbed,
      pointerHex,
      noOffset,
      group,
      edgePoint(destination, pointerEdge),
    )
    const resolvedTarget = requireResolved(target.resolution)
    for (const member of target.members) requireResolved(member.resolution)

    expect(resolvedTarget.rotation).toBe(grabbed.rotation)
    expect(
      target.members.map(
        (member) => requireResolved(member.resolution).rotation,
      ),
    ).toEqual([3, 5, 1])
    expect(
      target.members.map((member) =>
        supportCoords(Pieces.battlement, {
          ...member.bp,
          pieceCoords: requireResolved(member.resolution).coords,
          rotation: requireResolved(member.resolution).rotation,
        }),
      ),
    ).toEqual([destination, destination, destination])
    expect(target.members.map((member) => member.edgeIndex)).toEqual([0, 2, 4])
    expect(target.members.map((member) => member.previewHex)).toEqual(
      target.members.map(() => ({ ...destination, altitude: 0 })),
    )
    const decision = decideDrop(grabbed.uid, target)
    if (decision.type !== 'move') {
      throw new Error('expected battlement group move')
    }
    setStoreBoard(board)
    const before = structuredClone({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    })
    useBoundStore.getState().movePieces({ moves: decision.moves ?? [] })
    const moved = useBoundStore
      .getState()
      .boardPieces.filter((member) =>
        group.some((groupMember) => groupMember.uid === member.uid),
      )
    expect(
      moved.map((member) => supportCoords(Pieces.battlement, member)),
    ).toEqual([destination, destination, destination])
    expect(moved.map((member) => member.rotation)).toEqual([3, 5, 1])
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    useBoundStore.temporal.getState().undo()
    expect({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    }).toEqual(before)
  })

  it('keeps two road walls on their shared support with their own edges', () => {
    let board: Board = makeTable(8)
    const source = { q: 1, r: 3, s: -4 }
    board = placeEdgePiece(board, Pieces.roadWall, 'ROAD-1', source, 0)
    board = placeEdgePiece(board, Pieces.roadWall, 'ROAD-2', source, 3)
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'ROAD-1')
    const destination = { q: 4, r: 3, s: -7 }
    const pointerHex = hexAt(board, destination, 0)
    if (!grabbed || !pointerHex) throw new Error('road group is incomplete')
    const group = getDraggableSelectionGroup(
      ['ROAD-1', 'ROAD-2'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable road group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.roadWall],
      grabbed,
      pointerHex,
      noOffset,
      group,
      edgePoint(destination, 2),
    )
    const resolvedTarget = requireResolved(target.resolution)
    for (const member of target.members) requireResolved(member.resolution)

    expect(resolvedTarget.rotation).toBe(grabbed.rotation)
    expect(
      target.members.map(
        (member) => requireResolved(member.resolution).rotation,
      ),
    ).toEqual([0, 3])
    expect(
      target.members.map((member) =>
        supportCoords(Pieces.roadWall, {
          ...member.bp,
          pieceCoords: requireResolved(member.resolution).coords,
          rotation: requireResolved(member.resolution).rotation,
        }),
      ),
    ).toEqual([destination, destination])
    expect(target.members.map((member) => member.edgeIndex)).toEqual([0, 3])
    expect(target.members.map((member) => member.previewHex)).toEqual(
      target.members.map(() => ({ ...destination, altitude: 0 })),
    )
  })

  it('keeps a rope ladder and battlement together when grabbing the ladder', () => {
    let board: Board = makeTable(8)
    const source = { q: 1, r: 3, s: -4 }
    board = placeEdgePiece(board, Pieces.ropeLadder, 'LADDER', source, 4)
    board = placeEdgePiece(board, Pieces.battlement, 'BATTLEMENT', source, 1)
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'LADDER')
    const destination = { q: 4, r: 3, s: -7 }
    const pointerHex = hexAt(board, destination, 0)
    if (!grabbed || !pointerHex) throw new Error('ladder group is incomplete')
    const group = getDraggableSelectionGroup(
      ['LADDER', 'BATTLEMENT'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable ladder group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ropeLadder],
      grabbed,
      pointerHex,
      noOffset,
      group,
      edgePoint(destination, 2),
    )
    const resolvedTarget = requireResolved(target.resolution)
    for (const member of target.members) requireResolved(member.resolution)

    expect(resolvedTarget.rotation).toBe(grabbed.rotation)
    expect(
      target.members.map(
        (member) => requireResolved(member.resolution).rotation,
      ),
    ).toEqual([4, 4])
    expect(
      target.members.map((member) =>
        supportCoords(member.piece.id, {
          ...member.bp,
          pieceCoords: requireResolved(member.resolution).coords,
          rotation: requireResolved(member.resolution).rotation,
        }),
      ),
    ).toEqual([destination, destination])
    expect(target.members.map((member) => member.edgeIndex)).toEqual([4, 1])
  })

  it('keeps edge members rigid when a normal piece is grabbed', () => {
    let board: Board = makeTable(8)
    const source = { q: 2, r: 3, s: -5 }
    board = placeEdgePiece(board, Pieces.battlement, 'BATTLEMENT', source, 1)
    board = placeEdgePiece(board, Pieces.roadWall, 'ROAD', source, 3)
    const normal = place({
      board,
      pieceID: 'g1',
      at: source,
      altitude: 0,
      uid: 'NORMAL',
    })
    if (normal.error) throw new Error(normal.error.message)
    board = normal.board
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'NORMAL')
    const destination = { q: 4, r: 3, s: -7 }
    const pointerHex = hexAt(board, destination, 0)
    if (!grabbed || !pointerHex)
      throw new Error('normal-led group is incomplete')
    const group = getDraggableSelectionGroup(
      ['NORMAL', 'BATTLEMENT', 'ROAD'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable mixed group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointerHex,
      noOffset,
      group,
    )
    const resolvedTarget = requireResolved(target.resolution)
    for (const member of target.members) requireResolved(member.resolution)

    expect(resolvedTarget.coords).toEqual(destination)
    expect(
      target.members
        .filter((member) => member.uid !== 'NORMAL')
        .map((member) =>
          supportCoords(member.piece.id, {
            ...member.bp,
            pieceCoords: requireResolved(member.resolution).coords,
            rotation: requireResolved(member.resolution).rotation,
          }),
        ),
    ).toEqual([destination, destination])
    expect(
      target.members.find((member) => member.uid === 'NORMAL')?.resolution,
    ).toMatchObject({ coords: destination })
    expect(
      target.members.map(
        (member) => requireResolved(member.resolution).rotation,
      ),
    ).toEqual([0, 4, 3])
  })

  it('blocks the whole group when a normal member moves off the map', () => {
    const table = makeTable(8)
    const rimCandidate = Object.values(table.boardHexes)
      .filter((hex) => hex.altitude === 0 && hex.terrain === 'empty')
      .flatMap((hex) =>
        Array.from({ length: 6 }, (_, edge) => {
          const neighbor = hexUtilsGetNeighborForRotation(edge)
          const hasOutsideNeighbor = !hexAt(
            table,
            {
              q: hex.q + neighbor.q,
              r: hex.r + neighbor.r,
              s: hex.s + neighbor.s,
            },
            0,
          )
          if (!hasOutsideNeighbor) return []
          const source = {
            q: hex.q - 2 * neighbor.q,
            r: hex.r - 2 * neighbor.r,
            s: hex.s - 2 * neighbor.s,
          }
          const normalSource = {
            q: source.q + neighbor.q,
            r: source.r + neighbor.r,
            s: source.s + neighbor.s,
          }
          return hexAt(table, source, 0) && hexAt(table, normalSource, 0)
            ? [{ hex, edge, source, normalSource }]
            : []
        }),
      )
      .flat()[0]
    if (!rimCandidate) throw new Error('table rim fixture is missing')
    const { hex: rim, source, normalSource } = rimCandidate
    let board: Board = table
    board = placeEdgePiece(board, Pieces.battlement, 'EDGE', source, 0)
    const normal = place({
      board,
      pieceID: 'g1',
      at: normalSource,
      altitude: 0,
      uid: 'NORMAL',
    })
    if (normal.error) throw new Error(normal.error.message)
    board = normal.board
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'EDGE')
    const pointerHex = hexAt(board, rim, 0)
    if (!grabbed || !pointerHex) throw new Error('rim group is incomplete')
    const group = getDraggableSelectionGroup(
      ['EDGE', 'NORMAL'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable rim group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      grabbed,
      pointerHex,
      noOffset,
      group,
    )

    expect(
      target.members.find((member) => member.uid === 'NORMAL')?.evaluation,
    ).toMatchObject({ status: 'blocked', reason: 'offMap' })
    expect(target.evaluation.status).toBe('blocked')
    expect(decideDrop(grabbed.uid, target)).toMatchObject({
      type: 'cancel',
      reason: 'offMap',
    })
  })

  it('blocks the whole group when one edge member targets a castle wall top', () => {
    let board: Board = makeTable(8)
    const source = { q: 1, r: 3, s: -4 }
    const offset = hexUtilsGetNeighborForRotation(0)
    const destination = { q: 4, r: 3, s: -7 }
    const memberSource = {
      q: source.q + offset.q,
      r: source.r + offset.r,
      s: source.s + offset.s,
    }
    for (const coords of [source, memberSource, destination]) {
      const support = place({
        board,
        pieceID: 'g1',
        at: coords,
        altitude: 0,
      })
      if (support.error) throw new Error(support.error.message)
      board = support.board
    }
    board = placeEdgePiece(board, Pieces.battlement, 'GRABBED', source, 2, 1)
    board = placeEdgePiece(board, Pieces.roadWall, 'MEMBER', memberSource, 4, 1)
    const wallAt = {
      q: destination.q + offset.q,
      r: destination.r + offset.r,
      s: destination.s + offset.s,
    }
    const wall = place({
      board,
      pieceID: Pieces.castleWallStraight,
      at: wallAt,
      altitude: 0,
      uid: 'WALL',
    })
    if (wall.error) throw new Error(wall.error.message)
    board = wall.board
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'GRABBED')
    const pointerHex = hexAt(board, destination, 0)
    if (!grabbed || !pointerHex) throw new Error('castle group is incomplete')
    const group = getDraggableSelectionGroup(
      ['GRABBED', 'MEMBER'],
      grabbed.uid,
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable castle group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      grabbed,
      hexAt(board, destination, 1) ?? pointerHex,
      noOffset,
      group,
    )

    expect(
      target.members.find((member) => member.uid === 'GRABBED'),
    ).toMatchObject({ evaluation: { status: 'ok' } })
    expect(
      target.members.find((member) => member.uid === 'MEMBER'),
    ).toMatchObject({
      resolution: { blocked: 'notOnCastleWallTop' },
      evaluation: { status: 'blocked' },
    })
    expect(target.evaluation.status).toBe('blocked')
    expect(decideDrop(grabbed.uid, target)).toMatchObject({
      type: 'cancel',
      reason: 'notOnCastleWallTop',
    })
  })

  it('a single battlement still snaps to the nearest edge', () => {
    let board: Board = makeTable(8)
    board = placeEdgePiece(
      board,
      Pieces.battlement,
      'EDGE',
      { q: 1, r: 3, s: -4 },
      0,
    )
    const bp = board.boardPieces.find((piece) => piece.uid === 'EDGE')
    const destination = { q: 4, r: 3, s: -7 }
    const pointerHex = hexAt(board, destination, 0)
    if (!bp || !pointerHex) throw new Error('single battlement is missing')
    const nearestEdge = 2
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.battlement],
      bp,
      pointerHex,
      noOffset,
      [bp],
      edgePoint(destination, nearestEdge),
    )
    const resolvedTarget = requireResolved(target.resolution)

    expect(resolvedTarget.rotation).toBe((nearestEdge + 3) % 6)
    expect(target.members[0].edgeIndex).toBe(nearestEdge)
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

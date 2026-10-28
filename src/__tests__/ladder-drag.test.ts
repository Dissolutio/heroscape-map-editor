import { beforeEach, describe, expect, it } from 'vitest'
import {
  decideDrop,
  evaluateDragTarget,
  getDragTargetKey,
  getDraggableSelectionGroup,
} from '../data/dragMove'
import { applyPieceMoves } from '../data/movePieces'
import { rotateDragMembers } from '../data/dragRotation'
import { piecesSoFar } from '../data/pieces'
import { computeConflictedPieceUIDs } from '../data/rebuildBoardState'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../types'
import { HexTerrain, Pieces } from '../types'
import { HEXGRID_MAX_ALTITUDE } from '../utils/constants'
import { genBoardHexID } from '../utils/map-utils'
import { commitMoveDecision } from '../world/drag/dragController'
import { type Board, hexAt, makeTable, place } from './helpers/board'

const noOffset = { q: 0, r: 0, s: 0 }
const source = { q: 1, r: 3, s: -4 }
const destination = { q: 4, r: 3, s: -7 }

function placeChecked(
  board: Board,
  pieceID: string,
  at: CubeCoordinate,
  altitude: number,
  uid: string,
  rotation = 0,
): Board {
  const result = place({
    board,
    pieceID,
    at,
    altitude,
    uid,
    rotation,
  })
  if (result.error) throw new Error(result.error.message)
  return result.board
}

function ladderBoard(stackSize = 3, rotation = 1): Board {
  let board: Board = makeTable(8)
  const floorCoords = [
    source,
    destination,
    { q: 2, r: 4, s: -6 },
    { q: 5, r: 4, s: -9 },
  ]
  for (const coords of floorCoords) {
    board = placeChecked(
      board,
      'g1',
      coords,
      0,
      `FLOOR-${coords.q}-${coords.r}`,
    )
  }
  for (let index = 0; index < stackSize; index++) {
    board = placeChecked(
      board,
      Pieces.ladder,
      source,
      1 + index * 2,
      `L${index}`,
      rotation,
    )
  }
  return board
}

function requirePiece(board: Board, uid: string): BoardPiece {
  const piece = board.boardPieces.find((candidate) => candidate.uid === uid)
  if (!piece) throw new Error(`missing ladder fixture piece ${uid}`)
  return piece
}

function targetHex(board: Board, coords = destination, altitude = 1): BoardHex {
  const hex = hexAt(board, coords, altitude)
  if (!hex) throw new Error('ladder drag target is missing')
  return hex
}

function setStoreBoard(board: Board, selectedPieceIDs: string[] = []) {
  useBoundStore.setState({
    boardHexes: board.boardHexes,
    boardPieces: board.boardPieces,
    selectedPieceIDs,
    conflictedPieceUIDs: computeConflictedPieceUIDs(board.boardPieces),
    unsupportedPieceUIDs: [],
    viewingLevel: 0,
  })
  useBoundStore.temporal.getState().clear()
}

describe('ladder drag membership', () => {
  it.each([
    ['L0', ['L0', 'L1', 'L2']],
    ['L1', ['L1', 'L2']],
    ['L2', ['L2']],
  ])(
    'grabbing %s moves that ladder and every ladder above it',
    (uid, expected) => {
      const board = ladderBoard()
      const group = getDraggableSelectionGroup([uid], uid, board.boardPieces)
      expect(group?.map((member) => member.uid)).toEqual(expected)
    },
  )

  it('allows a single ladder and deduplicates explicitly selected stack members', () => {
    const singleBoard = ladderBoard(1)
    expect(
      getDraggableSelectionGroup(['L0'], 'L0', singleBoard.boardPieces)?.map(
        (member) => member.uid,
      ),
    ).toEqual(['L0'])

    const board = ladderBoard()
    const group = getDraggableSelectionGroup(
      ['L0', 'L1', 'L2'],
      'L1',
      board.boardPieces,
    )
    expect(group?.map((member) => member.uid)).toEqual(['L0', 'L1', 'L2'])
  })

  it('keeps the hovered ladder hex as the drag cache key', () => {
    const board = ladderBoard()
    const ladder = requirePiece(board, 'L0')
    const hoveredHex = targetHex(board, source, 2)
    expect(
      getDragTargetKey(piecesSoFar[Pieces.ladder], ladder, hoveredHex),
    ).toBe(hoveredHex.id)
  })
})

describe('ladder drag placement', () => {
  beforeEach(() => {
    useBoundStore.temporal.getState().clear()
  })

  it('moves a grabbed middle ladder and the part above, leaving the lower ladder supported', () => {
    const board = ladderBoard()
    const grabbed = requirePiece(board, 'L1')
    const group = getDraggableSelectionGroup(['L1'], 'L1', board.boardPieces)
    if (!group) throw new Error('expected ladder stack group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ladder],
      grabbed,
      targetHex(board),
      noOffset,
      group,
    )
    expect(target.evaluation.status).toBe('ok')
    expect(
      target.members.map(({ uid, resolution }) => ({
        uid,
        coords: 'blocked' in resolution ? null : resolution.coords,
        altitude: 'blocked' in resolution ? null : resolution.altitude,
        rotation: 'blocked' in resolution ? null : resolution.rotation,
      })),
    ).toEqual([
      { uid: 'L1', coords: destination, altitude: 1, rotation: 1 },
      {
        uid: 'L2',
        coords: destination,
        altitude: 3,
        rotation: 1,
      },
    ])

    const decision = decideDrop('L1', target)
    if (decision.type !== 'move') throw new Error('expected ladder group move')
    setStoreBoard(board, ['L1'])
    commitMoveDecision(decision)

    const moved = useBoundStore.getState()
    expect(moved.boardPieces).toContainEqual(
      expect.objectContaining({ uid: 'L0', pieceCoords: source, altitude: 1 }),
    )
    expect(moved.boardPieces).toContainEqual(
      expect.objectContaining({
        uid: 'L1',
        pieceCoords: destination,
        altitude: 1,
        rotation: 1,
      }),
    )
    expect(moved.boardPieces).toContainEqual(
      expect.objectContaining({
        uid: 'L2',
        pieceCoords: destination,
        altitude: 3,
        rotation: 1,
      }),
    )
    expect(hexAt(moved, source, 3)?.boardPieceUID).toBe('L0')
    expect(hexAt(moved, destination, 3)?.boardPieceUID).toBe('L1')
    expect(hexAt(moved, destination, 5)?.boardPieceUID).toBe('L2')
    expect(useBoundStore.getState().selectedPieceIDs).toEqual(['L1'])
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    const splitBoard: Board = {
      boardHexes: moved.boardHexes,
      boardPieces: moved.boardPieces,
    }
    expect(
      place({
        board: splitBoard,
        pieceID: Pieces.ladder,
        at: source,
        altitude: 3,
        uid: 'LEFT-CONTINUATION',
      }).error,
    ).toBeUndefined()
    expect(
      place({
        board: splitBoard,
        pieceID: Pieces.ladder,
        at: destination,
        altitude: 5,
        uid: 'MOVED-CONTINUATION',
      }).error,
    ).toBeUndefined()

    useBoundStore.temporal.getState().undo()
    expect(useBoundStore.getState().boardPieces).toEqual(board.boardPieces)
    expect(useBoundStore.getState().boardHexes).toEqual(board.boardHexes)
  })

  it('uses the pen ladder-stack altitude and rotation on another stack', () => {
    const board = ladderBoard(2)
    const targetBoard = placeChecked(
      board,
      Pieces.ladder,
      destination,
      1,
      'TARGET',
      4,
    )
    const grabbed = requirePiece(targetBoard, 'L0')
    const group = getDraggableSelectionGroup(
      ['L0'],
      'L0',
      targetBoard.boardPieces,
    )
    if (!group) throw new Error('expected ladder stack group')
    const ladderSurface = targetHex(targetBoard, destination, 2)
    const transformed = rotateDragMembers(group, grabbed.uid, noOffset, 3)
    const target = evaluateDragTarget(
      targetBoard,
      piecesSoFar[Pieces.ladder],
      transformed.bp,
      { ...ladderSurface, pieceRotation: 4 },
      transformed.grabOffset,
      transformed.members,
    )
    expect(target.resolution).toMatchObject({
      rule: 'ladderStack',
      coords: destination,
      altitude: 3,
      rotation: 4,
    })
    expect(target.evaluation.status).toBe('ok')
    expect(target.members.map((member) => member.resolution)).toMatchObject([
      { altitude: 3, rotation: 4 },
      { altitude: 5, rotation: 4 },
    ])

    const decision = decideDrop('L0', target)
    if (decision.type !== 'move') throw new Error('expected ladder group move')
    setStoreBoard(targetBoard, ['L0'])
    const before = structuredClone({
      boardHexes: targetBoard.boardHexes,
      boardPieces: targetBoard.boardPieces,
    })
    commitMoveDecision(decision)
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    expect(useBoundStore.getState().boardPieces).toContainEqual(
      expect.objectContaining({
        uid: 'TARGET',
        pieceCoords: destination,
        altitude: 1,
        rotation: 4,
      }),
    )
    expect(useBoundStore.getState().boardPieces).toContainEqual(
      expect.objectContaining({
        uid: 'L0',
        pieceCoords: destination,
        altitude: 3,
        rotation: 4,
      }),
    )
    expect(useBoundStore.getState().boardPieces).toContainEqual(
      expect.objectContaining({
        uid: 'L1',
        pieceCoords: destination,
        altitude: 5,
        rotation: 4,
      }),
    )

    useBoundStore.temporal.getState().undo()
    expect({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
    }).toEqual(before)
  })

  it('keeps mixed groups rigid when a ladder or a different piece is grabbed', () => {
    let board = ladderBoard(2)
    board = placeChecked(board, 'r1', { q: 2, r: 4, s: -6 }, 1, 'ROCK', 3)
    const ladder = requirePiece(board, 'L0')
    const rock = requirePiece(board, 'ROCK')
    const ladderGroup = getDraggableSelectionGroup(
      ['L0', 'ROCK'],
      'L0',
      board.boardPieces,
    )
    if (!ladderGroup) throw new Error('expected mixed ladder group')
    const ladderTarget = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ladder],
      ladder,
      targetHex(board),
      noOffset,
      ladderGroup,
    )
    expect(ladderTarget.evaluation.status).toBe('ok')
    expect(
      ladderTarget.members.find((member) => member.uid === 'ROCK'),
    ).toMatchObject({
      resolution: { coords: { q: 5, r: 4, s: -9 }, altitude: 1, rotation: 3 },
    })

    const rockGroup = getDraggableSelectionGroup(
      ['ROCK', 'L0'],
      'ROCK',
      board.boardPieces,
    )
    if (!rockGroup) throw new Error('expected mixed rock group')
    const rockTarget = evaluateDragTarget(
      board,
      piecesSoFar.r1,
      rock,
      targetHex(board, { q: 5, r: 4, s: -9 }),
      noOffset,
      rockGroup,
    )
    expect(rockTarget.members.map((member) => member.uid)).toEqual([
      'ROCK',
      'L0',
      'L1',
    ])
    expect(
      rockTarget.members.find((member) => member.uid === 'L0'),
    ).toMatchObject({
      resolution: { coords: { q: 4, r: 3, s: -7 }, altitude: 1, rotation: 1 },
    })
    expect(rockTarget.evaluation.status).toBe('ok')
  })

  it('blocks off-map, over-height, and castle-wall-top targets for the entire group', () => {
    const board = ladderBoard()
    const grabbed = requirePiece(board, 'L0')
    const group = getDraggableSelectionGroup(['L0'], 'L0', board.boardPieces)
    if (!group) throw new Error('expected ladder stack group')
    const surface = targetHex(board)

    const offMapCoords = { q: 100, r: 0, s: -100 }
    const offMapHex: BoardHex = {
      ...surface,
      ...offMapCoords,
      id: genBoardHexID({ ...offMapCoords, altitude: surface.altitude }),
      pieceID: '',
      inventoryID: '',
      terrain: HexTerrain.empty,
      boardPieceUID: undefined,
    }
    const offMap = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ladder],
      grabbed,
      offMapHex,
      noOffset,
      group,
    )
    expect(offMap.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'offMap',
    })
    expect(decideDrop('L0', offMap)).toMatchObject({
      type: 'cancel',
      reason: 'offMap',
    })

    const emptySurface = targetHex(board, { q: 3, r: 2, s: -5 }, 0)
    const highAltitude = HEXGRID_MAX_ALTITUDE - 2
    const highHex: BoardHex = {
      ...emptySurface,
      altitude: highAltitude,
      id: genBoardHexID({ ...emptySurface, altitude: highAltitude }),
    }
    const tooHigh = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ladder],
      grabbed,
      highHex,
      noOffset,
      group,
    )
    expect(tooHigh.resolution).toMatchObject({ altitude: highAltitude })
    expect(
      tooHigh.members.map((member) =>
        'blocked' in member.resolution ? null : member.resolution.altitude,
      ),
    ).toEqual([highAltitude, highAltitude + 2, highAltitude + 4])
    expect(tooHigh.members[1]?.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'outOfHeight',
    })
    expect(tooHigh.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'outOfHeight',
    })

    const castleCoords = { q: 3, r: 2, s: -5 }
    const wall = placeChecked(
      board,
      Pieces.castleWallStraight,
      castleCoords,
      0,
      'WALL',
    )
    const wallTop = targetHex(wall, castleCoords, 1)
    const wallGroup = getDraggableSelectionGroup(['L0'], 'L0', wall.boardPieces)
    if (!wallGroup) throw new Error('expected ladder group for castle test')
    const castleTop = evaluateDragTarget(
      wall,
      piecesSoFar[Pieces.ladder],
      requirePiece(wall, 'L0'),
      wallTop,
      noOffset,
      wallGroup,
    )
    expect(castleTop.resolution).toEqual({ blocked: 'notOnCastleWallTop' })
    expect(decideDrop('L0', castleTop)).toMatchObject({
      type: 'cancel',
      reason: 'notOnCastleWallTop',
    })
  })

  it('dropping onto its own ladder stack is a no-op with no history entry', () => {
    const board = ladderBoard(2)
    const top = requirePiece(board, 'L1')
    const lowerOrigin = targetHex(board, source, 2)
    const target = evaluateDragTarget(
      board,
      piecesSoFar[Pieces.ladder],
      top,
      lowerOrigin,
      noOffset,
      getDraggableSelectionGroup(['L1'], 'L1', board.boardPieces) ?? [],
    )
    expect(target.resolution).toMatchObject({
      rule: 'ladderStack',
      coords: source,
      altitude: 3,
      rotation: 1,
    })
    const decision = decideDrop('L1', target)
    if (decision.type !== 'move') throw new Error('expected no-op move')
    setStoreBoard(board, ['L1'])
    commitMoveDecision(decision)
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(0)
    expect(useBoundStore.getState().boardPieces).toEqual(board.boardPieces)
  })

  it('previews a ladder group from frozen board state without mutation', () => {
    const board = ladderBoard()
    const grabbed = requirePiece(board, 'L1')
    const pointer = targetHex(board)
    const before = structuredClone(board)
    const frozenBoard: Board = {
      ...board,
      boardHexes: Object.fromEntries(
        Object.entries(board.boardHexes).map(([id, hex]) => [
          id,
          Object.freeze({ ...hex }),
        ]),
      ),
      boardPieces: board.boardPieces.map((piece) =>
        Object.freeze({
          ...piece,
          pieceCoords: Object.freeze({ ...piece.pieceCoords }),
        }),
      ),
    }
    const frozenGrabbed = requirePiece(frozenBoard, 'L1')
    const group = getDraggableSelectionGroup(
      ['L1'],
      'L1',
      frozenBoard.boardPieces,
    )
    if (!group) throw new Error('expected frozen ladder group')

    const target = evaluateDragTarget(
      frozenBoard,
      piecesSoFar[Pieces.ladder],
      frozenGrabbed,
      pointer,
      noOffset,
      group,
    )
    expect(target.evaluation.status).toBe('ok')
    expect(board).toEqual(before)
    expect(grabbed).toEqual(frozenGrabbed)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ThreeEvent } from '@react-three/fiber'
import {
  accumulateWheelRotation,
  getLadderSectorRotation,
  initialWheelRotationAccumulator,
  rotateDragMembers,
  shouldRotateDragWithWheel,
  shortestRotationSteps,
  WHEEL_ROTATION_COOLDOWN_MS,
  WHEEL_ROTATION_IDLE_RESET_MS,
} from '../data/dragRotation'
import { decideDrop, evaluateDragTarget } from '../data/dragMove'
import { piecesSoFar } from '../data/pieces'
import { getLaurAddonFeaturePoint } from '../data/laurAddonPlacement'
import { getLaurAddonHitHex } from '../data/laurAddonStacking'
import type { BoardHex, BoardPiece } from '../types'
import { SELECT_PEN_MODE } from '../types'
import { HEX_DIRECTIONS, cubeToPixel } from '../utils/hex-utils'
import {
  commitMoveDecision,
  pressPieceForDrag,
} from '../world/drag/dragController'
import useBoundStore from '../store/store'
import { hexAt, makeTable, place, type Board } from './helpers/board'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const origin = { q: 0, r: 0, s: 0 }
const zeroOffset = { q: 0, r: 0, s: 0 }

function placePiece(
  board: ReturnType<typeof makeTable>,
  inventoryID: string,
  uid: string,
  at: { q: number; r: number; s: number },
  rotation = 0,
  altitude = 0,
) {
  const result = place({
    board,
    pieceID: inventoryID,
    uid,
    at,
    rotation,
    altitude,
    permissive: true,
  })
  if (result.error) throw new Error(String(result.error))
  const placed = result.board.boardPieces.find((piece) => piece.uid === uid)
  if (!placed) throw new Error(`Piece ${uid} was not added to the fixture`)
  return placed
}

describe('wheel rotation input', () => {
  it('accumulates wheel notches and normalizes line and page deltas', () => {
    let state = initialWheelRotationAccumulator
    let result = accumulateWheelRotation(state, {
      deltaY: 99,
      deltaMode: 0,
      time: 0,
    })
    expect(result.step).toBe(0)
    state = result.state
    result = accumulateWheelRotation(state, {
      deltaY: 1,
      deltaMode: 0,
      time: 1,
    })
    expect(result.step).toBe(1)

    result = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: 6,
      deltaMode: 1,
      time: 0,
    })
    expect(result.step).toBe(0)
    result = accumulateWheelRotation(result.state, {
      deltaY: 0.25,
      deltaMode: 1,
      time: 1,
    })
    expect(result.step).toBe(1)

    result = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: -1,
      deltaMode: 2,
      time: 0,
    })
    expect(result.step).toBe(-1)
  })

  it('limits inertia by cooldown and clears partial input after idle', () => {
    let result = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: 100,
      deltaMode: 0,
      time: 0,
    })
    expect(result.step).toBe(1)
    result = accumulateWheelRotation(result.state, {
      deltaY: 100,
      deltaMode: 0,
      time: 50,
    })
    expect(result.step).toBe(0)
    result = accumulateWheelRotation(result.state, {
      deltaY: 0,
      deltaMode: 0,
      time: WHEEL_ROTATION_COOLDOWN_MS,
    })
    expect(result.step).toBe(1)

    result = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: 60,
      deltaMode: 0,
      time: 0,
    })
    result = accumulateWheelRotation(result.state, {
      deltaY: 40,
      deltaMode: 0,
      time: WHEEL_ROTATION_IDLE_RESET_MS,
    })
    expect(result.step).toBe(0)
    expect(result.state.accumulatedPixels).toBe(40)
  })

  it('uses clockwise for wheel down and counter-clockwise for wheel up', () => {
    const down = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: 100,
      deltaMode: 0,
      time: 0,
    })
    const up = accumulateWheelRotation(initialWheelRotationAccumulator, {
      deltaY: -100,
      deltaMode: 0,
      time: 0,
    })
    expect(down.step).toBe(1)
    expect(up.step).toBe(-1)
  })
})

describe('ladder pointer sectors', () => {
  const pointerHex = {
    q: 0,
    r: 0,
    s: 0,
    altitude: 0,
  } as BoardHex

  it.each(Array.from({ length: 6 }, (_, rotation) => [rotation]))(
    'selects sector %i',
    (rotation) => {
      const center = cubeToPixel(origin)
      const neighborCenter = cubeToPixel(HEX_DIRECTIONS[rotation])
      const worldPoint = {
        x: (center.x + neighborCenter.x) / 2,
        z: (center.y + neighborCenter.y) / 2,
      }
      expect(getLadderSectorRotation(pointerHex, worldPoint, 0)).toBe(rotation)
    },
  )

  it('keeps the current rotation in the center dead zone', () => {
    expect(
      getLadderSectorRotation(pointerHex, { x: 0.1, z: 0.1 }, 4),
    ).toBeNull()
  })

  it('holds the current sector inside the hysteresis margin', () => {
    const east = cubeToPixel(HEX_DIRECTIONS[0])
    const northEast = cubeToPixel(HEX_DIRECTIONS[1])
    const midpoint = {
      x: (east.x + northEast.x) / 2,
      z: (east.y + northEast.y) / 2,
    }
    expect(getLadderSectorRotation(pointerHex, midpoint, 1)).toBe(1)
  })

  it.each([
    [0, 5, -1],
    [5, 0, 1],
    [0, 3, 3],
    [4, 1, 3],
  ])('takes the shortest rotation from %i to %i', (from, to, steps) => {
    expect(shortestRotationSteps(from, to)).toBe(steps)
  })
})

describe('drag rotation transforms', () => {
  it('rotates a mixed group around the grabbed piece and rotates the offset', () => {
    const board = makeTable(12)
    const grabbed = placePiece(board, 'g1', 'GRABBED', origin, 2)
    const other = placePiece(board, 'g1', 'OTHER', { q: 2, r: -1, s: -1 }, 4)
    const members = [grabbed, other]
    const rotated = rotateDragMembers(
      members,
      grabbed.uid,
      { q: 1, r: -1, s: 0 },
      1,
    )
    expect(rotated.bp.pieceCoords).toEqual(origin)
    expect(rotated.bp.rotation).toBe(3)
    expect(rotated.members[1].pieceCoords).toEqual({
      q: 1,
      r: 1,
      s: -2,
    })
    expect(rotated.members[1].rotation).toBe(5)
    expect(rotated.grabOffset).toEqual({ q: 1, r: 0, s: -1 })
  })

  it('returns all members to their original state after six steps', () => {
    const board = makeTable(12)
    const first = placePiece(board, 'g1', 'FIRST', origin, 5)
    const second = placePiece(board, 'g1', 'SECOND', { q: 2, r: -1, s: -1 }, 1)
    const members = [first, second]
    expect(
      rotateDragMembers(members, first.uid, zeroOffset, 6).members,
    ).toEqual(members)
  })

  it('commits a rotated group in one undo step and restores it exactly', () => {
    const table = makeTable(12)
    let board: Board = table
    for (const [uid, at] of [
      ['GRABBED', { q: 2, r: 2, s: -4 }],
      ['OTHER', { q: 3, r: 2, s: -5 }],
    ] as const) {
      const result = place({
        board,
        pieceID: 'g1',
        uid,
        at,
        altitude: 0,
        permissive: true,
      })
      if (result.error) throw new Error(String(result.error))
      board = result.board
    }
    const grabbed = board.boardPieces.find((piece) => piece.uid === 'GRABBED')
    const pointer = hexAt(board, table.center, 0)
    if (!grabbed || !pointer) throw new Error('Group fixture is incomplete')
    const transformed = rotateDragMembers(
      board.boardPieces,
      grabbed.uid,
      zeroOffset,
      1,
    )
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      transformed.bp,
      pointer,
      transformed.grabOffset,
      transformed.members,
    )
    const decision = decideDrop(grabbed.uid, target)
    if (decision.type !== 'move') throw new Error('Expected group move')
    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      unsupportedPieceUIDs: [],
      viewingLevel: 0,
    })
    useBoundStore.temporal.getState().clear()
    const before = structuredClone({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
    })

    commitMoveDecision(decision)
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    useBoundStore.temporal.getState().undo()
    expect(useBoundStore.getState()).toMatchObject(before)
  })

  it('uses the grabbed piece as the group pivot, not selection order', () => {
    const board = makeTable(12)
    const grabbed = placePiece(board, 'g1', 'GRABBED', origin)
    const lastSelected = placePiece(board, 'g1', 'LAST', { q: 2, r: -1, s: -1 })
    const rotated = rotateDragMembers(
      [lastSelected, grabbed],
      grabbed.uid,
      zeroOffset,
      1,
    )
    expect(rotated.bp.uid).toBe('GRABBED')
    expect(rotated.bp.pieceCoords).toEqual(origin)
    expect(
      rotated.members.find((piece) => piece.uid === 'LAST')?.pieceCoords,
    ).toEqual({ q: 1, r: 1, s: -2 })
  })

  it('does not rotate a single pointer-oriented piece with the wheel', () => {
    const battlement = piecesSoFar.bt
    const addon = piecesSoFar.lws
    const ladder = piecesSoFar.ld
    expect(shouldRotateDragWithWheel(battlement, 1)).toBe(false)
    expect(shouldRotateDragWithWheel(addon, 1)).toBe(false)
    expect(shouldRotateDragWithWheel(ladder, 1)).toBe(false)
  })

  it('allows a wheel step for a group grabbed by an edge piece', () => {
    expect(shouldRotateDragWithWheel(piecesSoFar.bt, 2)).toBe(true)
  })

  it('keeps the Laur add-on pointer-resolved rotation during evaluation', () => {
    let board: Board = makeTable(8)
    const pillarPlacement = place({
      board,
      pieceID: 'lwp',
      uid: 'PILLAR',
      at: { q: 4, r: 3, s: -7 },
      altitude: 0,
      permissive: true,
    })
    if (pillarPlacement.error) {
      throw new Error(String(pillarPlacement.error))
    }
    board = pillarPlacement.board
    const addonPlacement = place({
      board,
      pieceID: 'lws',
      uid: 'ADDON',
      at: { q: 1, r: 3, s: -4 },
      altitude: 0,
      permissive: true,
    })
    if (addonPlacement.error) throw new Error(String(addonPlacement.error))
    board = addonPlacement.board
    const pillar = board.boardPieces.find((piece) => piece.uid === 'PILLAR')
    const addon = board.boardPieces.find((piece) => piece.uid === 'ADDON')
    if (!pillar || !addon) throw new Error('Laur fixture is incomplete')
    const feature = getLaurAddonFeaturePoint(pillar.pieceCoords, 3)
    if (!feature) throw new Error('Laur pointer feature is missing')

    const target = evaluateDragTarget(
      board,
      piecesSoFar.lws,
      addon,
      getLaurAddonHitHex(pillar),
      zeroOffset,
      [addon],
      feature,
    )
    expect(shouldRotateDragWithWheel(piecesSoFar.lws, 1)).toBe(false)
    if ('blocked' in target.resolution) {
      throw new Error(
        `Laur add-on placement blocked: ${target.resolution.blocked}`,
      )
    }
    expect(target.resolution.rotation).toBe(3)
  })

  it('rotates a ladder stack once before placement evaluation', () => {
    const board = makeTable(12)
    const bottom = placePiece(board, 'ld', 'BOTTOM', origin, 2)
    const top = placePiece(board, 'ld', 'TOP', origin, 2, bottom.altitude + 1)
    const moved = rotateDragMembers([bottom, top], bottom.uid, zeroOffset, 1)
    expect(moved.members.map(({ rotation }) => rotation)).toEqual([3, 3])
    expect(moved.members.map(({ altitude }) => altitude)).toEqual([
      bottom.altitude,
      top.altitude,
    ])
  })

  it.each([
    ['g1', 0],
    ['g7', 0],
    ['r1', 1],
    ['y0', 1],
    ['z1', 0],
    ['lwp', 0],
  ])(
    'evaluates a one-step %s drag using its transformed rotation',
    (inventoryID, targetAltitude) => {
      const table = makeTable(12)
      const destination = table.center
      let board: Board = table
      const sourceResult = place({
        board,
        pieceID: inventoryID,
        uid: 'MOVED',
        at: { q: 1, r: 1, s: -2 },
        altitude: 0,
        permissive: true,
      })
      if (sourceResult.error) throw new Error(String(sourceResult.error))
      board = sourceResult.board
      const source = board.boardPieces.find((piece) => piece.uid === 'MOVED')
      if (!source) throw new Error('Moving piece is missing from fixture')
      if (inventoryID === 'r1' || inventoryID === 'y0') {
        const floor = place({
          board,
          pieceID: 'g1',
          uid: 'FLOOR',
          at: destination,
          altitude: 0,
          permissive: true,
        })
        if (floor.error) throw new Error(String(floor.error))
        board = floor.board
      }
      const pointerHex = hexAt(board, destination, targetAltitude)
      if (!pointerHex) throw new Error('Target pointer hex is missing')
      const transformed = rotateDragMembers([source], source.uid, zeroOffset, 1)
      const target = evaluateDragTarget(
        board,
        piecesSoFar[inventoryID],
        transformed.bp,
        pointerHex,
        transformed.grabOffset,
        transformed.members,
      )
      if ('blocked' in target.resolution) {
        throw new Error(
          `${inventoryID} placement blocked: ${target.resolution.blocked}`,
        )
      }
      expect(target.resolution.rotation).toBe(1)
      expect(target.evaluation.status).not.toBe('blocked')
    },
  )

  it('refuses a wheel-rotated footprint that would hang off the map', () => {
    const table = makeTable(6)
    const sourceResult = place({
      board: table,
      pieceID: 'g24',
      uid: 'MOVED',
      at: table.center,
      altitude: 0,
      permissive: true,
    })
    if (sourceResult.error) throw new Error(String(sourceResult.error))
    const source = sourceResult.board.boardPieces[0]
    const corner = hexAt(sourceResult.board, { q: 0, r: 0, s: 0 }, 0)
    if (!source || !corner) throw new Error('Off-map fixture is incomplete')
    const transformed = rotateDragMembers([source], source.uid, zeroOffset, 1)
    const target = evaluateDragTarget(
      sourceResult.board,
      piecesSoFar.g24,
      transformed.bp,
      corner,
      transformed.grabOffset,
      transformed.members,
    )
    expect(target.evaluation.status).toBe('blocked')
    expect(target.evaluation.reason).toBe('offMap')
    expect(decideDrop(source.uid, target).type).toBe('cancel')
  })

  it('allows a wheel-rotated move with a stationary-piece conflict', () => {
    const table = makeTable(8)
    const sourceResult = place({
      board: table,
      pieceID: 'r1',
      uid: 'MOVED',
      at: { q: 1, r: 2, s: -3 },
      altitude: 0,
      permissive: true,
    })
    if (sourceResult.error) throw new Error(String(sourceResult.error))
    const destination = table.center
    const floorResult = place({
      board: sourceResult.board,
      pieceID: 'g1',
      uid: 'FLOOR',
      at: destination,
      altitude: 0,
      permissive: true,
    })
    if (floorResult.error) throw new Error(String(floorResult.error))
    const occupiedResult = place({
      board: floorResult.board,
      pieceID: 'tr10',
      uid: 'STATIONARY',
      at: destination,
      altitude: 1,
      permissive: true,
    })
    if (occupiedResult.error) throw new Error(String(occupiedResult.error))
    const source = occupiedResult.board.boardPieces.find(
      (piece) => piece.uid === 'MOVED',
    )
    const pointer = hexAt(occupiedResult.board, destination, 1)
    if (!source || !pointer) throw new Error('Conflict fixture is incomplete')
    const transformed = rotateDragMembers([source], source.uid, zeroOffset, 1)
    const target = evaluateDragTarget(
      occupiedResult.board,
      piecesSoFar.r1,
      transformed.bp,
      pointer,
      transformed.grabOffset,
      transformed.members,
    )
    expect(target.evaluation.status).toBe('conflict')
    expect(decideDrop(source.uid, target).type).toBe('move')
  })

  it('rejects a missing rotation pivot rather than silently dropping members', () => {
    const member = {
      uid: 'MEMBER',
      pieceCoords: origin,
      rotation: 0,
    } as BoardPiece
    expect(() => rotateDragMembers([member], 'MISSING', zeroOffset, 1)).toThrow(
      'Rotation pivot MISSING',
    )
  })
})

describe('drag wheel listener lifecycle', () => {
  let windowTarget: EventTarget
  let removeListener: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    windowTarget = new EventTarget()
    vi.stubGlobal('window', windowTarget)
    removeListener = vi.spyOn(windowTarget, 'removeEventListener')

    const result = place({
      board: makeTable(8),
      pieceID: 'g1',
      uid: 'DRAG',
      at: { q: 2, r: 2, s: -4 },
      altitude: 0,
      permissive: true,
    })
    if (result.error) throw new Error(String(result.error))
    useBoundStore.setState({
      boardHexes: result.board.boardHexes,
      boardPieces: result.board.boardPieces,
      selectedPieceIDs: ['DRAG'],
      penMode: SELECT_PEN_MODE,
      isDraggingPiece: false,
      dragPreview: null,
    })
    useBoundStore.temporal.getState().clear()

    pressPieceForDrag(
      {
        button: 0,
        nativeEvent: { clientX: 0, clientY: 0 },
        point: { x: 0, y: 0, z: 0 },
        stopPropagation: vi.fn(),
      } as unknown as ThreeEvent<PointerEvent>,
      'DRAG',
    )
    const move = Object.assign(new Event('pointermove'), {
      clientX: 20,
      clientY: 0,
    })
    windowTarget.dispatchEvent(move)
  })

  afterEach(() => {
    const up = Object.assign(new Event('pointerup'), { button: 0 })
    windowTarget.dispatchEvent(up)
    windowTarget.dispatchEvent(new Event('click'))
    vi.unstubAllGlobals()
  })

  it.each(['release', 'escape', 'blur'])(
    'removes the wheel listener after %s',
    (exit) => {
      expect(removeListener).not.toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        true,
      )

      if (exit === 'escape') {
        windowTarget.dispatchEvent(
          Object.assign(new Event('keydown'), { key: 'Escape' }),
        )
      } else if (exit === 'blur') {
        windowTarget.dispatchEvent(new Event('blur'))
      } else {
        windowTarget.dispatchEvent(
          Object.assign(new Event('pointerup'), { button: 0 }),
        )
      }

      expect(removeListener).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        true,
      )
    },
  )
})

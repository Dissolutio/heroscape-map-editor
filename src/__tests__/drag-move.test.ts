/**
 * DRAG-TO-MOVE (data/dragMove.ts)
 *
 * The pure parts of dragging a selected piece to a new spot: which pieces
 * may be dragged, the press/drag/drop state machine (a press without
 * movement stays a click), the grab offset (the grabbed hex follows the
 * cursor, not the origin), the drop decision, and that drag state stays out
 * of undo history and autosave.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type DragEvent,
  type DragState,
  decideDrop,
  dragReducer,
  evaluateDragTarget,
  getDraggableSelectionGroup,
  getDragPreview,
  getDropPointerHex,
  getGrabOffset,
  initialDragState,
  isDraggablePiece,
  shouldSwallowRelease,
  worldToCube,
} from '../data/dragMove'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { getViewingLevelAfterPlacing } from '../store/map-slice'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../types'
import { PiecePrefixes } from '../types'
import { CLICK_DRAG_TOLERANCE_PX } from '../utils/constants'
import { cubeToPixel } from '../utils/hex-utils'
import { getSubterrainSize } from '../world/models/LandSubterrainInstanced'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
} from './helpers/board'
import { commitMoveDecision } from '../world/drag/dragController'

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

describe('isDraggablePiece', () => {
  it.each([
    'g1',
    'g24',
    'w1',
    'tr10',
    'rs2',
    'y0',
    'cws',
    'ca',
    'cbs',
    'sb',
    'sl',
  ])('%s can be dragged', (id) => {
    expect(isDraggablePiece(piecesSoFar[id])).toBe(true)
  })

  it.each([
    ['bt', 'battlement (edge piece)'],
    ['rw', 'road wall (edge piece)'],
    ['rl', 'rope ladder (edge piece)'],
    ['lws', 'Laur add-on'],
    ['z1', 'start zone'],
    ['ld', 'ladder'],
    ['lwp', 'Laur square pillar'],
    ['lwt', 'Laur triangle pillar'],
  ])('%s cannot: %s', (id) => {
    expect(isDraggablePiece(piecesSoFar[id])).toBe(false)
  })

  it('an unknown piece cannot', () => {
    expect(isDraggablePiece(undefined)).toBe(false)
  })
})

describe('worldToCube', () => {
  it('finds the hex under its own centre and points near it', () => {
    for (let q = -6; q <= 6; q++) {
      for (let r = -6; r <= 6; r++) {
        const hex = { q, r, s: -q - r + 0 } // + 0: no -0
        const { x, y } = cubeToPixel(hex)
        for (const [dx, dz] of [
          [0, 0],
          [0.4, 0],
          [-0.3, 0.3],
          [0, -0.45],
        ]) {
          expect(worldToCube(x + dx, y + dz)).toEqual(hex)
        }
      }
    }
  })
})

describe('grab offset', () => {
  const at = { q: 3, r: 4, s: -7 }
  const pieces = ['g2', 'g3', 'g7', 'g24', 'rs2', 'ca', 'sb']

  it.each(pieces)(
    '%s: the grabbed hex is the footprint hex under the press, at every rotation',
    (id) => {
      const piece = piecesSoFar[id]
      for (let rotation = 0; rotation < 6; rotation++) {
        const bp: BoardPiece = {
          uid: 'X',
          inventoryID: id,
          altitude: 1,
          rotation,
          pieceCoords: at,
        }
        const footprint = getPieceTemplateCoords({
          clickedHex: at,
          rotation,
          template: piece.template,
          isVsTile: false,
        })
        for (const [i, hex] of footprint.entries()) {
          const { x, y } = cubeToPixel(hex)
          const offset = getGrabOffset(piece, bp, { x: x + 0.2, z: y - 0.1 })
          expect(offset).toEqual({
            q: hex.q - at.q,
            r: hex.r - at.r,
            s: hex.s - at.s,
          })
          // drop with the pointer on some hex: the same footprint hex lands
          // under the pointer, so the piece does not jump to the cursor
          const pointer = { q: 6, r: 2, s: -8 }
          const pointerHex = { ...pointer, altitude: 1 } as BoardHex
          const dropHex = getDropPointerHex(pointerHex, offset, {})
          const moved = getPieceTemplateCoords({
            clickedHex: dropHex,
            rotation,
            template: piece.template,
            isVsTile: false,
          })
          expect(moved[i]).toEqual(pointer)
        }
      }
    },
  )

  it('a press beside the footprint picks the nearest footprint hex', () => {
    const piece = piecesSoFar.g2
    const bp: BoardPiece = {
      uid: 'X',
      inventoryID: 'g2',
      altitude: 1,
      rotation: 0,
      pieceCoords: at,
    }
    const footprint = getPieceTemplateCoords({
      clickedHex: at,
      rotation: 0,
      template: piece.template,
      isVsTile: false,
    })
    const { x, y } = cubeToPixel(footprint[1])
    // well outside the hex, past its far side
    const offset = getGrabOffset(piece, bp, { x: x + 3, z: y })
    expect(offset).toEqual({
      q: footprint[1].q - at.q,
      r: footprint[1].r - at.r,
      s: footprint[1].s - at.s,
    })
  })

  it('with no offset the pointer hex itself is used', () => {
    const pointerHex = { q: 1, r: 2, s: -3, altitude: 1 } as BoardHex
    expect(getDropPointerHex(pointerHex, { q: 0, r: 0, s: 0 }, {})).toBe(
      pointerHex,
    )
  })

  it('a shifted drop uses the board hex there when the altitude matches', () => {
    const table = makeTable(6)
    const pointer = hexAt(table, { q: 2, r: 2, s: -4 }, 0) as BoardHex
    const under = hexAt(table, { q: 1, r: 2, s: -3 }, 0)
    expect(
      getDropPointerHex(pointer, { q: 1, r: 0, s: -1 }, table.boardHexes),
    ).toBe(under)
  })
})

describe('dragReducer', () => {
  const press: DragEvent = {
    type: 'press',
    uid: 'R',
    x: 100,
    y: 100,
    grabOffset: { q: 0, r: 0, s: 0 },
  }
  const run = (events: DragEvent[], start: DragState = initialDragState) => {
    let state = start
    const outcomes = []
    for (const event of events) {
      const next = dragReducer(state, event)
      state = next.state
      outcomes.push(next.outcome.type)
    }
    return { state, outcomes }
  }
  const far = { type: 'move', x: 100 + CLICK_DRAG_TOLERANCE_PX + 1, y: 100 }

  it('a press and release without moving stays a click, not swallowed', () => {
    const pressed = dragReducer(initialDragState, press).state
    expect(shouldSwallowRelease(pressed)).toBe(false)
    const { state, outcomes } = run([press, { type: 'release' }])
    expect(outcomes).toEqual(['none', 'click'])
    expect(state).toEqual(initialDragState)
  })

  it('moving within the tolerance is still a click', () => {
    const { outcomes } = run([
      press,
      { type: 'move', x: 100 + CLICK_DRAG_TOLERANCE_PX, y: 100 },
      { type: 'move', x: 103, y: 104 },
      { type: 'release' },
    ])
    expect(outcomes).toEqual(['none', 'none', 'none', 'click'])
  })

  it('moving past the tolerance starts the drag once; the release drops once', () => {
    const { state, outcomes } = run([
      press,
      far as DragEvent,
      { type: 'move', x: 300, y: 250 },
      { type: 'release' },
      { type: 'release' },
    ])
    expect(outcomes).toEqual(['none', 'start', 'none', 'drop', 'none'])
    expect(state).toEqual(initialDragState)
  })

  it('swallows the release that ends a drag', () => {
    const dragging = run([press, far as DragEvent]).state
    expect(dragging.phase).toBe('dragging')
    expect(shouldSwallowRelease(dragging)).toBe(true)
  })

  it('a second press while dragging is ignored', () => {
    const dragging = run([press, far as DragEvent]).state
    const next = dragReducer(dragging, { ...press, uid: 'OTHER' } as DragEvent)
    expect(next.state).toBe(dragging)
    expect(next.outcome.type).toBe('none')
  })

  it.each(['escape', 'blur'] as const)(
    '%s cancels and swallows the coming release, which then clears',
    (reason) => {
      const { state, outcomes } = run([
        press,
        far as DragEvent,
        { type: 'cancel', reason },
      ])
      expect(outcomes).toEqual(['none', 'start', 'cancel'])
      expect(state).toEqual({ phase: 'idle', swallowRelease: true })
      expect(shouldSwallowRelease(state)).toBe(true)
      const after = dragReducer(state, { type: 'release' })
      expect(after.outcome.type).toBe('none') // no drop, no click
      expect(after.state).toEqual(initialDragState)
      expect(shouldSwallowRelease(after.state)).toBe(false)
    },
  )

  it('escape before moving also cancels the press (no click)', () => {
    const { outcomes, state } = run([
      press,
      { type: 'cancel', reason: 'escape' },
      { type: 'release' },
    ])
    expect(outcomes).toEqual(['none', 'cancel', 'none'])
    expect(state).toEqual(initialDragState)
  })

  it('a pointercancel ends the drag with nothing left to swallow', () => {
    const { state, outcomes } = run([
      press,
      far as DragEvent,
      { type: 'cancel', reason: 'pointercancel' },
    ])
    expect(outcomes).toEqual(['none', 'start', 'cancel'])
    expect(shouldSwallowRelease(state)).toBe(false)
  })

  it('a new press clears a stale swallow (its release never came)', () => {
    const stale: DragState = { phase: 'idle', swallowRelease: true }
    const next = dragReducer(stale, press)
    expect(next.state.phase).toBe('pressed')
    expect(shouldSwallowRelease(next.state)).toBe(false)
  })

  it('cancel and move do nothing when idle', () => {
    for (const event of [
      { type: 'cancel', reason: 'escape' },
      { type: 'move', x: 1, y: 1 },
    ] as DragEvent[]) {
      const next = dragReducer(initialDragState, event)
      expect(next.state).toBe(initialDragState)
      expect(next.outcome.type).toBe('none')
    }
  })
})

/** The e2e fixture: grass at (0,2), (1,2), (2,2), sand at (1,3), rock on (1,2). */
function fixtureBoard() {
  let board: Board = makeTable(6)
  const add = (
    id: string,
    at: CubeCoordinate,
    altitude: number,
    uid?: string,
  ) => {
    const result = place({ board, pieceID: id, at, altitude, uid })
    expect(result.error).toBeUndefined()
    board = result.board
  }
  add('g1', { q: 0, r: 2, s: -2 }, 0)
  add('g1', { q: 1, r: 2, s: -3 }, 0)
  add('g1', { q: 2, r: 2, s: -4 }, 0)
  add('s1', { q: 1, r: 3, s: -4 }, 0)
  add('r1', { q: 1, r: 2, s: -3 }, 1, 'ROCK')
  const rock = board.boardPieces.find((bp) => bp.uid === 'ROCK') as BoardPiece
  return { board, rock }
}
const noOffset = { q: 0, r: 0, s: 0 }

type GroupPieceSpec = {
  uid: string
  inventoryID: string
  q: number
  r: number
  rotation?: number
}

function groupBoard(specs: GroupPieceSpec[], size = 8): Board {
  let board: Board = makeTable(size)
  for (const { uid, inventoryID, q, r, rotation = 0 } of specs) {
    const result = place({
      board,
      pieceID: inventoryID,
      at: { q, r, s: -q - r },
      altitude: 0,
      rotation,
      uid,
    })
    expect(result.error).toBeUndefined()
    board = result.board
  }
  return board
}

describe('multi-selection drag', () => {
  it('starts only when the grabbed piece is in an all-draggable selection', () => {
    const draggable = [
      {
        uid: 'A',
        inventoryID: 'g1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 1, r: 2, s: -3 },
      },
      {
        uid: 'B',
        inventoryID: 'r1',
        altitude: 0,
        rotation: 0,
        pieceCoords: { q: 2, r: 2, s: -4 },
      },
    ]
    expect(getDraggableSelectionGroup(['A', 'B'], 'B', draggable)).toEqual(
      draggable,
    )
    expect(
      getDraggableSelectionGroup(['A', 'C'], 'A', [
        ...draggable,
        {
          uid: 'C',
          inventoryID: 'lws',
          altitude: 0,
          rotation: 0,
          pieceCoords: { q: 3, r: 2, s: -5 },
        },
      ]),
    ).toBeNull()
    expect(getDraggableSelectionGroup(['B'], 'A', draggable)).toBeNull()
  })

  it('applies one rigid delta to every member at all rotations', () => {
    for (let rotation = 0; rotation < 6; rotation++) {
      const board = groupBoard([
        { uid: 'MULTI', inventoryID: 'g2', q: 1, r: 3, rotation },
        { uid: 'OTHER', inventoryID: 'g1', q: 4, r: 3, rotation: 4 },
      ])
      const grabbed = board.boardPieces.find((bp) => bp.uid === 'MULTI')
      const pointer = hexAt(board, { q: 1, r: 2, s: -3 }, 0)
      if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
      const group = getDraggableSelectionGroup(
        ['MULTI', 'OTHER'],
        'MULTI',
        board.boardPieces,
      )
      if (!group) throw new Error('expected draggable group')
      const target = evaluateDragTarget(
        board,
        piecesSoFar.g2,
        grabbed,
        pointer,
        noOffset,
        group,
      )

      expect(target.evaluation.status).toBe('ok')
      expect(target.members.map((member) => member.resolution)).toMatchObject([
        {
          coords: { q: 1, r: 2, s: -3 },
          altitude: 0,
          rotation,
        },
        {
          coords: { q: 4, r: 2, s: -6 },
          altitude: 0,
          rotation: 4,
        },
      ])
      const oldFootprint = getPieceTemplateCoords({
        clickedHex: grabbed.pieceCoords,
        rotation,
        template: piecesSoFar.g2.template,
        isVsTile: false,
      })
      const moved = target.members[0].resolution
      if ('blocked' in moved) throw new Error('expected a placement')
      const newFootprint = getPieceTemplateCoords({
        clickedHex: moved.coords,
        rotation: moved.rotation,
        template: piecesSoFar.g2.template,
        isVsTile: false,
      })
      expect(newFootprint).toEqual(
        oldFootprint.map((hex) => ({
          q: hex.q,
          r: hex.r - 1,
          s: hex.s + 1,
        })),
      )
    }
  })

  it('keeps the grabbed multi-hex piece offset while shifting the group', () => {
    const board = groupBoard([
      { uid: 'MULTI', inventoryID: 'g2', q: 1, r: 3 },
      { uid: 'OTHER', inventoryID: 'g1', q: 4, r: 3 },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'MULTI')
    if (!grabbed) throw new Error('group fixture is incomplete')
    const footprint = getPieceTemplateCoords({
      clickedHex: grabbed.pieceCoords,
      rotation: grabbed.rotation,
      template: piecesSoFar.g2.template,
      isVsTile: false,
    })
    const grabbedHex = footprint[1]
    const pixel = cubeToPixel(grabbedHex)
    const grabOffset = getGrabOffset(piecesSoFar.g2, grabbed, {
      x: pixel.x,
      z: pixel.y,
    })
    const destination = { q: 2, r: 2, s: -4 }
    const pointerCoords = {
      q: destination.q + grabOffset.q,
      r: destination.r + grabOffset.r,
      s: destination.s + grabOffset.s,
    }
    const pointer = hexAt(board, pointerCoords, 0)
    if (!pointer) throw new Error('target fixture is off the map')
    const group = getDraggableSelectionGroup(
      ['MULTI', 'OTHER'],
      'MULTI',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g2,
      grabbed,
      pointer,
      grabOffset,
      group,
    )

    expect(target.members[0].resolution).toMatchObject({
      coords: destination,
      rotation: 0,
    })
    expect(target.members[0].evaluation.footprintHexes).toContainEqual(
      expect.objectContaining(pointerCoords),
    )
    expect(target.members[1].resolution).toMatchObject({
      coords: { q: 5, r: 2, s: -7 },
    })
  })

  it('does not treat another moving member at its old spot as a conflict', () => {
    const board = groupBoard([
      { uid: 'A', inventoryID: 'g1', q: 1, r: 3 },
      { uid: 'B', inventoryID: 'g1', q: 2, r: 3 },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'A')
    const pointer = hexAt(board, { q: 2, r: 3, s: -5 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(['A', 'B'], 'A', board.boardPieces)
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointer,
      noOffset,
      group,
    )

    expect(target.evaluation.status).toBe('ok')
    expect(target.evaluation.displacedUIDs).toEqual([])
    expect(target.members.map((member) => member.evaluation.status)).toEqual([
      'ok',
      'ok',
    ])
    expect(target.members.map((member) => member.resolution)).toMatchObject([
      { coords: { q: 2, r: 3, s: -5 } },
      { coords: { q: 3, r: 3, s: -6 } },
    ])
  })

  it('blocks the whole group when one member would hang off the map', () => {
    const board = groupBoard(
      [
        { uid: 'A', inventoryID: 'g1', q: 2, r: 3 },
        { uid: 'B', inventoryID: 'g1', q: 4, r: 3 },
      ],
      6,
    )
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'A')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(['A', 'B'], 'A', board.boardPieces)
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointer,
      noOffset,
      group,
    )

    expect(target.members.map((member) => member.evaluation.status)).toEqual([
      'ok',
      'blocked',
    ])
    expect(target.evaluation.status).toBe('blocked')
    expect(decideDrop('A', target)).toEqual({
      type: 'cancel',
      reason: 'offMap',
      message: 'That piece would hang off the edge of the map.',
    })
  })

  it('uses blocked over conflict and conflict over ok for group status', () => {
    const board = groupBoard(
      [
        { uid: 'A', inventoryID: 'g1', q: 1, r: 3 },
        { uid: 'B', inventoryID: 'g1', q: 2, r: 3 },
        { uid: 'C', inventoryID: 'g1', q: 4, r: 3 },
        { uid: 'STATIONARY', inventoryID: 'g1', q: 3, r: 3 },
      ],
      6,
    )
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'A')
    const pointer = hexAt(board, { q: 2, r: 3, s: -5 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['A', 'B', 'C'],
      'A',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointer,
      noOffset,
      group,
    )

    expect(target.members.map((member) => member.evaluation.status)).toEqual([
      'ok',
      'conflict',
      'blocked',
    ])
    expect(target.evaluation.status).toBe('blocked')
  })

  it('a stationary-piece conflict moves the group and is flagged in one undo step', () => {
    const board = groupBoard([
      { uid: 'A', inventoryID: 'g1', q: 1, r: 3 },
      { uid: 'B', inventoryID: 'g1', q: 2, r: 3 },
      { uid: 'STATIONARY', inventoryID: 'g1', q: 3, r: 3 },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'A')
    const pointer = hexAt(board, { q: 2, r: 3, s: -5 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(['A', 'B'], 'A', board.boardPieces)
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointer,
      noOffset,
      group,
    )
    const decision = decideDrop('A', target)
    if (decision.type !== 'move') throw new Error('expected a group move')

    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      viewingLevel: 0,
    })
    useBoundStore.temporal.getState().clear()
    const before = structuredClone({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
      viewingLevel: useBoundStore.getState().viewingLevel,
    })
    const movePieces = vi.spyOn(useBoundStore.getState(), 'movePieces')
    commitMoveDecision(decision)

    expect(target.evaluation.status).toBe('conflict')
    expect(target.members[1].evaluation.displacedUIDs).toContain('STATIONARY')
    expect(movePieces).toHaveBeenCalledTimes(1)
    expect(movePieces).toHaveBeenCalledWith({ moves: decision.moves })
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(1)
    expect(useBoundStore.getState().conflictedPieceUIDs).toContain('STATIONARY')
    expect(useBoundStore.getState().viewingLevel).toBe(1)

    useBoundStore.temporal.getState().undo()
    const undone = useBoundStore.getState()
    expect({
      boardHexes: undone.boardHexes,
      boardPieces: undone.boardPieces,
      viewingLevel: undone.viewingLevel,
    }).toEqual(before)
    movePieces.mockRestore()
  })

  it('a group preview adds no undo entry or autosave write', () => {
    const board = groupBoard([
      { uid: 'A', inventoryID: 'g1', q: 1, r: 3 },
      { uid: 'B', inventoryID: 'g1', q: 2, r: 3 },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'A')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(['A', 'B'], 'A', board.boardPieces)
    if (!group) throw new Error('expected draggable group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g1,
      grabbed,
      pointer,
      noOffset,
      group,
    )
    const preview = getDragPreview(grabbed, target)

    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      isDraggingPiece: false,
      dragPreview: null,
    })
    useBoundStore.temporal.getState().clear()
    const { boardPieces, boardHexes, hexMap } = useBoundStore.getState()
    useBoundStore.getState().setDragState(true, preview)
    useBoundStore.getState().setDragState(false, null)

    expect(preview.members).toHaveLength(2)
    expect(useBoundStore.temporal.getState().pastStates).toHaveLength(0)
    const after = useBoundStore.getState()
    expect(after.boardPieces).toBe(boardPieces)
    expect(after.boardHexes).toBe(boardHexes)
    expect(after.hexMap).toBe(hexMap)
  })
})

describe('drag target and drop decision', () => {
  it('over its own start hex the rock resolves back where it is, and is ok', () => {
    const { board, rock } = fixtureBoard()
    const before = cloneBoard(board)
    // the pointer passes through the rock to the grass under it
    const grass = hexAt(board, { q: 1, r: 2, s: -3 }, 1) as BoardHex
    expect(grass.terrain).toBe('grass')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.r1,
      rock,
      grass,
      noOffset,
    )
    expect(target.evaluation.status).toBe('ok')
    expect(decideDrop('ROCK', target)).toEqual({
      type: 'move',
      uid: 'ROCK',
      newPieceCoords: { q: 1, r: 2, s: -3 },
      newAltitude: 1,
      newRotation: 0,
    })
    expect(board).toEqual(before)
  })

  it('onto free grass: ok, moves there with smart altitude', () => {
    const { board, rock } = fixtureBoard()
    const grass = hexAt(board, { q: 0, r: 2, s: -2 }, 1) as BoardHex
    const target = evaluateDragTarget(
      board,
      piecesSoFar.r1,
      rock,
      grass,
      noOffset,
    )
    expect(target.evaluation.status).toBe('ok')
    expect(decideDrop('ROCK', target)).toMatchObject({
      type: 'move',
      newPieceCoords: { q: 0, r: 2, s: -2 },
      newAltitude: 1,
    })
    const preview = getDragPreview(rock, target)
    expect(preview).toMatchObject({
      uid: 'ROCK',
      status: 'ok',
      pointerHex: { q: 0, r: 2, s: -2, altitude: 1 },
      previewBp: { uid: 'ROCK', pieceCoords: { q: 0, r: 2, s: -2 } },
    })
  })

  it('a conflict still moves (it displaces and flags, like click placement)', () => {
    let { board, rock } = fixtureBoard()
    board = place({
      board,
      pieceID: 'tr10',
      at: { q: 2, r: 2, s: -4 },
      altitude: 1,
      uid: 'TREE',
    }).board
    // the hex the tree stands on, forced (pointer under the tree)
    const under = hexAt(board, { q: 2, r: 2, s: -4 }, 1) as BoardHex
    const target = evaluateDragTarget(
      board,
      piecesSoFar.r1,
      rock,
      under,
      noOffset,
    )
    expect(target.evaluation.status).toBe('conflict')
    expect(decideDrop('ROCK', target).type).toBe('move')
  })

  it('a target hanging off the map keeps its whole footprint, and the drop is refused', () => {
    const { board } = fixtureBoard()
    const before = cloneBoard(board)
    const g2: BoardPiece = {
      uid: 'G2',
      inventoryID: 'g2',
      altitude: 0,
      rotation: 3,
      pieceCoords: { q: 0, r: 2, s: -2 },
    }
    // at rotation 3 a g2 grabbed at its origin hangs off the west edge
    const edge = hexAt(board, { q: -1, r: 3, s: -2 }, 0) as BoardHex
    const target = evaluateDragTarget(board, piecesSoFar.g2, g2, edge, noOffset)
    expect(target.evaluation.status).toBe('blocked')
    expect(target.evaluation.reason).toBe('offMap')
    // both hexes, the one on the map and the one off it
    expect(target.evaluation.footprintHexes).toEqual([
      { q: -1, r: 3, s: -2, altitude: 0 },
      { q: -2, r: 3, s: -1, altitude: 0 },
    ])
    expect(hexAt(board, { q: -2, r: 3, s: -1 }, 0)).toBeUndefined()
    expect(decideDrop('G2', target)).toEqual({
      type: 'cancel',
      reason: 'offMap',
      message: 'That piece would hang off the edge of the map.',
    })
    // the preview knows where it would hang; DragPreview3D shows no ghost
    // for a blocked target, only the red footprint
    expect(getDragPreview(g2, target)).toMatchObject({
      status: 'blocked',
      reason: 'offMap',
      footprintHexes: target.evaluation.footprintHexes,
      previewBp: { pieceCoords: { q: -1, r: 3, s: -2 } },
    })
    expect(board).toEqual(before)
  })

  it('a g24 dropped on the corner shows all 24 hexes, off-map ones included', () => {
    const { board } = fixtureBoard()
    const g24: BoardPiece = {
      uid: 'G24',
      inventoryID: 'g24',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 2, r: 2, s: -4 },
    }
    const corner = hexAt(board, { q: 0, r: 0, s: 0 }, 0) as BoardHex
    const target = evaluateDragTarget(
      board,
      piecesSoFar.g24,
      g24,
      corner,
      noOffset,
    )
    expect(target.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'offMap',
    })
    const footprint = target.evaluation.footprintHexes
    expect(footprint).toHaveLength(24)
    expect(footprint.some((hex) => !hexAt(board, hex, 0))).toBe(true)
    expect(footprint.some((hex) => hexAt(board, hex, 0))).toBe(true)
    expect(decideDrop('G24', target).type).toBe('cancel')
  })

  it('no target (never over the map) cancels silently', () => {
    expect(decideDrop('ROCK', null)).toEqual({
      type: 'cancel',
      reason: 'noTarget',
    })
  })
})

describe('store: drag state and undo/autosave', () => {
  beforeEach(() => {
    const { board } = fixtureBoard()
    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      isDraggingPiece: false,
      dragPreview: null,
    })
    useBoundStore.temporal.getState().clear()
  })
  const history = () => useBoundStore.temporal.getState().pastStates.length

  it('drag state changes create no undo entries and leave the map alone', () => {
    const { boardPieces, boardHexes, hexMap } = useBoundStore.getState()
    const rock = boardPieces.find((bp) => bp.uid === 'ROCK') as BoardPiece
    const { setDragState } = useBoundStore.getState()
    setDragState(true, getDragPreview(rock, null))
    setDragState(true, { ...getDragPreview(rock, null), status: 'ok' })
    setDragState(false, null)
    expect(history()).toBe(0)
    const after = useBoundStore.getState()
    // the autosave gate watches exactly these two references
    expect(after.boardPieces).toBe(boardPieces)
    expect(after.hexMap).toBe(hexMap)
    expect(after.boardHexes).toBe(boardHexes)
  })

  it('a drop is one undo step, and undo puts the piece back', () => {
    const { board, rock } = fixtureBoard()
    const grass = hexAt(board, { q: 0, r: 2, s: -2 }, 1) as BoardHex
    const decision = decideDrop(
      'ROCK',
      evaluateDragTarget(board, piecesSoFar.r1, rock, grass, noOffset),
    )
    if (decision.type !== 'move') throw new Error('expected a move')
    const { type: _type, ...args } = decision
    useBoundStore.getState().movePiece(args)
    expect(history()).toBe(1)
    const moved = useBoundStore
      .getState()
      .boardPieces.find((bp) => bp.uid === 'ROCK')
    expect(moved?.pieceCoords).toEqual({ q: 0, r: 2, s: -2 })
    useBoundStore.temporal.getState().undo()
    const back = useBoundStore
      .getState()
      .boardPieces.find((bp) => bp.uid === 'ROCK')
    expect(back?.pieceCoords).toEqual({ q: 1, r: 2, s: -3 })
    expect(back?.altitude).toBe(1)
  })
})

describe('viewing level after a move', () => {
  const setUp = (viewingLevel: number) => {
    const { board } = fixtureBoard()
    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      viewingLevel,
    })
    useBoundStore.temporal.getState().clear()
  }
  const moveRock = (newAltitude: number) =>
    useBoundStore.getState().movePiece({
      uid: 'ROCK',
      newPieceCoords: { q: 2, r: 2, s: -4 },
      newAltitude,
    })
  const level = () => useBoundStore.getState().viewingLevel

  it('is the same rule paintTile always used', () => {
    // paintTile's original expression, before it became a shared helper
    const original = (viewingLevel: number, altitude: number) => {
      const placedAtLevel = altitude + 1
      return placedAtLevel > viewingLevel
        ? viewingLevel + (placedAtLevel - viewingLevel)
        : viewingLevel
    }
    for (const viewingLevel of [0, 1, 2, 3, 5, 9]) {
      for (const altitude of [0, 1, 2, 3, 4, 8, 12]) {
        expect(getViewingLevelAfterPlacing(viewingLevel, altitude)).toBe(
          original(viewingLevel, altitude),
        )
      }
    }
  })

  it('rises when the piece lands above the current level', () => {
    setUp(2)
    moveRock(4)
    expect(level()).toBe(5)
  })

  it.each([
    [5, 4, 'equal'],
    [8, 4, 'higher'],
  ])(
    'stays at %i when the piece lands at %i (level already %s)',
    (start, altitude) => {
      setUp(start)
      moveRock(altitude)
      expect(level()).toBe(start)
    },
  )

  it('never goes down when a piece moves down', () => {
    setUp(6)
    moveRock(0)
    expect(level()).toBe(6)
  })

  it('matches a click placement at the same altitude, through undo and redo', () => {
    const run = (act: () => void) => {
      setUp(1)
      act()
      const after = level()
      useBoundStore.temporal.getState().undo()
      const undone = level()
      useBoundStore.temporal.getState().redo()
      return { after, undone, redone: level() }
    }
    const moved = run(() => moveRock(4))
    const painted = run(() =>
      useBoundStore.getState().paintTile({
        piece: piecesSoFar.r1,
        clickedHexCoords: { q: 2, r: 2, s: -4 },
        altitude: 4,
        rotation: 0,
      }),
    )
    expect(moved).toEqual(painted)
    expect(moved.after).toBe(5)
  })
})

describe('land ghost mesh', () => {
  it('picks the same tile model the pen preview did for every land piece', () => {
    for (const piece of Object.values(piecesSoFar)) {
      if (!piece.landPrefix) continue
      // the pen preview keyed the mesh on its pen mode and size
      const penKey =
        piece.size === 6 && piece.landPrefix === PiecePrefixes.concrete
          ? '6B'
          : piece.size === 7 && piece.landPrefix === PiecePrefixes.wallWalk
            ? '7B'
            : `${piece.size}`
      expect(getSubterrainSize(piece.id), piece.id).toBe(penKey)
    }
  })
})

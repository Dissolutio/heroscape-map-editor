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
  getDragPreview,
  getDraggableSelectionGroup,
  getDragTargetKey,
  getDropPointerHex,
  getGrabOffset,
  initialDragState,
  isDraggablePiece,
  shouldSwallowRelease,
  worldToCube,
} from '../data/dragMove'
import { getLaurAddonFeaturePoint } from '../data/laurAddonPlacement'
import { getLaurAddonHitHex } from '../data/laurAddonStacking'
import { applyPieceMoves } from '../data/movePieces'
import { piecesSoFar } from '../data/pieces'
import getPieceTemplateCoords from '../data/rotationTransforms'
import { verticalObstructionTemplates } from '../data/vertical-obstruction-templates'
import { getViewingLevelAfterPlacing } from '../store/map-slice'
import useBoundStore from '../store/store'
import type { BoardHex, BoardPiece, CubeCoordinate } from '../types'
import { PiecePrefixes } from '../types'
import {
  CLICK_DRAG_TOLERANCE_PX,
  HEXGRID_MAX_ALTITUDE,
} from '../utils/constants'
import { cubeToPixel } from '../utils/hex-utils'
import { commitMoveDecision } from '../world/drag/dragController'
import { getSubterrainSize } from '../world/models/LandSubterrainInstanced'
import {
  type Board,
  cloneBoard,
  hexAt,
  makeTable,
  place,
} from './helpers/board'

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
    'lwp',
    'lwt',
    'lws',
    'bt',
    'rw',
    'rl',
  ])('%s can be dragged', (id) => {
    expect(isDraggablePiece(piecesSoFar[id])).toBe(true)
  })

  it('a start zone can be dragged', () => {
    expect(isDraggablePiece(piecesSoFar.z1)).toBe(true)
  })

  it.each([['ld', 'ladder']])('%s cannot: %s', (id) => {
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

  it('a Laur add-on follows the pointer-resolved side or vertex directly', () => {
    const piece = piecesSoFar.lws
    const bp: BoardPiece = {
      uid: 'ADDON',
      inventoryID: piece.id,
      altitude: 0,
      rotation: 0,
      pieceCoords: at,
    }
    const { x, y } = cubeToPixel(at)
    expect(getGrabOffset(piece, bp, { x: x + 0.5, z: y })).toEqual({
      q: 0,
      r: 0,
      s: 0,
    })
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
  altitude?: number
  rotation?: number
  permissive?: boolean
}

function groupBoard(specs: GroupPieceSpec[], size = 8): Board {
  let board: Board = makeTable(size)
  for (const {
    uid,
    inventoryID,
    q,
    r,
    altitude = 0,
    rotation = 0,
    permissive = false,
  } of specs) {
    const result = place({
      board,
      pieceID: inventoryID,
      at: { q, r, s: -q - r },
      altitude,
      rotation,
      uid,
      permissive,
    })
    expect(result.error).toBeUndefined()
    board = result.board
  }
  return board
}

describe('multi-selection drag', () => {
  it('blocks a group member dragged below altitude zero', () => {
    const board = groupBoard([
      { uid: 'LOW', inventoryID: 'g1', q: 1, r: 3 },
      {
        uid: 'HIGH',
        inventoryID: 'g1',
        q: 2,
        r: 3,
        altitude: 5,
        permissive: true,
      },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'HIGH')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!grabbed || !pointer) throw new Error('group fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['LOW', 'HIGH'],
      'HIGH',
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
    const low = target.members.find((member) => member.uid === 'LOW')
    if (!low) throw new Error('low member is missing')

    expect(low.resolution).toMatchObject({ altitude: -5 })
    expect(low.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'outOfHeight',
    })
    expect(target.evaluation.status).toBe('blocked')
    expect(decideDrop('HIGH', target)).toEqual({
      type: 'cancel',
      reason: 'outOfHeight',
      message:
        'Some pieces would end up below the ground or above the highest level.',
    })
  })

  it('blocks a member whose vertical obstruction rises above the maximum', () => {
    const board = groupBoard([
      { uid: 'GRAB', inventoryID: 'g1', q: 1, r: 3 },
      {
        uid: 'GLACIER',
        inventoryID: 'og4',
        q: 4,
        r: 3,
        permissive: true,
      },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'GRAB')
    const surface = hexAt(board, { q: 1, r: 2, s: -3 }, 0)
    if (!grabbed || !surface) throw new Error('group fixture is incomplete')
    const pointer = { ...surface, altitude: 90 }
    const group = getDraggableSelectionGroup(
      ['GRAB', 'GLACIER'],
      'GRAB',
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
    const glacier = target.members.find((member) => member.uid === 'GLACIER')
    if (!glacier) throw new Error('glacier member is missing')

    expect(glacier.resolution).toMatchObject({
      altitude: 90,
      piece: { height: 8 },
    })
    expect(glacier.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'outOfHeight',
    })
    const clearance = Math.max(
      piecesSoFar.og4.height,
      ...(verticalObstructionTemplates.og4 ?? []),
    )
    expect(90 + clearance).toBeGreaterThan(HEXGRID_MAX_ALTITUDE)
    expect(target.evaluation.status).toBe('blocked')
  })

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
    const addon = {
      uid: 'C',
      inventoryID: 'lws',
      altitude: 0,
      rotation: 0,
      pieceCoords: { q: 3, r: 2, s: -5 },
    }
    expect(
      getDraggableSelectionGroup(['A', 'C'], 'A', [...draggable, addon]),
    ).toEqual([draggable[0], addon])
    expect(
      getDraggableSelectionGroup(['A', 'C'], 'A', [
        ...draggable,
        { ...addon, inventoryID: 'ld' },
      ]),
    ).toBeNull()
    expect(getDraggableSelectionGroup(['B'], 'A', draggable)).toBeNull()
  })

  it('moves a start-zone group rigidly with other draggable families', () => {
    const board = groupBoard([
      { uid: 'ZONE', inventoryID: 'z1', q: 1, r: 3, rotation: 2 },
      { uid: 'ROCK', inventoryID: 'r1', q: 2, r: 2, rotation: 4 },
    ])
    const zone = board.boardPieces.find((bp) => bp.uid === 'ZONE')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!zone || !pointer) throw new Error('start-zone fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['ZONE', 'ROCK'],
      'ZONE',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable start-zone group')

    const target = evaluateDragTarget(
      board,
      piecesSoFar.z1,
      zone,
      pointer,
      noOffset,
      group,
    )
    expect(target.evaluation.status).toBe('ok')
    expect(target.members.map((member) => member.resolution)).toMatchObject([
      {
        coords: { q: 3, r: 3, s: -6 },
        altitude: 0,
        rotation: 2,
      },
      {
        coords: { q: 4, r: 2, s: -6 },
        altitude: 0,
        rotation: 4,
      },
    ])
    expect(getDragPreview(zone, target).members).toHaveLength(2)
  })

  it('blocks a start-zone group if a moved zone would duplicate a stationary one', () => {
    const board = groupBoard([
      { uid: 'MOVE1', inventoryID: 'z1', q: 1, r: 3 },
      { uid: 'MOVE2', inventoryID: 'z2', q: 2, r: 3 },
      { uid: 'STAY', inventoryID: 'z3', q: 3, r: 3 },
    ])
    const grabbed = board.boardPieces.find((bp) => bp.uid === 'MOVE1')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!grabbed || !pointer)
      throw new Error('duplicate start-zone fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['MOVE1', 'MOVE2'],
      'MOVE1',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable start-zone group')

    const target = evaluateDragTarget(
      board,
      piecesSoFar.z1,
      grabbed,
      pointer,
      noOffset,
      group,
    )
    expect(target.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'duplicateStartZone',
    })
    expect(decideDrop('MOVE1', target)).toEqual({
      type: 'cancel',
      reason: 'duplicateStartZone',
      message: 'A start zone is already on that hex.',
    })
    expect(board.boardPieces.map((bp) => bp.uid)).toEqual([
      'MOVE1',
      'MOVE2',
      'STAY',
    ])
  })

  it('previews a start-zone drag from frozen board state without mutation', () => {
    const board = groupBoard([
      { uid: 'ZONE', inventoryID: 'z1', q: 1, r: 3 },
      { uid: 'OTHER', inventoryID: 'g1', q: 2, r: 3 },
    ])
    const zone = board.boardPieces.find((bp) => bp.uid === 'ZONE')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!zone || !pointer)
      throw new Error('frozen start-zone fixture is incomplete')
    const before = structuredClone(board)
    const frozenBoard: Board = {
      ...board,
      boardHexes: Object.fromEntries(
        Object.entries(board.boardHexes).map(([id, hex]) => [
          id,
          Object.freeze({ ...hex }),
        ]),
      ),
      boardPieces: board.boardPieces.map((bp) =>
        Object.freeze({
          ...bp,
          pieceCoords: Object.freeze({ ...bp.pieceCoords }),
        }),
      ),
    }

    const target = evaluateDragTarget(
      frozenBoard,
      piecesSoFar.z1,
      zone,
      pointer,
      noOffset,
      frozenBoard.boardPieces,
    )

    expect(target.evaluation.status).toBe('ok')
    expect(board).toEqual(before)
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
  const worldPointAt = (coords: CubeCoordinate) => {
    const { x, y } = cubeToPixel(coords)
    return { x, z: y }
  }

  it('an add-on follows the pointer to a matching pillar port', () => {
    const board = groupBoard([
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
      { uid: 'PILLAR', inventoryID: 'lwp', q: 4, r: 3 },
      { uid: 'FAR', inventoryID: 'lwp', q: 5, r: 3 },
    ])
    const addon = board.boardPieces.find((bp) => bp.uid === 'ADDON')
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    if (!addon || !pillar) throw new Error('Laur fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lws,
      addon,
      getLaurAddonHitHex(pillar),
      noOffset,
      [addon],
      worldPointAt(pillar.pieceCoords),
    )

    expect(target.resolution).toMatchObject({
      coords: pillar.pieceCoords,
      altitude: pillar.altitude,
      rotation: 0,
      rule: 'laurAddon',
    })
    expect(target.members[0]).toMatchObject({
      evaluation: { status: 'ok' },
      unsupported: false,
    })
    expect(decideDrop('ADDON', target)).toMatchObject({
      type: 'move',
      newPieceCoords: pillar.pieceCoords,
      newAltitude: pillar.altitude,
      newRotation: 0,
    })
  })

  it('an add-on pointer point selects the nearest allowed pillar port', () => {
    const board = groupBoard([
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
      { uid: 'PILLAR', inventoryID: 'lwp', q: 4, r: 3 },
      { uid: 'FAR', inventoryID: 'lwp', q: 3, r: 3 },
    ])
    const addon = board.boardPieces.find((bp) => bp.uid === 'ADDON')
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    if (!addon || !pillar) throw new Error('Laur fixture is incomplete')
    const feature = getLaurAddonFeaturePoint(pillar.pieceCoords, 3)
    if (!feature) throw new Error('Laur side feature is missing')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lws,
      addon,
      getLaurAddonHitHex(pillar),
      noOffset,
      [addon],
      feature,
    )

    expect(target.resolution).toMatchObject({
      coords: pillar.pieceCoords,
      altitude: pillar.altitude,
      rotation: 3,
      rule: 'laurAddon',
    })
    expect(target.members[0]).toMatchObject({
      evaluation: { status: 'ok' },
      unsupported: false,
    })
  })

  it('an add-on lands on an empty hex permissively and is marked unsupported', () => {
    const board = groupBoard([{ uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 }])
    const addon = board.boardPieces[0]
    const destination = { q: 4, r: 3, s: -7 }
    const targetHex = hexAt(board, destination, 0)
    if (!targetHex) throw new Error('empty destination is missing')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lws,
      addon,
      targetHex,
      noOffset,
      [addon],
      worldPointAt(destination),
    )

    expect(target.evaluation.status).toBe('ok')
    expect(target.resolution).toMatchObject({
      coords: destination,
      altitude: 0,
      rotation: addon.rotation,
      rule: 'laurAddon',
    })
    expect(target.members[0].unsupported).toBe(true)
    expect(decideDrop('ADDON', target).type).toBe('move')
  })

  it('an add-on lands on land and reports conflict plus unsupported state', () => {
    const board = groupBoard([
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
      { uid: 'LAND', inventoryID: 'g1', q: 4, r: 3 },
    ])
    const addon = board.boardPieces.find((bp) => bp.uid === 'ADDON')
    const destination = { q: 4, r: 3, s: -7 }
    const surface = hexAt(board, destination, 1)
    if (!addon || !surface) throw new Error('land destination is missing')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lws,
      addon,
      surface,
      noOffset,
      [addon],
      worldPointAt(destination),
    )

    expect(target.evaluation.status).toBe('conflict')
    expect(target.resolution).toMatchObject({
      coords: destination,
      altitude: 1,
      rule: 'laurAddon',
    })
    expect(target.members[0].unsupported).toBe(true)
    expect(decideDrop('ADDON', target).type).toBe('move')
  })

  it('a conflicted add-on can preview a drag from frozen store state', () => {
    const board = groupBoard([
      { uid: 'ADDON', inventoryID: 'lwr', q: 3, r: 3 },
      { uid: 'LAND', inventoryID: 'g1', q: 4, r: 3 },
    ])
    const addon = board.boardPieces.find((bp) => bp.uid === 'ADDON')
    const destination = { q: 2, r: 4, s: -6 }
    const targetHex = hexAt(board, destination, 0)
    if (!addon || !targetHex)
      throw new Error('conflicted add-on fixture missing')

    const before = structuredClone(board)
    const frozenBoard: Board = {
      ...board,
      boardHexes: Object.fromEntries(
        Object.entries(board.boardHexes).map(([id, hex]) => [
          id,
          Object.freeze({ ...hex }),
        ]),
      ),
    }
    const target = evaluateDragTarget(
      frozenBoard,
      piecesSoFar.lwr,
      addon,
      targetHex,
      noOffset,
      [addon],
      worldPointAt(destination),
    )

    expect(target.resolution).toMatchObject({ coords: destination })
    expect(target.members[0].unsupported).toBe(true)
    expect(board).toEqual(before)
  })

  it('a pillar lands on empty land with smart altitude', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'LAND', inventoryID: 'g1', q: 4, r: 3 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const destination = { q: 4, r: 3, s: -7 }
    const surface = hexAt(board, destination, 1)
    if (!pillar || !surface) throw new Error('land destination is missing')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      surface,
      noOffset,
    )

    expect(target.resolution).toMatchObject({
      coords: destination,
      altitude: 1,
    })
    expect(target.evaluation.status).toBe('ok')
    expect(decideDrop('PILLAR', target).type).toBe('move')
  })

  it('a pillar stacks on a matching pillar at +8 with its rotation', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'TARGET', inventoryID: 'lwp', q: 4, r: 3, rotation: 2 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const targetPillar = board.boardPieces.find((bp) => bp.uid === 'TARGET')
    if (!pillar || !targetPillar)
      throw new Error('pillar fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      getLaurAddonHitHex(targetPillar),
      noOffset,
    )

    expect(target.resolution).toMatchObject({
      coords: targetPillar.pieceCoords,
      altitude: targetPillar.altitude + 8,
      rotation: targetPillar.rotation,
      rule: 'pillarStack',
    })
    expect(target.evaluation.status).toBe('ok')
    expect(decideDrop('PILLAR', target).type).toBe('move')
  })

  it('a pillar refuses to stack on a mismatched-shape pillar', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'TARGET', inventoryID: 'lwt', q: 4, r: 3 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const targetPillar = board.boardPieces.find((bp) => bp.uid === 'TARGET')
    if (!pillar || !targetPillar)
      throw new Error('pillar fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      getLaurAddonHitHex(targetPillar),
      noOffset,
    )

    expect(target.resolution).toEqual({ blocked: 'pillarShapesDiffer' })
    expect(decideDrop('PILLAR', target)).toMatchObject({
      type: 'cancel',
      reason: 'pillarShapesDiffer',
    })
  })

  it('moving a pillar leaves its add-on behind and makes it unsupported', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'FAR', inventoryID: 'lwp', q: 2, r: 3 },
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const destination = { q: 4, r: 3, s: -7 }
    const pointer = hexAt(board, destination, 0)
    if (!pillar || !pointer) throw new Error('Laur fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      pointer,
      noOffset,
    )
    const decision = decideDrop('PILLAR', target)
    if (decision.type !== 'move') throw new Error('expected a pillar move')
    const moved = applyPieceMoves(
      { ...board, conflictedPieceUIDs: [] },
      decision.moves ?? [
        {
          uid: decision.uid,
          newPieceCoords: decision.newPieceCoords,
          newAltitude: decision.newAltitude,
          newRotation: decision.newRotation,
        },
      ],
    )

    expect(moved?.boardPieces.find((bp) => bp.uid === 'ADDON')).toMatchObject({
      pieceCoords: { q: 1, r: 3, s: -4 },
      inventoryID: 'lws',
    })
    expect(moved?.unsupportedPieceUIDs).toContain('ADDON')
  })

  it('a mixed pillar-and-add-on group moves rigidly without self-conflicts', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'FAR', inventoryID: 'lwp', q: 2, r: 3 },
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const destination = { q: 4, r: 3, s: -7 }
    const pointer = hexAt(board, destination, 0)
    if (!pillar || !pointer) throw new Error('Laur fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['PILLAR', 'FAR', 'ADDON'],
      'PILLAR',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable Laur group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      pointer,
      noOffset,
      group,
    )
    const addon = target.members.find((member) => member.uid === 'ADDON')

    expect(target.evaluation.status).toBe('ok')
    expect(target.members.map((member) => member.evaluation.status)).toEqual([
      'ok',
      'ok',
      'ok',
    ])
    expect(addon).toMatchObject({
      resolution: {
        coords: { q: 4, r: 3, s: -7 },
        altitude: 0,
        rotation: 0,
        rule: 'default',
      },
      unsupported: false,
    })
    expect(target.evaluation.displacedUIDs).toEqual([])
    expect(decideDrop('PILLAR', target)).toMatchObject({
      type: 'move',
      moves: expect.arrayContaining([
        expect.objectContaining({
          uid: 'ADDON',
          newPieceCoords: destination,
          newRotation: 0,
        }),
      ]),
    })
  })

  it('blocks a group when an add-on member exceeds the height bounds', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'ADDON', inventoryID: 'lws', q: 2, r: 3, altitude: 80 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const destination = { q: 4, r: 3, s: -7 }
    const tableHex = hexAt(board, destination, 0)
    if (!pillar || !tableHex) throw new Error('Laur fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['PILLAR', 'ADDON'],
      'PILLAR',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable Laur group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.lwp,
      pillar,
      { ...tableHex, altitude: 10 },
      noOffset,
      group,
    )
    const addon = target.members.find((member) => member.uid === 'ADDON')

    expect(addon?.evaluation).toMatchObject({
      status: 'blocked',
      reason: 'outOfHeight',
    })
    expect(decideDrop('PILLAR', target)).toMatchObject({
      type: 'cancel',
      reason: 'outOfHeight',
    })
  })

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

  it('a start-zone group drop is one undo step and undo restores the group', () => {
    const board = groupBoard([
      { uid: 'ZONE', inventoryID: 'z1', q: 1, r: 3 },
      { uid: 'ROCK', inventoryID: 'r1', q: 2, r: 2 },
    ])
    const zone = board.boardPieces.find((bp) => bp.uid === 'ZONE')
    const pointer = hexAt(board, { q: 3, r: 3, s: -6 }, 0)
    if (!zone || !pointer) throw new Error('start-zone fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['ZONE', 'ROCK'],
      'ZONE',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable start-zone group')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.z1,
      zone,
      pointer,
      noOffset,
      group,
    )
    const decision = decideDrop('ZONE', target)
    if (decision.type !== 'move') throw new Error('expected a group move')

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
    expect(history()).toBe(1)
    expect(useBoundStore.getState().boardPieces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: 'ZONE',
          pieceCoords: { q: 3, r: 3, s: -6 },
        }),
        expect.objectContaining({
          uid: 'ROCK',
          pieceCoords: { q: 4, r: 2, s: -6 },
        }),
      ]),
    )

    useBoundStore.temporal.getState().undo()
    expect(history()).toBe(0)
    expect(useBoundStore.getState()).toMatchObject(before)
  })

  it('dropping a start zone on its own hex records no undo entry', () => {
    const board = groupBoard([
      { uid: 'ZONE', inventoryID: 'z1', q: 1, r: 3 },
      { uid: 'ROCK', inventoryID: 'r1', q: 2, r: 2 },
    ])
    const zone = board.boardPieces.find((bp) => bp.uid === 'ZONE')
    const pointer = hexAt(board, { q: 1, r: 3, s: -4 }, 0)
    if (!zone || !pointer) throw new Error('start-zone fixture is incomplete')
    const target = evaluateDragTarget(
      board,
      piecesSoFar.z1,
      zone,
      pointer,
      noOffset,
    )
    const decision = decideDrop('ZONE', target)
    if (decision.type !== 'move') throw new Error('expected a start-zone move')

    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      unsupportedPieceUIDs: [],
      viewingLevel: 0,
    })
    useBoundStore.temporal.getState().clear()
    commitMoveDecision(decision)
    expect(history()).toBe(0)
  })

  it('a mixed Laur group drop is one undo step and restores all derived state', () => {
    const board = groupBoard([
      { uid: 'PILLAR', inventoryID: 'lwp', q: 1, r: 3 },
      { uid: 'FAR', inventoryID: 'lwp', q: 2, r: 3 },
      { uid: 'ADDON', inventoryID: 'lws', q: 1, r: 3 },
    ])
    const pillar = board.boardPieces.find((bp) => bp.uid === 'PILLAR')
    const pointer = hexAt(board, { q: 4, r: 3, s: -7 }, 0)
    if (!pillar || !pointer) throw new Error('Laur fixture is incomplete')
    const group = getDraggableSelectionGroup(
      ['PILLAR', 'FAR', 'ADDON'],
      'PILLAR',
      board.boardPieces,
    )
    if (!group) throw new Error('expected draggable Laur group')
    const decision = decideDrop(
      'PILLAR',
      evaluateDragTarget(
        board,
        piecesSoFar.lwp,
        pillar,
        pointer,
        noOffset,
        group,
      ),
    )
    if (decision.type !== 'move') throw new Error('expected a group move')

    useBoundStore.setState({
      boardHexes: board.boardHexes,
      boardPieces: board.boardPieces,
      conflictedPieceUIDs: [],
      unsupportedPieceUIDs: [],
      viewingLevel: 0,
    })
    useBoundStore.temporal.getState().clear()
    const before = structuredClone({
      boardHexes: useBoundStore.getState().boardHexes,
      boardPieces: useBoundStore.getState().boardPieces,
      conflictedPieceUIDs: useBoundStore.getState().conflictedPieceUIDs,
      unsupportedPieceUIDs: useBoundStore.getState().unsupportedPieceUIDs,
      viewingLevel: useBoundStore.getState().viewingLevel,
    })

    commitMoveDecision(decision)
    expect(history()).toBe(1)
    expect(useBoundStore.getState().unsupportedPieceUIDs).toEqual([])
    expect(useBoundStore.getState().conflictedPieceUIDs).toEqual([])

    useBoundStore.temporal.getState().undo()
    const undone = useBoundStore.getState()
    expect({
      boardHexes: undone.boardHexes,
      boardPieces: undone.boardPieces,
      conflictedPieceUIDs: undone.conflictedPieceUIDs,
      unsupportedPieceUIDs: undone.unsupportedPieceUIDs,
      viewingLevel: undone.viewingLevel,
    }).toEqual(before)
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

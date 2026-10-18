import type { BoardHex, BoardPiece, CubeCoordinate, Piece } from '../types'
import { HexTerrain } from '../types'
import { CLICK_DRAG_TOLERANCE_PX, HEXGRID_HEX_RADIUS } from '../utils/constants'
import { cubeToPixel } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import {
  type PlacementBlockedReason,
  type PlacementBoard,
  type PlacementEvaluation,
  type PlacementResolution,
  evaluatePlacement,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from './placement'
import getPieceTemplateCoords from './rotationTransforms'

/**
 * Drag-to-move for a piece already on the board: the pure parts (which
 * pieces may be dragged, the press/drag/drop state machine, the grab offset
 * and the drop decision). The pointer and camera wiring lives in
 * world/drag/dragController.ts.
 */

/**
 * Pieces with no hexes of their own (they live only in boardPieces and sit
 * on an edge or an overlay), plus pieces whose placement depends on what
 * they are attached to. Dragging these needs edge coordinates; not yet.
 */
const NOT_DRAGGABLE_TERRAINS: string[] = [
  HexTerrain.startZone,
  HexTerrain.battlement,
  HexTerrain.roadWall,
  HexTerrain.ropeLadder,
  HexTerrain.laurWallAddon,
  HexTerrain.ladder, // hangs on a wall face
  HexTerrain.laurWall, // Laur pillars: their add-ons would be left behind
]

export const isDraggablePiece = (piece: Piece | undefined): piece is Piece =>
  !!piece && !NOT_DRAGGABLE_TERRAINS.includes(piece.terrain)

/** The hex (cube coordinates) under a point on the ground plane. */
export function worldToCube(x: number, z: number): CubeCoordinate {
  const q = ((Math.sqrt(3) / 3) * x - z / 3) / HEXGRID_HEX_RADIUS
  const r = ((2 / 3) * z) / HEXGRID_HEX_RADIUS
  return cubeRound(q, r, -q - r)
}

function cubeRound(q: number, r: number, s: number): CubeCoordinate {
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  else rs = -rq - rr
  // avoid -0, so offsets compare equal with toEqual
  return { q: rq + 0, r: rr + 0, s: rs + 0 }
}

const subtract = (a: CubeCoordinate, b: CubeCoordinate): CubeCoordinate => ({
  q: a.q - b.q,
  r: a.r - b.r,
  s: a.s - b.s,
})

/**
 * Which hex of the piece was grabbed, relative to its origin. `point` is
 * where the press hit the piece (world x/z); the grabbed hex is the
 * footprint hex closest to it, so a press on a tile's side still counts.
 */
export function getGrabOffset(
  piece: Piece,
  bp: BoardPiece,
  point: { x: number; z: number },
): CubeCoordinate {
  const footprint = getPieceTemplateCoords({
    clickedHex: bp.pieceCoords,
    rotation: bp.rotation,
    template: piece.template,
    isVsTile: false,
  })
  let grabbed = footprint[0] ?? bp.pieceCoords
  let best = Number.POSITIVE_INFINITY
  for (const hex of footprint) {
    const { x, y } = cubeToPixel(hex)
    const distance = Math.hypot(x - point.x, y - point.z)
    if (distance < best) {
      best = distance
      grabbed = hex
    }
  }
  return subtract(grabbed, bp.pieceCoords)
}

/**
 * The hex to resolve a drop on: the pointer hex shifted back by the grab
 * offset, so the grabbed hex (not the origin) follows the cursor. Uses the
 * board hex at that spot and altitude when there is one; otherwise the
 * pointer hex moved there, as a plain surface (no piece of its own).
 */
export function getDropPointerHex(
  pointerHex: BoardHex,
  grabOffset: CubeCoordinate,
  boardHexes: PlacementBoard['boardHexes'],
): BoardHex {
  if (!grabOffset.q && !grabOffset.r) return pointerHex
  const coords = subtract(pointerHex, grabOffset)
  const id = genBoardHexID({ ...coords, altitude: pointerHex.altitude })
  return (
    boardHexes[id] ?? {
      ...pointerHex,
      ...coords,
      id,
      pieceID: '',
      inventoryID: '',
      boardPieceUID: undefined,
    }
  )
}

export type DragTarget = {
  /** The hex under the pointer (not shifted by the grab offset). */
  pointerHex: BoardHex
  resolution: PlacementResolution
  evaluation: PlacementEvaluation
}

/**
 * Where the dragged piece would land with the pointer on `pointerHex`: the
 * same resolver and evaluator as pen placement (smart altitude included),
 * leaving the piece itself out so it does not collide with where it is now.
 * It keeps its rotation. A target hanging off the map evaluates as blocked
 * (offMap) with its full footprint, off-map hexes included.
 */
export function evaluateDragTarget(
  board: PlacementBoard,
  piece: Piece,
  bp: BoardPiece,
  pointerHex: BoardHex,
  grabOffset: CubeCoordinate,
): DragTarget {
  const dropHex = getDropPointerHex(pointerHex, grabOffset, board.boardHexes)
  // Like the pen hover, resolve a target that hangs off the map anyway, so
  // its whole footprint shows; evaluatePlacement still blocks it (offMap).
  const resolution = resolvePlacement(piece, dropHex, bp.rotation, board, {
    ignoreUID: bp.uid,
    deferOffMapCheck: true,
  })
  const evaluation = evaluatePlacement(board, resolution, {
    ignoreUID: bp.uid,
  })
  return { pointerHex, resolution, evaluation }
}

export type DropDecision =
  | {
      type: 'move'
      uid: string
      newPieceCoords: CubeCoordinate
      newAltitude: number
      newRotation: number
    }
  | {
      type: 'cancel'
      /** A PlacementBlockedReason, or 'noTarget' (never over the map). */
      reason: string
      /** What to tell the user, if anything. */
      message?: string
    }

/**
 * What a drop does: ok and conflict move the piece (a conflict displaces
 * and flags, like click placement), blocked cancels with the refusal's
 * message, and no target (never over the map) cancels silently.
 */
export function decideDrop(
  uid: string,
  target: DragTarget | null,
): DropDecision {
  if (!target) return { type: 'cancel', reason: 'noTarget' }
  const { resolution, evaluation } = target
  if (isPlacementBlocked(resolution) || evaluation.status === 'blocked') {
    const reason = isPlacementBlocked(resolution)
      ? resolution.blocked
      : (evaluation.reason ?? 'blocked')
    const message = placementBlockedMessages[reason as PlacementBlockedReason]
    return { type: 'cancel', reason, ...(message ? { message } : {}) }
  }
  return {
    type: 'move',
    uid,
    newPieceCoords: resolution.coords,
    newAltitude: resolution.altitude,
    newRotation: resolution.rotation,
  }
}

// --- The press/drag state machine ---

export type DragState =
  | {
      phase: 'idle'
      /**
       * Swallow the next release: a drag was cancelled (Esc, focus lost)
       * while the button may still be down, so its release must not click.
       */
      swallowRelease: boolean
    }
  | {
      phase: 'pressed'
      uid: string
      start: { x: number; y: number }
      grabOffset: CubeCoordinate
    }
  | { phase: 'dragging'; uid: string; grabOffset: CubeCoordinate }

export type DragCancelReason = 'escape' | 'blur' | 'pointercancel'

export type DragEvent =
  | {
      type: 'press'
      uid: string
      x: number
      y: number
      grabOffset: CubeCoordinate
    }
  | { type: 'move'; x: number; y: number }
  | { type: 'release' }
  | { type: 'cancel'; reason: DragCancelReason }

export type DragOutcome =
  | { type: 'none' }
  /** The drag began: lock in the target and show the preview. */
  | { type: 'start'; uid: string }
  /** Released without moving: today's click (select/deselect) stands. */
  | { type: 'click' }
  /** Released while dragging: decide the drop (exactly once). */
  | { type: 'drop'; uid: string }
  | { type: 'cancel'; reason: DragCancelReason }

export const initialDragState: DragState = {
  phase: 'idle',
  swallowRelease: false,
}

const none = { type: 'none' } as const

export function dragReducer(
  state: DragState,
  event: DragEvent,
): { state: DragState; outcome: DragOutcome } {
  switch (event.type) {
    case 'press':
      // a second press while one is in progress is ignored
      if (state.phase !== 'idle') return { state, outcome: none }
      return {
        state: {
          phase: 'pressed',
          uid: event.uid,
          start: { x: event.x, y: event.y },
          grabOffset: event.grabOffset,
        },
        outcome: none,
      }
    case 'move': {
      if (state.phase !== 'pressed') return { state, outcome: none }
      const distance = Math.hypot(
        event.x - state.start.x,
        event.y - state.start.y,
      )
      if (distance <= CLICK_DRAG_TOLERANCE_PX) return { state, outcome: none }
      return {
        state: {
          phase: 'dragging',
          uid: state.uid,
          grabOffset: state.grabOffset,
        },
        outcome: { type: 'start', uid: state.uid },
      }
    }
    case 'release':
      if (state.phase === 'pressed') {
        return { state: initialDragState, outcome: { type: 'click' } }
      }
      if (state.phase === 'dragging') {
        return {
          state: initialDragState,
          outcome: { type: 'drop', uid: state.uid },
        }
      }
      return { state: initialDragState, outcome: none }
    case 'cancel':
      if (state.phase === 'idle') return { state, outcome: none }
      return {
        // the button is still down after Esc or a focus loss (maybe), so
        // its release must not count as a click; a pointercancel ends it
        state: {
          phase: 'idle',
          swallowRelease: event.reason !== 'pointercancel',
        },
        outcome: { type: 'cancel', reason: event.reason },
      }
  }
}

/**
 * Whether the release that is about to happen must be hidden from the rest
 * of the app (cap and model click handlers, pen painting, the canvas's
 * "clicked nothing" deselect). Ask before applying the release.
 */
export const shouldSwallowRelease = (state: DragState) =>
  state.phase === 'dragging' || (state.phase === 'idle' && state.swallowRelease)

/** What the scene draws while a piece is dragged (transient store state). */
export type DragPreview = {
  uid: string
  /** The hex under the pointer, or null before the pointer reaches a hex. */
  pointerHex: (CubeCoordinate & { altitude: number }) | null
  status: PlacementEvaluation['status'] | null
  reason: string | null
  footprintHexes: PlacementEvaluation['footprintHexes']
  /** The piece where it would land, or null when it cannot land. */
  previewBp: BoardPiece | null
}

/** The preview for a drag target (or for no target yet). */
export function getDragPreview(
  bp: BoardPiece,
  target: DragTarget | null,
): DragPreview {
  if (!target) {
    return {
      uid: bp.uid,
      pointerHex: null,
      status: null,
      reason: null,
      footprintHexes: [],
      previewBp: null,
    }
  }
  const { pointerHex, resolution, evaluation } = target
  const { q, r, s, altitude } = pointerHex
  return {
    uid: bp.uid,
    pointerHex: { q, r, s, altitude },
    status: evaluation.status,
    reason: evaluation.reason ?? null,
    footprintHexes: evaluation.footprintHexes,
    previewBp: isPlacementBlocked(resolution)
      ? null
      : {
          ...bp,
          pieceCoords: resolution.coords,
          altitude: resolution.altitude,
          rotation: resolution.rotation,
        },
  }
}

import type { BoardHex, BoardPiece, CubeCoordinate, Piece } from '../types'
import { isStartZoneBoardPiece } from './startZoneVisibility'
import { HexTerrain, Pieces } from '../types'
import { isLaurWallAddonPieceID } from '../utils/board-utils'
import { CLICK_DRAG_TOLERANCE_PX, HEXGRID_HEX_RADIUS } from '../utils/constants'
import { cubeToPixel, hexUtilsGetNeighborForRotation } from '../utils/hex-utils'
import { genBoardHexID } from '../utils/map-utils'
import { type IgnoredPieceUIDs, toIgnoredPieceUIDSet } from './ignoredPieceUIDs'
import type { MovePieceArgs } from './movePieces'
import { applyPieceMoves } from './movePieces'
import { piecesSoFar } from './pieces'
import { getNearestHexEdgeIndex } from './dragRotation'
import {
  type PlacementBlockedReason,
  type PlacementBoard,
  type PlacementEvaluation,
  type PlacementResolution,
  type ResolvedPlacement,
  evaluatePlacement,
  isPlacementBlocked,
  placementBlockedMessages,
  resolvePlacement,
} from './placement'
import { computeConflictedPieceUIDs } from './rebuildBoardState'
import getPieceTemplateCoords from './rotationTransforms'

/**
 * Drag-to-move for selected pieces already on the board: the pure parts
 * (which pieces may be dragged, the press/drag/drop state machine, the grab
 * offset and the drop decision). Pointer and camera wiring lives in
 * world/drag/dragController.ts.
 */

export const isDraggablePiece = (piece: Piece | undefined): piece is Piece =>
  !!piece

// The ladder-origin hit adds one level, and ladderStack adds one more.
const LADDER_STACK_ALTITUDE_STEP = 2

function ladderAtStackAltitude(
  boardPieces: BoardPiece[],
  ladder: BoardPiece,
  altitude: number,
): BoardPiece | undefined {
  return boardPieces.find(
    (candidate) =>
      candidate.inventoryID === Pieces.ladder &&
      candidate.altitude === altitude &&
      candidate.rotation === ladder.rotation &&
      candidate.pieceCoords.q === ladder.pieceCoords.q &&
      candidate.pieceCoords.r === ladder.pieceCoords.r &&
      candidate.pieceCoords.s === ladder.pieceCoords.s,
  )
}

function getLadderStackAbove(
  ladder: BoardPiece,
  boardPieces: BoardPiece[],
): BoardPiece[] {
  const above: BoardPiece[] = []
  let current = ladder
  while (true) {
    const next = ladderAtStackAltitude(
      boardPieces,
      current,
      current.altitude + LADDER_STACK_ALTITUDE_STEP,
    )
    if (!next) return above
    above.push(next)
    current = next
  }
}

/** The selected members may move together only if all of them can move. */
export function getDraggableSelectionGroup(
  selectedPieceIDs: string[],
  grabbedUID: string,
  boardPieces: BoardPiece[],
  isShowStartZones = true,
): BoardPiece[] | null {
  if (!selectedPieceIDs.length || !selectedPieceIDs.includes(grabbedUID)) {
    return null
  }
  const seen = new Set<string>()
  const group: BoardPiece[] = []
  for (const uid of selectedPieceIDs) {
    if (seen.has(uid)) return null
    seen.add(uid)
    const bp = boardPieces.find((piece) => piece.uid === uid)
    if (
      !bp ||
      (!isShowStartZones && isStartZoneBoardPiece(bp)) ||
      !isDraggablePiece(piecesSoFar[bp.inventoryID])
    ) {
      return null
    }
    group.push(bp)
  }
  for (let index = 0; index < group.length; index++) {
    const ladder = group[index]
    if (ladder.inventoryID !== Pieces.ladder) continue
    for (const above of getLadderStackAbove(ladder, boardPieces)) {
      if (seen.has(above.uid)) continue
      seen.add(above.uid)
      group.push(above)
    }
  }
  return group
}

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
  // Attachment pieces follow the edge or port resolved directly under the
  // pointer; their BoardPiece anchor is not the clicked support hex.
  if (piece.terrain === HexTerrain.laurWallAddon || isEdgeDragPiece(piece)) {
    return { q: 0, r: 0, s: 0 }
  }
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
  members: DragTargetMember[]
}

export type DragTargetMember = {
  uid: string
  bp: BoardPiece
  piece: Piece
  resolution: PlacementResolution
  evaluation: PlacementEvaluation
  previewHex: CubeCoordinate & { altitude: number }
  unsupported: boolean
  edgeIndex?: number
}

function hasMovingLadderSupport(
  member: DragTargetMember,
  members: DragTargetMember[],
): boolean {
  if (member.piece.id !== Pieces.ladder || 'blocked' in member.resolution) {
    return false
  }
  const memberResolution = member.resolution
  return members.some((candidate) => {
    if (
      candidate.uid === member.uid ||
      candidate.piece.id !== Pieces.ladder ||
      'blocked' in candidate.resolution
    ) {
      return false
    }
    const candidateResolution = candidate.resolution
    return (
      candidateResolution.altitude + LADDER_STACK_ALTITUDE_STEP ===
        memberResolution.altitude &&
      candidateResolution.rotation === memberResolution.rotation &&
      candidateResolution.coords.q === memberResolution.coords.q &&
      candidateResolution.coords.r === memberResolution.coords.r &&
      candidateResolution.coords.s === memberResolution.coords.s
    )
  })
}

/**
 * Where the dragged group would land with the pointer on `pointerHex`: the
 * grabbed piece uses the pen resolver (including smart altitude), and the
 * remaining members keep their relative positions and rotations. Every
 * moving member is left out of placement checks. A target hanging off the
 * map evaluates as blocked (offMap) with its full footprint; group members
 * outside the altitude bounds evaluate as blocked (outOfHeight).
 */
export function evaluateDragTarget(
  board: PlacementBoard,
  piece: Piece,
  bp: BoardPiece,
  pointerHex: BoardHex,
  grabOffset: CubeCoordinate,
  movingPieces: BoardPiece[] = [bp],
  worldPoint?: { x: number; z: number },
): DragTarget {
  const dropHex = getDropPointerHex(pointerHex, grabOffset, board.boardHexes)
  const members = [
    bp,
    ...movingPieces.filter((member) => member.uid !== bp.uid),
  ]
  const groupEdgeDrag = members.length > 1 && isEdgeDragPiece(piece)
  const groupEdgeTarget = groupEdgeDrag
    ? getEdgeDragTarget(piece, bp, dropHex)
    : null
  const edgeTarget = groupEdgeDrag
    ? null
    : getEdgeDragTarget(piece, bp, dropHex, worldPoint)
  const ignoredUIDs = members.map((member) => member.uid)
  // Like the pen hover, resolve a target that hangs off the map anyway, so
  // its whole footprint shows; evaluation blocks it (offMap).
  const resolution = resolvePlacement(
    piece,
    dropHex,
    edgeTarget?.rotation ?? groupEdgeTarget?.rotation ?? bp.rotation,
    board,
    {
      ignoreUID: ignoredUIDs,
      deferOffMapCheck: true,
      worldPoint: groupEdgeDrag ? undefined : worldPoint,
    },
  )
  const evaluation = evaluatePlacement(board, resolution, {
    ignoreUID: ignoredUIDs,
    checkHeightBounds: members.length > 1,
  })
  const grabbedCoords = isPlacementBlocked(resolution)
    ? dropHex
    : resolution.coords
  const delta = groupEdgeDrag
    ? subtract(
        dropHex,
        getEdgeSupportCoords(piece, bp.pieceCoords, bp.rotation),
      )
    : subtract(grabbedCoords, bp.pieceCoords)
  const altitudeDelta = isPlacementBlocked(resolution)
    ? 0
    : resolution.altitude - bp.altitude
  const targetMembers: DragTargetMember[] = []
  for (const member of members) {
    const memberPiece =
      member.uid === bp.uid ? piece : piecesSoFar[member.inventoryID]
    if (!memberPiece) continue
    const rigidCoords = {
      q: member.pieceCoords.q + delta.q,
      r: member.pieceCoords.r + delta.r,
      s: member.pieceCoords.s + delta.s,
    }
    const memberResolution: PlacementResolution =
      member.uid === bp.uid
        ? resolution
        : resolveRigidMemberPlacement(
            board,
            memberPiece,
            rigidCoords,
            member.altitude + altitudeDelta,
            member.rotation,
            ignoredUIDs,
          )
    const memberEvaluation =
      member.uid === bp.uid
        ? evaluation
        : evaluatePlacement(board, memberResolution, {
            ignoreUID: ignoredUIDs,
            checkHeightBounds: members.length > 1,
          })
    const memberEdgeIndex =
      member.uid === bp.uid
        ? (edgeTarget?.edgeIndex ??
          (groupEdgeDrag ? groupEdgeTarget?.edgeIndex : undefined))
        : getEdgeDragTarget(
            memberPiece,
            { ...member, pieceCoords: rigidCoords },
            rigidCoords,
          )?.edgeIndex
    const previewHex =
      member.uid === bp.uid && edgeTarget
        ? {
            q: dropHex.q,
            r: dropHex.r,
            s: dropHex.s,
            altitude: dropHex.altitude,
          }
        : memberEdgeIndex !== undefined
          ? {
              ...getEdgeSupportCoords(
                memberPiece,
                isPlacementBlocked(memberResolution)
                  ? rigidCoords
                  : memberResolution.coords,
                isPlacementBlocked(memberResolution)
                  ? member.rotation
                  : memberResolution.rotation,
              ),
              altitude:
                (isPlacementBlocked(memberResolution)
                  ? member.altitude + altitudeDelta
                  : memberResolution.altitude) + 1,
            }
          : isPlacementBlocked(memberResolution)
            ? { ...dropHex, altitude: member.altitude }
            : {
                ...memberResolution.coords,
                altitude: memberResolution.altitude,
              }
    targetMembers.push({
      uid: member.uid,
      bp: member,
      piece: memberPiece,
      resolution: memberResolution,
      evaluation: memberEvaluation,
      previewHex,
      unsupported: false,
      ...(memberEdgeIndex === undefined ? {} : { edgeIndex: memberEdgeIndex }),
    })
  }

  const hasLaurWallAddon = members.some((member) =>
    isLaurWallAddonPieceID(member.inventoryID),
  )
  const hasMovingLadderStack = targetMembers.some((member) =>
    hasMovingLadderSupport(member, targetMembers),
  )
  if (
    (hasLaurWallAddon || hasMovingLadderStack) &&
    targetMembers.every(
      (member) =>
        !isPlacementBlocked(member.resolution) &&
        member.evaluation.status !== 'blocked',
    )
  ) {
    const simulated = applyPieceMoves(
      {
        ...board,
        conflictedPieceUIDs: computeConflictedPieceUIDs(board.boardPieces),
      },
      targetMembers.flatMap((member) =>
        isPlacementBlocked(member.resolution)
          ? []
          : [
              {
                uid: member.uid,
                newPieceCoords: member.resolution.coords,
                newAltitude: member.resolution.altitude,
                newRotation: member.resolution.rotation,
              },
            ],
      ),
    )
    if (simulated) {
      for (const member of targetMembers) {
        const conflicted = simulated.conflictedPieceUIDs.includes(member.uid)
        if (isLaurWallAddonPieceID(member.piece.id)) {
          member.unsupported = simulated.unsupportedPieceUIDs.includes(
            member.uid,
          )
        }
        if (hasMovingLadderSupport(member, targetMembers)) {
          member.evaluation = {
            ...member.evaluation,
            status: conflicted ? 'conflict' : 'ok',
            reason: conflicted ? 'Overlaps other pieces' : undefined,
          }
        }
        if (
          conflicted &&
          member.evaluation.status !== 'blocked' &&
          hasLaurWallAddon
        ) {
          member.evaluation = { ...member.evaluation, status: 'conflict' }
        }
      }
    }
  }

  const status = targetMembers.some(
    (member) => member.evaluation.status === 'blocked',
  )
    ? 'blocked'
    : targetMembers.some((member) => member.evaluation.status === 'conflict')
      ? 'conflict'
      : 'ok'
  const worstMember = targetMembers.find(
    (member) => member.evaluation.status === status,
  )
  const combinedEvaluation: PlacementEvaluation = {
    status,
    displacedUIDs: [
      ...new Set(
        targetMembers.flatMap((member) => member.evaluation.displacedUIDs),
      ),
    ],
    footprintHexes: targetMembers.flatMap(
      (member) => member.evaluation.footprintHexes,
    ),
    ...(worstMember?.evaluation.reason
      ? { reason: worstMember.evaluation.reason }
      : {}),
  }
  return {
    pointerHex,
    resolution,
    evaluation: combinedEvaluation,
    members: targetMembers,
  }
}

export type DropDecision =
  | {
      type: 'move'
      uid: string
      newPieceCoords: CubeCoordinate
      newAltitude: number
      newRotation: number
      moves?: MovePieceArgs[]
    }
  | {
      type: 'cancel'
      /** A PlacementBlockedReason, or 'noTarget' (never over the map). */
      reason: string
      /** What to tell the user, if anything. */
      message?: string
    }

/**
 * What a drop does: ok and conflict move the piece or group (a conflict
 * displaces and flags, like click placement), blocked cancels with the
 * refusal's message, and no target (never over the map) cancels silently.
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
  const primary = isPlacementBlocked(resolution)
    ? null
    : {
        uid,
        newPieceCoords: resolution.coords,
        newAltitude: resolution.altitude,
        newRotation: resolution.rotation,
      }
  const moves = target.members.flatMap((member) =>
    isPlacementBlocked(member.resolution)
      ? []
      : [
          {
            uid: member.uid,
            newPieceCoords: member.resolution.coords,
            newAltitude: member.resolution.altitude,
            newRotation: member.resolution.rotation,
          },
        ],
  )
  if (!primary) return { type: 'cancel', reason: 'blocked' }
  return {
    type: 'move',
    ...primary,
    ...(target.members.length > 1 ? { moves } : {}),
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
  /** Per-piece status and ghost data for a multi-selection drag. */
  members?: DragPreviewMember[]
}

export type DragPreviewMember = {
  uid: string
  pointerHex: CubeCoordinate & { altitude: number }
  status: PlacementEvaluation['status']
  reason: string | null
  footprintHexes: PlacementEvaluation['footprintHexes']
  previewBp: BoardPiece | null
  unsupported: boolean
  edgeIndex?: number
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
  const previewBPFor = (member: DragTargetMember): BoardPiece | null =>
    isPlacementBlocked(member.resolution)
      ? null
      : {
          ...member.bp,
          pieceCoords: member.resolution.coords,
          altitude: member.resolution.altitude,
          rotation: member.resolution.rotation,
        }
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
    members: target.members.map((member) => ({
      uid: member.uid,
      pointerHex: member.previewHex,
      status: member.evaluation.status,
      reason: member.evaluation.reason ?? null,
      footprintHexes: member.evaluation.footprintHexes,
      previewBp: previewBPFor(member),
      unsupported: member.unsupported,
      ...(member.edgeIndex === undefined
        ? {}
        : { edgeIndex: member.edgeIndex }),
    })),
  }
}

const isEdgeDragPiece = (piece: Piece) =>
  piece.id === Pieces.battlement ||
  piece.id === Pieces.roadWall ||
  piece.id === Pieces.ropeLadder

function resolveRigidMemberPlacement(
  board: PlacementBoard,
  piece: Piece,
  coords: CubeCoordinate,
  altitude: number,
  rotation: number,
  ignoredUIDs: IgnoredPieceUIDs,
): PlacementResolution {
  if (!isEdgeDragPiece(piece)) {
    return { piece, coords, altitude, rotation, rule: 'default' }
  }

  const edgeIndex =
    piece.id === Pieces.battlement ? (rotation + 3) % 6 : rotation
  const supportCoords = getEdgeSupportCoords(piece, coords, rotation)
  if (piece.id === Pieces.battlement || piece.id === Pieces.roadWall) {
    if (!board.boardHexes[genBoardHexID({ ...supportCoords, altitude: 0 })]) {
      return { blocked: 'offMap' }
    }
  }

  const supportID = genBoardHexID({
    ...supportCoords,
    altitude: altitude + 1,
  })
  const existingSupport = board.boardHexes[supportID]
  const ignored = toIgnoredPieceUIDSet(ignoredUIDs)
  const support =
    existingSupport && !ignored.has(existingSupport.boardPieceUID ?? '')
      ? existingSupport
      : {
          ...supportCoords,
          altitude: altitude + 1,
          id: supportID,
          pieceID: '',
          inventoryID: '',
          terrain: HexTerrain.empty,
          pieceRotation: 0,
        }

  return resolvePlacement(piece, support, edgeIndex, board, {
    ignoreUID: ignoredUIDs,
    deferOffMapCheck: true,
  })
}

function getEdgeSupportCoords(
  piece: Piece,
  coords: CubeCoordinate,
  rotation: number,
): CubeCoordinate {
  if (piece.id !== Pieces.battlement && piece.id !== Pieces.roadWall) {
    return coords
  }
  const edgeIndex =
    piece.id === Pieces.battlement ? (rotation + 3) % 6 : rotation
  const neighbor = hexUtilsGetNeighborForRotation(
    piece.id === Pieces.battlement ? edgeIndex : (edgeIndex + 4) % 6,
  )
  return {
    q: coords.q - neighbor.q,
    r: coords.r - neighbor.r,
    s: coords.s - neighbor.s,
  }
}

export type DragEdgeTarget = {
  /** Edge of the hovered hex, numbered like the placement rotation. */
  edgeIndex: number
  /** Rotation expected by resolvePlacement for the selected edge. */
  rotation: number
}

/**
 * Select the nearest edge midpoint of a hovered hex. At a tie (including a
 * pointer exactly at the center), retain the piece's existing attachment
 * edge, then use the lowest edge index for a deterministic fallback.
 */
export function getEdgeDragTarget(
  piece: Piece,
  bp: BoardPiece,
  pointerHex: CubeCoordinate,
  worldPoint?: { x: number; z: number },
): DragEdgeTarget | null {
  if (!isEdgeDragPiece(piece)) return null
  const currentEdge =
    piece.id === Pieces.battlement
      ? (bp.rotation + 3) % 6
      : ((bp.rotation % 6) + 6) % 6
  if (!worldPoint) {
    return { edgeIndex: currentEdge, rotation: currentEdge }
  }

  const edgeIndex = getNearestHexEdgeIndex(pointerHex, worldPoint, currentEdge)
  return { edgeIndex, rotation: edgeIndex }
}

/** A stable cache key: edge pieces only need reevaluation when the edge changes. */
export function getDragTargetKey(
  piece: Piece,
  bp: BoardPiece,
  hex: BoardHex,
  worldPoint?: { x: number; z: number },
  isGroupDrag = false,
) {
  if (isGroupDrag && isEdgeDragPiece(piece)) return hex.id
  const edgeTarget = getEdgeDragTarget(piece, bp, hex, worldPoint)
  if (edgeTarget) return `${hex.id}:edge:${edgeTarget.edgeIndex}`
  if (piece.terrain === HexTerrain.laurWallAddon && worldPoint) {
    return `${hex.id}:${worldPoint.x}:${worldPoint.z}`
  }
  return hex.id
}

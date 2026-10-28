import type { CameraControls } from '@react-three/drei'
import type { RootState, ThreeEvent } from '@react-three/fiber'
import { enqueueSnackbar } from 'notistack'
import type React from 'react'
import {
  type DragCancelReason,
  type DragEvent,
  type DragState,
  type DragTarget,
  type DropDecision,
  decideDrop,
  dragReducer,
  evaluateDragTarget,
  getDragPreview,
  getDragTargetKey,
  getDraggableSelectionGroup,
  getGrabOffset,
  initialDragState,
  isDraggablePiece,
  shouldSwallowRelease,
  worldToCube,
} from '../../data/dragMove'
import {
  accumulateWheelRotation,
  getLadderSectorRotation,
  initialWheelRotationAccumulator,
  normalizeRotationSteps,
  rotateDragMembers,
  shortestRotationSteps,
  shouldRotateDragWithWheel,
  shouldShowWheelHint,
} from '../../data/dragRotation'
import { piecesSoFar } from '../../data/pieces'
import {
  START_ZONES_HIDDEN_MESSAGE,
  isStartZoneBoardPiece,
} from '../../data/startZoneVisibility'
import useBoundStore from '../../store/store'
import {
  finishPerformanceTiming,
  startPerformanceTiming,
} from '../../performance/performanceTiming'
import {
  type BoardHex,
  type BoardPiece,
  Pieces,
  SELECT_PEN_MODE,
} from '../../types'
import { genBoardHexID } from '../../utils/map-utils'

/**
 * Drag-to-move wiring: turns pointer events into the pure state machine in
 * data/dragMove.ts, locks the camera while a piece is pressed, updates the
 * drag preview in the store, and commits the drop with movePieces (one undo
 * step). One module, because a drag outlives the mesh it started on.
 *
 * Pieces call `pressPieceForDrag` from onPointerDown and
 * `reportDragTargetHex` from onPointerMove; hover handlers ask
 * `isDragPassThrough` so the pointer sees through the dragged piece.
 */

let state: DragState = initialDragState
let dragged: {
  bp: BoardPiece
  members: BoardPiece[]
  target: DragTarget | null
  targetWorldPoint?: { x: number; z: number }
} | null = null
let targetKey = ''
let rotationSteps = 0
let wheelAccumulator = initialWheelRotationAccumulator
let wheelListenerActive = false
let hasShownWheelHint = false
let cameraControlsRef: React.RefObject<CameraControls> | null = null
let getR3F: (() => RootState) | null = null
/** Set by reportDragTargetHex; cleared at the start of each pointermove. */
let hitThisMove = false

/** World.tsx registers the camera controls and the R3F state. */
export function registerDragContext(
  controlsRef: React.RefObject<CameraControls>,
  get: () => RootState,
) {
  cameraControlsRef = controlsRef
  getR3F = get
  return () => {
    end()
    cameraControlsRef = null
    getR3F = null
  }
}

/** For window.__TEST__ (read-only). */
export const getDragState = () => state

// --- Camera lock ---

/**
 * The camera must ignore the press synchronously: R3F's pointerdown
 * listener runs before camera-controls' (both are on the same element), so
 * a React re-render is too late. The store flag keeps a re-render from
 * turning it back on. Ending a drag restores the user's own lock.
 */
function lockCamera() {
  if (cameraControlsRef?.current) cameraControlsRef.current.enabled = false
}
function restoreCamera() {
  const { isCameraDisabled, isTakingPicture } = useBoundStore.getState()
  if (cameraControlsRef?.current) {
    cameraControlsRef.current.enabled = !(isCameraDisabled || isTakingPicture)
  }
}

/**
 * R3F remembers which objects stopped a hover (internal.hovered entries'
 * `stopped`) and keeps stopping propagation for them on every move, so the
 * piece under the cursor when the drag starts would go on hiding what is
 * beneath it until the pointer left and came back. `internal.hovered` is not
 * public R3F API; the drag browser test (e2e/drag-move.spec.ts, "reports the
 * hex under the piece") fails if this stops working.
 */
function forgetStoppedHovers() {
  const hovered = getR3F?.().internal.hovered
  if (!hovered) return
  for (const entry of hovered.values()) {
    ;(entry as { stopped?: boolean }).stopped = false
  }
}

// --- Window listeners while a press is in progress ---

const isCanvasEvent = (event: Event) => {
  const canvas = getR3F?.().gl.domElement
  return (
    !!canvas && event.target instanceof Node && canvas.contains(event.target)
  )
}

function dispatch(event: DragEvent) {
  const next = dragReducer(state, event)
  state = next.state
  return next.outcome
}

function onWindowPointerMoveCapture(event: PointerEvent) {
  const startedAt = startPerformanceTiming()
  try {
    // before R3F handles this move: nothing has reported a target yet
    hitThisMove = false
    const outcome = dispatch({
      type: 'move',
      x: event.clientX,
      y: event.clientY,
    })
    if (outcome.type === 'start' && dragged) {
      forgetStoppedHovers()
      setPreview(null)
      rotationSteps = 0
      wheelAccumulator = initialWheelRotationAccumulator
      listenWheel()
      showWheelHint()
    }
  } finally {
    finishPerformanceTiming('drag.pointerMoveCapture', startedAt)
  }
}

function onWindowPointerMove() {
  const startedAt = startPerformanceTiming()
  try {
    // after R3F: the pointer is over nothing that can take the piece
    if (state.phase === 'dragging' && !hitThisMove) setTarget(null)
  } finally {
    finishPerformanceTiming('drag.pointerMove', startedAt)
  }
}

function onWindowPointerUpCapture(event: PointerEvent) {
  if (event.button !== 0) return
  const swallow = shouldSwallowRelease(state)
  const outcome = dispatch({ type: 'release' })
  if (outcome.type === 'drop' && dragged) {
    drop(isCanvasEvent(event) ? dragged.target : null)
  }
  if (swallow) {
    // runs before R3F's listeners: no model, cap, pen paint or "clicked
    // nothing" deselect sees this release, nor the click that follows it
    event.stopPropagation()
    swallowNextClick()
  }
  end()
}

function onWindowPointerCancel() {
  cancel('pointercancel')
}

function onWindowWheelCapture(event: WheelEvent) {
  if (state.phase !== 'dragging' || !dragged) return
  event.preventDefault()
  event.stopPropagation()

  const piece = piecesSoFar[dragged.bp.inventoryID]
  if (!piece) return
  if (!shouldRotateDragWithWheel(piece, dragged.members.length)) {
    wheelAccumulator = initialWheelRotationAccumulator
    return
  }

  const result = accumulateWheelRotation(wheelAccumulator, {
    deltaY: event.deltaY,
    deltaMode: event.deltaMode,
    time: performance.now(),
    pagePixels: window.innerHeight,
  })
  wheelAccumulator = result.state
  if (result.step === 0) return

  rotationSteps = normalizeRotationSteps(rotationSteps + result.step)
  if (dragged.target) {
    setTarget(dragged.target.pointerHex, dragged.targetWorldPoint)
  }
}

function onWindowKeyDownCapture(event: KeyboardEvent) {
  const startedAt = startPerformanceTiming()
  try {
    if (event.key !== 'Escape' || state.phase === 'idle') return
    // no other Escape handling (hotkeys, dialogs) during a press
    event.preventDefault()
    event.stopPropagation()
    cancel('escape')
  } finally {
    finishPerformanceTiming('drag.keydown', startedAt)
  }
}

function onWindowBlur() {
  cancel('blur')
}

function onWindowPointerDownCapture() {
  // the release of a cancelled drag never came (e.g. it happened in another
  // window): a new press must not have its release swallowed
  if (state.phase === 'idle' && state.swallowRelease) {
    state = initialDragState
    unlisten()
  }
}

function onWindowClickCapture(event: MouseEvent) {
  event.stopPropagation()
  stopSwallowingClicks()
}

function swallowNextClick() {
  window.addEventListener('click', onWindowClickCapture, true)
  // a release outside the page sends no click: the next press clears it
  window.addEventListener('pointerdown', stopSwallowingClicks, true)
}

function stopSwallowingClicks() {
  window.removeEventListener('click', onWindowClickCapture, true)
  window.removeEventListener('pointerdown', stopSwallowingClicks, true)
}

function listen() {
  window.addEventListener('pointermove', onWindowPointerMoveCapture, true)
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUpCapture, true)
  window.addEventListener('pointercancel', onWindowPointerCancel)
  window.addEventListener('keydown', onWindowKeyDownCapture, true)
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('pointerdown', onWindowPointerDownCapture, true)
}

function listenWheel() {
  if (wheelListenerActive) return
  window.addEventListener('wheel', onWindowWheelCapture, {
    capture: true,
    passive: false,
  })
  wheelListenerActive = true
}

function unlistenWheel() {
  if (!wheelListenerActive) return
  window.removeEventListener('wheel', onWindowWheelCapture, true)
  wheelListenerActive = false
}

function unlisten() {
  unlistenWheel()
  window.removeEventListener('pointermove', onWindowPointerMoveCapture, true)
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUpCapture, true)
  window.removeEventListener('pointercancel', onWindowPointerCancel)
  window.removeEventListener('keydown', onWindowKeyDownCapture, true)
  window.removeEventListener('blur', onWindowBlur)
  window.removeEventListener('pointerdown', onWindowPointerDownCapture, true)
}

// --- Press, target, drop ---

/**
 * onPointerDown on any rendering of a placed piece. Starts a press only
 * for the selected draggable piece(s) in select mode with the left button;
 * otherwise the press is today's (the camera may orbit). Always stops
 * propagation so only the front-most piece decides.
 */
export function pressPieceForDrag(
  event: ThreeEvent<PointerEvent>,
  uid: string | undefined,
) {
  event.stopPropagation()
  if (!uid || event.button !== 0 || state.phase !== 'idle') return
  const { penMode, selectedPieceIDs, boardPieces, isShowStartZones } =
    useBoundStore.getState()
  if (penMode !== SELECT_PEN_MODE) return
  const members = getDraggableSelectionGroup(
    selectedPieceIDs,
    uid,
    boardPieces,
    isShowStartZones,
  )
  if (!members) return
  const bp = members.find((piece) => piece.uid === uid)
  const piece = bp && piecesSoFar[bp.inventoryID]
  if (!bp || !isDraggablePiece(piece)) return

  lockCamera()
  stopSwallowingClicks()
  dragged = { bp, members, target: null }
  targetKey = ''
  rotationSteps = 0
  wheelAccumulator = initialWheelRotationAccumulator
  dispatch({
    type: 'press',
    uid,
    x: event.nativeEvent.clientX,
    y: event.nativeEvent.clientY,
    grabOffset: getGrabOffset(piece, bp, event.point),
  })
  useBoundStore.getState().setDragState(true, null)
  listen()
}

/** A drag is in progress (cheap; check it before costly lookups). */
export const isDragging = () => state.phase === 'dragging'

/** Whether a hover on this piece should be ignored (not stopped). */
export const isDragPassThrough = (uid: string | undefined) =>
  state.phase === 'dragging' &&
  !!uid &&
  !!dragged?.members.some((member) => member.uid === uid)

/**
 * onPointerMove on a hex surface (cap, table hex, castle top, a piece's
 * support). Returns true when it took the move as the drag target, so the
 * caller stops propagation; false while not dragging, and for anything the
 * dragged piece owns (`ownerUID`, the hex's piece by default), so the
 * pointer passes through to what is beneath. `worldPoint` preserves the
 * raycast x/z for Laur add-on side and vertex resolution.
 */
export function reportDragTargetHex(
  hex: BoardHex | undefined,
  ownerUID = hex?.boardPieceUID,
  worldPoint?: { x: number; z: number },
): boolean {
  if (state.phase !== 'dragging' || !dragged || !hex) return false
  if (ownerUID && dragged.members.some((member) => member.uid === ownerUID)) {
    return false
  }
  const targetHex = getLadderDragTargetHex(hex, ownerUID)
  hitThisMove = true
  setTarget(targetHex, worldPoint)
  return true
}

function getLadderDragTargetHex(
  hex: BoardHex,
  ownerUID: string | undefined,
): BoardHex {
  if (
    !ownerUID ||
    piecesSoFar[dragged?.bp.inventoryID ?? '']?.id !== Pieces.ladder
  ) {
    return hex
  }
  const { boardHexes, boardPieces } = useBoundStore.getState()
  const target = boardPieces.find((piece) => piece.uid === ownerUID)
  if (target?.inventoryID !== Pieces.ladder) return hex

  const originID = genBoardHexID({
    ...target.pieceCoords,
    altitude: target.altitude + 1,
  })
  const origin = boardHexes[originID]
  return origin?.boardPieceUID === target.uid ? origin : hex
}

/**
 * The hex a press point on a piece stands for: the piece's highest hex in
 * the column under the point (for a tile's side or a model).
 */
export function findPieceHexAt(
  uid: string,
  point: { x: number; z: number },
): BoardHex | undefined {
  const { boardHexes } = useBoundStore.getState()
  const coords = worldToCube(point.x, point.z)
  let best: BoardHex | undefined
  for (let altitude = 0; altitude <= 40; altitude += 0.5) {
    const hex = boardHexes[genBoardHexID({ ...coords, altitude })]
    if (hex?.boardPieceUID === uid && !hex.isVerticalClearanceHex) best = hex
  }
  return best
}

function setTarget(
  hex: BoardHex | null,
  worldPoint?: { x: number; z: number },
) {
  if (!dragged) return
  if (!hex) {
    targetKey = ''
    dragged.target = null
    dragged.targetWorldPoint = undefined
    setPreview(null)
    return
  }
  const piece = piecesSoFar[dragged.bp.inventoryID]
  if (!piece) return
  dragged.targetWorldPoint = worldPoint
  if (piece.id === Pieces.ladder) {
    const currentRotation = normalizeRotationSteps(
      dragged.bp.rotation + rotationSteps,
    )
    const sectorRotation = getLadderSectorRotation(
      hex,
      worldPoint,
      currentRotation,
    )
    if (sectorRotation !== null) {
      rotationSteps = normalizeRotationSteps(
        rotationSteps + shortestRotationSteps(currentRotation, sectorRotation),
      )
    }
  }
  const key = `${getDragTargetKey(
    piece,
    dragged.bp,
    hex,
    worldPoint,
    dragged.members.length > 1,
  )}:rotation:${rotationSteps}`
  if (key === targetKey) return
  targetKey = key
  const { boardHexes, boardPieces } = useBoundStore.getState()
  const grabOffset = state.phase === 'dragging' ? state.grabOffset : null
  if (!piece || !grabOffset) return
  const transformed = rotateDragMembers(
    dragged.members,
    dragged.bp.uid,
    grabOffset,
    rotationSteps,
  )
  const resolverPointerHex =
    piece.id === Pieces.ladder
      ? { ...hex, pieceRotation: transformed.bp.rotation }
      : hex
  dragged.target = evaluateDragTarget(
    { boardHexes, boardPieces },
    piece,
    transformed.bp,
    resolverPointerHex,
    transformed.grabOffset,
    transformed.members,
    worldPoint,
  )
  setPreview(dragged.target)
}

function setPreview(target: DragTarget | null) {
  if (!dragged) return
  useBoundStore
    .getState()
    .setDragState(true, getDragPreview(dragged.bp, target))
}

export function commitMoveDecision(
  decision: Extract<DropDecision, { type: 'move' }>,
) {
  const moves = decision.moves ?? [
    {
      uid: decision.uid,
      newPieceCoords: decision.newPieceCoords,
      newAltitude: decision.newAltitude,
      newRotation: decision.newRotation,
    },
  ]
  const store = useBoundStore.getState()
  const movingStartZone = moves.some((move) =>
    isStartZoneBoardPiece(
      store.boardPieces.find((piece) => piece.uid === move.uid),
    ),
  )
  store.movePieces({ moves })
  if (movingStartZone && !store.isShowStartZones) {
    enqueueSnackbar({
      message: START_ZONES_HIDDEN_MESSAGE,
      variant: 'info',
    })
  }
}

function drop(target: DragTarget | null) {
  if (!dragged) return
  const decision = decideDrop(dragged.bp.uid, target)
  if (decision.type === 'move') {
    commitMoveDecision(decision)
    return
  }
  if (decision.message) {
    enqueueSnackbar({
      message: decision.message,
      variant: 'warning',
      autoHideDuration: 5000,
    })
  }
}

function cancel(reason: DragCancelReason) {
  if (state.phase === 'idle') return
  dispatch({ type: 'cancel', reason })
  // keep listening for the release if it is still to come (Esc, blur), so
  // it can be swallowed; it ends the press as usual
  dragged = null
  targetKey = ''
  rotationSteps = 0
  wheelAccumulator = initialWheelRotationAccumulator
  unlistenWheel()
  restoreCamera()
  useBoundStore.getState().setDragState(false, null)
  if (!shouldSwallowRelease(state)) unlisten()
}

/** Ends a press: listeners off, camera back, preview gone. */
function end() {
  unlisten()
  dragged = null
  targetKey = ''
  rotationSteps = 0
  wheelAccumulator = initialWheelRotationAccumulator
  restoreCamera()
  if (useBoundStore.getState().isDraggingPiece) {
    useBoundStore.getState().setDragState(false, null)
  }
}

function showWheelHint() {
  if (!dragged) return
  const piece = piecesSoFar[dragged.bp.inventoryID]
  if (
    !piece ||
    !shouldShowWheelHint(piece, dragged.members.length, hasShownWheelHint)
  ) {
    return
  }
  hasShownWheelHint = true
  enqueueSnackbar({
    key: 'drag-rotate-wheel-hint',
    message: 'Scroll the mouse wheel to rotate while you drag.',
    variant: 'info',
    preventDuplicate: true,
    autoHideDuration: 5000,
  })
}

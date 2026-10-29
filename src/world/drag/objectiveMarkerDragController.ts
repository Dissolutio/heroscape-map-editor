import type { CameraControls } from '@react-three/drei'
import type { RootState, ThreeEvent } from '@react-three/fiber'
import type React from 'react'
import {
  getObjectiveMarkerPlacementStatus,
  type ObjectiveMarkerPlacementStatus,
} from '../../data/objectiveMarkerPlacement'
import type { ObjectiveMarker } from '../../data/objectiveMarkers'
import { mapTableHexes } from '../../data/fitMapToPieces'
import useBoundStore from '../../store/store'
import type { BoardHex } from '../../types'
import { SELECT_PEN_MODE } from '../../types'
import { isDragging } from './dragController'

const DRAG_TOLERANCE = 5

type MarkerDropTarget = {
  marker: ObjectiveMarker
  placement: ObjectiveMarkerPlacementStatus
}

let press: {
  uid: string
  x: number
  y: number
  dragging: boolean
  target: MarkerDropTarget | null
} | null = null
let cameraControlsRef: React.RefObject<CameraControls> | null = null
let getR3F: (() => RootState) | null = null
let hitThisMove = false
let cachedHexMap: object | null = null
let cachedMapHexIDs = new Set<string>()

export function registerObjectiveMarkerDragContext(
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

export function pressObjectiveMarkerForDrag(
  event: ThreeEvent<PointerEvent>,
  uid: string,
) {
  event.stopPropagation()
  if (
    event.button !== 0 ||
    press ||
    isDragging() ||
    useBoundStore.getState().penMode !== SELECT_PEN_MODE ||
    useBoundStore.getState().selectedObjectiveMarkerUID !== uid
  ) {
    return
  }

  press = {
    uid,
    x: event.nativeEvent.clientX,
    y: event.nativeEvent.clientY,
    dragging: false,
    target: null,
  }
  if (cameraControlsRef?.current) cameraControlsRef.current.enabled = false
  clearPreview()
  listen()
}

export function reportObjectiveMarkerDragTarget(
  hex: BoardHex,
  event: ThreeEvent<PointerEvent>,
) {
  if (!press?.dragging) return false
  const state = useBoundStore.getState()
  const marker = state.hexMap.objectiveMarkers?.find(
    (item) => item.uid === press?.uid,
  )
  if (!marker) return false

  if (cachedHexMap !== state.hexMap) {
    cachedHexMap = state.hexMap
    cachedMapHexIDs = mapTableHexes(state.hexMap)
  }
  const candidate: ObjectiveMarker = {
    ...marker,
    anchor: {
      q: hex.q,
      r: hex.r,
      s: hex.s,
      altitude: hex.altitude,
    },
  }
  const placement = getObjectiveMarkerPlacementStatus({
    marker: candidate,
    boardHexes: state.boardHexes,
    mapHexIDs: cachedMapHexIDs,
    markers: state.hexMap.objectiveMarkers ?? [],
  })
  const previous = press.target
  if (
    !previous ||
    previous.marker.anchor.q !== candidate.anchor.q ||
    previous.marker.anchor.r !== candidate.anchor.r ||
    previous.marker.anchor.s !== candidate.anchor.s ||
    previous.marker.anchor.altitude !== candidate.anchor.altitude ||
    previous.placement.status !== placement.status ||
    (previous.placement.status === 'blocked' &&
      placement.status === 'blocked' &&
      previous.placement.reason !== placement.reason)
  ) {
    press.target = { marker: candidate, placement }
    state.setObjectiveMarkerDragPreview({
      marker: candidate,
      status: placement.status,
      ...(placement.status === 'blocked' ? { reason: placement.reason } : {}),
    })
  }
  hitThisMove = true
  event.stopPropagation()
  return true
}

function isCanvasEvent(event: Event) {
  const canvas = getR3F?.().gl.domElement
  return (
    !!canvas && event.target instanceof Node && canvas.contains(event.target)
  )
}

function onWindowPointerMoveCapture(event: PointerEvent) {
  if (!press) return
  hitThisMove = false
  if (
    !press.dragging &&
    Math.hypot(event.clientX - press.x, event.clientY - press.y) >=
      DRAG_TOLERANCE
  ) {
    press.dragging = true
    forgetStoppedHovers()
  }
}

function onWindowPointerMove() {
  if (
    press?.dragging &&
    !hitThisMove &&
    useBoundStore.getState().objectiveMarkerDragPreview
  ) {
    press.target = null
    clearPreview()
  }
}

function forgetStoppedHovers() {
  const hovered = getR3F?.().internal.hovered
  if (!hovered) return
  for (const entry of hovered.values()) {
    ;(entry as { stopped?: boolean }).stopped = false
  }
}

function onWindowPointerUpCapture(event: PointerEvent) {
  if (!press || event.button !== 0) return
  const current = press
  if (current.dragging) {
    event.preventDefault()
    event.stopPropagation()
    if (
      isCanvasEvent(event) &&
      current.target?.placement.status === 'ok'
    ) {
      useBoundStore
        .getState()
        .moveObjectiveMarker(current.uid, current.target.marker.anchor)
    }
    swallowNextClick()
  }
  end()
}

function onWindowPointerCancel() {
  end()
}

function onWindowKeyDownCapture(event: KeyboardEvent) {
  if (!press || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  end()
}

function onWindowBlur() {
  end()
}

function onWindowPointerDownCapture() {
  if (!press && swallowingClick) stopSwallowingClicks()
}

let swallowingClick = false

function onWindowClickCapture(event: MouseEvent) {
  event.stopPropagation()
  stopSwallowingClicks()
}

function swallowNextClick() {
  if (swallowingClick) return
  swallowingClick = true
  window.addEventListener('click', onWindowClickCapture, true)
  window.addEventListener('pointerdown', onWindowPointerDownCapture, true)
}

function stopSwallowingClicks() {
  if (!swallowingClick) return
  swallowingClick = false
  window.removeEventListener('click', onWindowClickCapture, true)
  window.removeEventListener('pointerdown', onWindowPointerDownCapture, true)
}

function listen() {
  window.addEventListener('pointermove', onWindowPointerMoveCapture, true)
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUpCapture, true)
  window.addEventListener('pointercancel', onWindowPointerCancel)
  window.addEventListener('keydown', onWindowKeyDownCapture, true)
  window.addEventListener('blur', onWindowBlur)
}

function unlisten() {
  window.removeEventListener('pointermove', onWindowPointerMoveCapture, true)
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUpCapture, true)
  window.removeEventListener('pointercancel', onWindowPointerCancel)
  window.removeEventListener('keydown', onWindowKeyDownCapture, true)
  window.removeEventListener('blur', onWindowBlur)
}

function end() {
  if (!press) return
  press = null
  unlisten()
  const { isCameraDisabled, isTakingPicture } = useBoundStore.getState()
  if (cameraControlsRef?.current) {
    cameraControlsRef.current.enabled = !(isCameraDisabled || isTakingPicture)
  }
  clearPreview()
}

function clearPreview() {
  const state = useBoundStore.getState()
  if (state.objectiveMarkerDragPreview) {
    state.setObjectiveMarkerDragPreview(null)
  }
}

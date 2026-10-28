import { PICK_PEN_MODE, SELECT_PEN_MODE } from '../types'

type WorldPoint = { x: number; z: number }

let lastPointerWorldPoint: WorldPoint | undefined

export function shouldTrackHoveredWorldPoint(penMode: string) {
  return penMode !== PICK_PEN_MODE && penMode !== SELECT_PEN_MODE
}

export function rememberPointerWorldPoint(point: WorldPoint) {
  lastPointerWorldPoint = point
}

export function getLastPointerWorldPoint() {
  return lastPointerWorldPoint
}

export function clearLastPointerWorldPoint() {
  lastPointerWorldPoint = undefined
}

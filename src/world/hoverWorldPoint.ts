import { PICK_PEN_MODE, SELECT_PEN_MODE } from '../types'

export function shouldTrackHoveredWorldPoint(penMode: string) {
  return penMode !== PICK_PEN_MODE && penMode !== SELECT_PEN_MODE
}

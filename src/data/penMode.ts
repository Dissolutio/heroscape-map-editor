import { PICK_PEN_MODE, SELECT_PEN_MODE } from '../types'
import { OBJECTIVE_MARKER_PEN_MODE } from './objectiveMarkers'

const nonPaintingPenModes = new Set([
  SELECT_PEN_MODE,
  PICK_PEN_MODE,
  OBJECTIVE_MARKER_PEN_MODE,
])

export const isPlacementPenMode = (mode: string) =>
  !nonPaintingPenModes.has(mode)

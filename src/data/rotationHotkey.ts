import { WHEEL_ROTATION_COOLDOWN_MS } from './dragRotation'
import { isPlacementPenMode } from './penMode'

export type RotationHotkeyTarget =
  | 'drag'
  | 'selection'
  | 'objective-marker'
  | 'pen-mode'

export function getRotationHotkeyTarget({
  isDragging,
  selectedPieceCount,
  hasSelectedObjectiveMarker,
  penMode,
}: {
  isDragging: boolean
  selectedPieceCount: number
  hasSelectedObjectiveMarker: boolean
  penMode: string
}): RotationHotkeyTarget {
  if (isDragging) return 'drag'
  if (isPlacementPenMode(penMode)) return 'pen-mode'
  if (selectedPieceCount > 0) return 'selection'
  if (hasSelectedObjectiveMarker) return 'objective-marker'
  return 'pen-mode'
}

export function isRotationHotkeyReady(lastStepAt: number | null, time: number) {
  return lastStepAt === null || time - lastStepAt >= WHEEL_ROTATION_COOLDOWN_MS
}

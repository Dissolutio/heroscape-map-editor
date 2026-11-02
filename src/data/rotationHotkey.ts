import { WHEEL_ROTATION_COOLDOWN_MS } from './dragRotation'

export type RotationHotkeyTarget =
  | 'drag'
  | 'selection'
  | 'objective-marker'
  | 'pen-mode'

export function getRotationHotkeyTarget({
  isDragging,
  selectedPieceCount,
  hasSelectedObjectiveMarker,
}: {
  isDragging: boolean
  selectedPieceCount: number
  hasSelectedObjectiveMarker: boolean
}): RotationHotkeyTarget {
  if (isDragging) return 'drag'
  if (selectedPieceCount > 0) return 'selection'
  if (hasSelectedObjectiveMarker) return 'objective-marker'
  return 'pen-mode'
}

export function isRotationHotkeyReady(lastStepAt: number | null, time: number) {
  return lastStepAt === null || time - lastStepAt >= WHEEL_ROTATION_COOLDOWN_MS
}

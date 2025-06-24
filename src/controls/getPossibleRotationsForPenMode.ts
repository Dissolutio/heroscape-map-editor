import { Pieces } from "../types"

export function getPossibleRotationsForPenMode(penMode: string) {
  const regularRotations = [0, 1, 2, 3, 4, 5]
  // const partialRotations = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
  const allRotations = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
  return penMode === Pieces.laurWallTrianglePillar ||
    penMode === Pieces.laurWallRuin1 ||
    penMode === Pieces.laurWallRuin2 ||
    penMode === Pieces.laurWallRuin3 ||
    penMode === Pieces.laurWallLong ||
    penMode === Pieces.laurWallLongStackable
    ? allRotations
    : regularRotations
}
export function doPenModeRotation(penMode: string, penModeRotation: number, togglePenModeRotation: (s: number) => void) {
  // impl:
  // doPenModeRotation(penMode, penModeRotation, togglePenModeRotation)
  const possibleRotations = getPossibleRotationsForPenMode(penMode)
  const nextHighest = possibleRotations.findIndex(r => r > penModeRotation)
  togglePenModeRotation(possibleRotations[nextHighest === -1 ? 0 : nextHighest])
}

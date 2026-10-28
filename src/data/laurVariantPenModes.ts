import type { PieceInventory } from '../types'
import { Pieces } from '../types'
import {
  areMatchingLaurPillarShapes,
  isLaurPillarID,
} from './laurPillarStacking'

const stackableVariantByPen: Record<string, string> = {
  [Pieces.laurWallSquarePillar]: Pieces.laurWallPillarStackable,
  [Pieces.laurWallShort]: Pieces.laurWallShortStackable,
  [Pieces.laurWallLong]: Pieces.laurWallLongStackable,
}

export function getLaurStackableVariantID(penID: string) {
  return stackableVariantByPen[penID]
}

export type LaurVariantPenTarget = {
  inventoryID: string
  isStackPosition: boolean
}

export type LaurVariantPlacementDecision =
  | { kind: 'place-as'; pieceID: string }
  | { kind: 'ask'; pieceID: string }
  | { kind: 'refuse' }

export function decideLaurVariantPlacement({
  penID,
  target,
  availableInventory,
}: {
  penID: string
  target?: LaurVariantPenTarget
  /** Remaining inventory; undefined means there are no inventory limits. */
  availableInventory?: PieceInventory
}): LaurVariantPlacementDecision {
  if (
    target &&
    isLaurPillarID(penID) &&
    isLaurPillarID(target.inventoryID) &&
    !areMatchingLaurPillarShapes(penID, target.inventoryID)
  ) {
    return { kind: 'refuse' }
  }

  const stackableID = getLaurStackableVariantID(penID)
  if (!stackableID || !target?.isStackPosition) {
    return { kind: 'place-as', pieceID: penID }
  }

  if (
    availableInventory === undefined ||
    (availableInventory[stackableID] ?? 0) > 0
  ) {
    return { kind: 'place-as', pieceID: stackableID }
  }

  return { kind: 'ask', pieceID: stackableID }
}

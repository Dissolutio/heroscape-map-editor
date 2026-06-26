import {
  type BoardPiece,
  type ObjectiveMarkerMetadata,
  Pieces,
  PiecePrefixes,
} from '../types'

export const objectiveMarkerInventoryIDs = new Set<string>([
  Pieces.objectiveMarkerType11,
  Pieces.objectiveMarkerType12,
  Pieces.objectiveMarkerType21,
  Pieces.objectiveMarkerType22,
])

export function isObjectiveMarkerInventoryID(inventoryID: string) {
  return objectiveMarkerInventoryIDs.has(inventoryID)
}

export function isObjectiveMarkerPenMode(penMode: string) {
  return (
    penMode === PiecePrefixes.objectiveMarker1 ||
    penMode === PiecePrefixes.objectiveMarker2
  )
}

export function getObjectiveMarkerDefaultIconText(order: number) {
  return String(Math.max(1, order)).slice(0, 2)
}

export function sanitizeObjectiveMarkerIconText(iconText: string) {
  return (iconText ?? '').trim().slice(0, 2)
}

export function sanitizeObjectiveMarkerLabel(label: string) {
  return (label ?? '').slice(0, 80)
}

export function sanitizeObjectiveMarkerMetadata(
  metadata: Partial<ObjectiveMarkerMetadata>,
  defaultOrder: number,
): ObjectiveMarkerMetadata {
  const iconText = sanitizeObjectiveMarkerIconText(
    metadata.iconText ?? getObjectiveMarkerDefaultIconText(defaultOrder),
  )
  return {
    iconText:
      iconText.length > 0
        ? iconText
        : getObjectiveMarkerDefaultIconText(defaultOrder),
    label: sanitizeObjectiveMarkerLabel(metadata.label ?? ''),
  }
}

export function sanitizeObjectiveMarkerMetadataDraft(
  metadata: Partial<ObjectiveMarkerMetadata>,
): ObjectiveMarkerMetadata {
  return {
    iconText: sanitizeObjectiveMarkerIconText(metadata.iconText ?? ''),
    label: sanitizeObjectiveMarkerLabel(metadata.label ?? ''),
  }
}

export function getObjectiveMarkerBoardPiecesInCreationOrder(
  boardPieces: BoardPiece[],
) {
  return boardPieces.filter((bp) =>
    isObjectiveMarkerInventoryID(bp.inventoryID),
  )
}

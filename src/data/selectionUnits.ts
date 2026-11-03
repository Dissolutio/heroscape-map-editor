export type SelectionUnit = {
  pieceUIDs: string[]
  objectiveMarkerUID?: string
}

export type SavedSelection = SelectionUnit & {
  id: string
  name: string
}

export const SAVED_SELECTION_LIMIT = 20

export function normalizeSavedSelections(value: unknown): SavedSelection[] {
  if (!Array.isArray(value)) return []

  const selections: SavedSelection[] = []
  const usedIDs = new Set<string>()
  for (const candidate of value) {
    if (typeof candidate !== 'object' || candidate === null) continue
    const item = candidate as Record<string, unknown>
    if (
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      usedIDs.has(item.id) ||
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) {
      continue
    }

    const pieceUIDs = Array.isArray(item.pieceUIDs)
      ? [
          ...new Set(
            item.pieceUIDs.filter(
              (uid): uid is string => typeof uid === 'string' && uid.length > 0,
            ),
          ),
        ]
      : []
    const objectiveMarkerUID =
      typeof item.objectiveMarkerUID === 'string' &&
      item.objectiveMarkerUID.length > 0
        ? item.objectiveMarkerUID
        : undefined
    if (!pieceUIDs.length && !objectiveMarkerUID) continue

    usedIDs.add(item.id)
    selections.push({
      id: item.id,
      name: item.name.trim(),
      pieceUIDs,
      ...(objectiveMarkerUID ? { objectiveMarkerUID } : {}),
    })
    if (selections.length === SAVED_SELECTION_LIMIT) break
  }
  return selections
}

export function resolveSelectionUnit(
  selection: SelectionUnit,
  pieceUIDs: ReadonlySet<string>,
  visiblePieceUIDs: ReadonlySet<string>,
  objectiveMarkerUIDs: ReadonlySet<string>,
): SelectionUnit | undefined {
  const resolvedPieceUIDs = selection.pieceUIDs.filter(
    (uid) => pieceUIDs.has(uid) && visiblePieceUIDs.has(uid),
  )
  const objectiveMarkerUID =
    selection.objectiveMarkerUID &&
    objectiveMarkerUIDs.has(selection.objectiveMarkerUID)
      ? selection.objectiveMarkerUID
      : undefined
  if (!resolvedPieceUIDs.length && !objectiveMarkerUID) return undefined
  return {
    pieceUIDs: resolvedPieceUIDs,
    ...(objectiveMarkerUID ? { objectiveMarkerUID } : {}),
  }
}

export function pruneDeletedPiece(
  selections: SavedSelection[],
  deletedUID: string,
): SavedSelection[] {
  return selections.flatMap((selection) => {
    const pieceUIDs = selection.pieceUIDs.filter((uid) => uid !== deletedUID)
    return pieceUIDs.length || selection.objectiveMarkerUID
      ? [{ ...selection, pieceUIDs }]
      : []
  })
}

export function pruneSavedSelections(
  selections: SavedSelection[],
  existingPieceUIDs: ReadonlySet<string>,
  existingObjectiveMarkerUIDs: ReadonlySet<string>,
): SavedSelection[] {
  return selections.flatMap((selection) => {
    const pieceUIDs = selection.pieceUIDs.filter((uid) =>
      existingPieceUIDs.has(uid),
    )
    const objectiveMarkerUID =
      selection.objectiveMarkerUID &&
      existingObjectiveMarkerUIDs.has(selection.objectiveMarkerUID)
        ? selection.objectiveMarkerUID
        : undefined
    return pieceUIDs.length || objectiveMarkerUID
      ? [
          {
            ...selection,
            pieceUIDs,
            ...(objectiveMarkerUID ? { objectiveMarkerUID } : {}),
          },
        ]
      : []
  })
}

export function saveNamedSelection(
  selections: SavedSelection[],
  selection: SelectionUnit,
  name: string,
  id: string,
): { selections: SavedSelection[]; result: 'saved' | 'empty' | 'full' } {
  if (selections.length >= SAVED_SELECTION_LIMIT) {
    return { selections, result: 'full' }
  }
  const trimmedName = name.trim()
  const pieceUIDs = [...new Set(selection.pieceUIDs)]
  if (!trimmedName || (!pieceUIDs.length && !selection.objectiveMarkerUID)) {
    return { selections, result: 'empty' }
  }
  return {
    selections: [
      ...selections,
      {
        id,
        name: trimmedName,
        pieceUIDs,
        ...(selection.objectiveMarkerUID
          ? { objectiveMarkerUID: selection.objectiveMarkerUID }
          : {}),
      },
    ],
    result: 'saved',
  }
}

export function renameSavedSelection(
  selections: SavedSelection[],
  id: string,
  name: string,
): SavedSelection[] {
  const trimmedName = name.trim()
  if (!trimmedName) return selections
  return selections.map((selection) =>
    selection.id === id ? { ...selection, name: trimmedName } : selection,
  )
}

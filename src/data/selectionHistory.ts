export const SELECTION_HISTORY_LIMIT = 20

export type SelectionHistoryEntry = {
  pieceUIDs: string[]
  objectiveMarkerUID: string | null
  selectedAt: number
}

export type SelectionHistoryState = {
  entries: SelectionHistoryEntry[]
  cursor: number
}

type SelectionAvailability = {
  pieceUIDs: ReadonlySet<string>
  visiblePieceUIDs: ReadonlySet<string>
  objectiveMarkerUIDs: ReadonlySet<string>
}

export function sameSelection(
  first: SelectionHistoryEntry,
  second: SelectionHistoryEntry,
) {
  return (
    first.objectiveMarkerUID === second.objectiveMarkerUID &&
    first.pieceUIDs.length === second.pieceUIDs.length &&
    first.pieceUIDs.every((uid, index) => uid === second.pieceUIDs[index])
  )
}

export function appendSelectionHistoryEntry(
  state: SelectionHistoryState,
  entry: SelectionHistoryEntry,
): SelectionHistoryState {
  const entries =
    state.cursor >= 0 ? state.entries.slice(0, state.cursor + 1) : []
  const latest = entries[entries.length - 1]
  if (latest && sameSelection(latest, entry)) {
    return { entries, cursor: entries.length - 1 }
  }

  const nextEntries = [...entries, entry].slice(-SELECTION_HISTORY_LIMIT)
  return { entries: nextEntries, cursor: nextEntries.length - 1 }
}

export function resolveSelectionHistory(
  state: SelectionHistoryState,
  availability: SelectionAvailability,
): SelectionHistoryState {
  const retainedIndexes: number[] = []
  const entries: SelectionHistoryEntry[] = []

  state.entries.forEach((entry, index) => {
    if (entry.objectiveMarkerUID) {
      if (!availability.objectiveMarkerUIDs.has(entry.objectiveMarkerUID)) {
        return
      }
      retainedIndexes.push(index)
      entries.push(entry)
      return
    }

    const pieceUIDs = entry.pieceUIDs.filter(
      (uid) =>
        availability.pieceUIDs.has(uid) &&
        availability.visiblePieceUIDs.has(uid),
    )
    if (entry.pieceUIDs.length && !pieceUIDs.length) return

    retainedIndexes.push(index)
    entries.push({ ...entry, pieceUIDs })
  })

  const cursorIndex = retainedIndexes.indexOf(state.cursor)
  const cursor =
    cursorIndex >= 0
      ? cursorIndex
      : retainedIndexes.filter((index) => index < state.cursor).length - 1

  return { entries, cursor }
}

export function navigateSelectionHistory(
  state: SelectionHistoryState,
  current: SelectionHistoryEntry,
  direction: -1 | 1,
): SelectionHistoryState {
  if (!state.entries.length) return { entries: state.entries, cursor: -1 }

  const cursorEntry = state.entries[state.cursor]
  const target =
    cursorEntry && !sameSelection(cursorEntry, current)
      ? state.cursor
      : state.cursor < 0
        ? direction < 0
          ? state.entries.length - 1
          : 0
        : state.cursor + direction
  if (target < 0 || target >= state.entries.length) return state

  return { entries: state.entries, cursor: target }
}

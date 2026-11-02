import { describe, expect, it } from 'vitest'
import {
  appendSelectionHistoryEntry,
  navigateSelectionHistory,
  resolveSelectionHistory,
  type SelectionHistoryEntry,
  type SelectionHistoryState,
} from '../data/selectionHistory'

const selection = (
  pieceUIDs: string[],
  selectedAt = 0,
): SelectionHistoryEntry => ({
  pieceUIDs,
  objectiveMarkerUID: null,
  selectedAt,
})

const emptyHistory: SelectionHistoryState = { entries: [], cursor: -1 }

describe('selection history', () => {
  it('records settled selections, skips duplicate top entries, and caps history', () => {
    let history = appendSelectionHistoryEntry(emptyHistory, selection(['a'], 1))
    history = appendSelectionHistoryEntry(history, selection(['a'], 2))
    expect(history.entries).toHaveLength(1)
    expect(history.entries[0]?.selectedAt).toBe(1)

    for (let index = 0; index < 25; index += 1) {
      history = appendSelectionHistoryEntry(
        history,
        selection([String(index)], index + 3),
      )
    }

    expect(history.entries).toHaveLength(20)
    expect(history.entries[0]?.pieceUIDs).toEqual(['5'])
    expect(history.cursor).toBe(19)
  })

  it('navigates back and forward without truncating forward entries', () => {
    let history = appendSelectionHistoryEntry(emptyHistory, selection(['a']))
    history = appendSelectionHistoryEntry(history, selection(['b'], 1))
    history = appendSelectionHistoryEntry(history, selection(['c'], 2))

    const back = navigateSelectionHistory(history, selection(['c']), -1)
    expect(back.cursor).toBe(1)
    const forward = navigateSelectionHistory(back, selection(['b']), 1)

    expect(forward.cursor).toBe(2)
    expect(forward.entries).toEqual(history.entries)
  })

  it('drops fully stale and hidden selections and filters partial groups', () => {
    const history = appendSelectionHistoryEntry(emptyHistory, selection(['a']))
    const withStale = appendSelectionHistoryEntry(
      history,
      selection(['b', 'gone']),
    )
    const withMissing = appendSelectionHistoryEntry(
      withStale,
      selection(['gone']),
    )
    const resolved = resolveSelectionHistory(withMissing, {
      pieceUIDs: new Set(['a', 'b']),
      visiblePieceUIDs: new Set(['a']),
      objectiveMarkerUIDs: new Set(),
    })

    expect(resolved.entries.map((entry) => entry.pieceUIDs)).toEqual([['a']])
    expect(resolved.cursor).toBe(0)
  })

  it('keeps marker selections only while the marker exists', () => {
    const marker: SelectionHistoryEntry = {
      pieceUIDs: [],
      objectiveMarkerUID: 'marker',
      selectedAt: 0,
    }
    const history = appendSelectionHistoryEntry(emptyHistory, marker)

    expect(
      resolveSelectionHistory(history, {
        pieceUIDs: new Set(),
        visiblePieceUIDs: new Set(),
        objectiveMarkerUIDs: new Set(),
      }).entries,
    ).toEqual([])
  })
})

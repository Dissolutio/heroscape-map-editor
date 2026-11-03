import { describe, expect, it } from 'vitest'
import {
  normalizeSavedSelections,
  pruneDeletedPiece,
  renameSavedSelection,
  resolveSelectionUnit,
  saveNamedSelection,
  SAVED_SELECTION_LIMIT,
  type SavedSelection,
} from '../data/selectionUnits'

const saved: SavedSelection[] = [
  { id: 'group', name: 'Group', pieceUIDs: ['a', 'b', 'gone'] },
  { id: 'marker', name: 'Marker', pieceUIDs: [], objectiveMarkerUID: 'm1' },
]

describe('selection units', () => {
  it('resolves only existing visible pieces and existing markers', () => {
    expect(
      resolveSelectionUnit(
        saved[0]!,
        new Set(['a', 'b']),
        new Set(['a']),
        new Set(),
      ),
    ).toEqual({ pieceUIDs: ['a'] })
    expect(
      resolveSelectionUnit(
        saved[1]!,
        new Set(),
        new Set(),
        new Set(),
      ),
    ).toBeUndefined()
    expect(
      resolveSelectionUnit(
        saved[1]!,
        new Set(),
        new Set(),
        new Set(['m1']),
      ),
    ).toEqual({ pieceUIDs: [], objectiveMarkerUID: 'm1' })
  })

  it('saves, renames, and deletes selections with a cap of 20', () => {
    const savedResult = saveNamedSelection([], { pieceUIDs: ['a', 'a'] }, '  Alpha  ', 'a1')
    expect(savedResult).toEqual({
      result: 'saved',
      selections: [{ id: 'a1', name: 'Alpha', pieceUIDs: ['a'] }],
    })
    expect(renameSavedSelection(savedResult.selections, 'a1', 'Beta')).toEqual([
      { id: 'a1', name: 'Beta', pieceUIDs: ['a'] },
    ])
    expect(renameSavedSelection(savedResult.selections, 'a1', '  ')).toBe(
      savedResult.selections,
    )

    const full = Array.from({ length: SAVED_SELECTION_LIMIT }, (_, index) => ({
      id: String(index),
      name: `Saved ${index}`,
      pieceUIDs: ['a'],
    }))
    expect(
      saveNamedSelection(full, { pieceUIDs: ['b'] }, 'Extra', 'extra'),
    ).toEqual({ selections: full, result: 'full' })
    expect(
      saveNamedSelection([], { pieceUIDs: [] }, 'Empty', 'empty').result,
    ).toBe('empty')
  })

  it('prunes deleted pieces and removes units that become empty', () => {
    expect(pruneDeletedPiece(saved, 'gone')).toEqual([
      { id: 'group', name: 'Group', pieceUIDs: ['a', 'b'] },
      saved[1],
    ])
    expect(
      pruneDeletedPiece(
        [{ id: 'only', name: 'Only', pieceUIDs: ['a'] }],
        'a',
      ),
    ).toEqual([])
  })

  it('normalizes malformed and legacy absent fields safely', () => {
    expect(normalizeSavedSelections(undefined)).toEqual([])
    expect(
      normalizeSavedSelections([
        { id: 'ok', name: ' Keep ', pieceUIDs: ['a', 'a', 1] },
        { id: 'empty', name: 'Empty', pieceUIDs: [] },
        { id: 'bad', name: '', pieceUIDs: ['a'] },
      ]),
    ).toEqual([{ id: 'ok', name: 'Keep', pieceUIDs: ['a'] }])
  })
})

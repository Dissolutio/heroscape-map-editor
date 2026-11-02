import { describe, expect, it } from 'vitest'
import {
  ACTION_LOG_COLLAPSED_TIMEOUT_MS,
  ACTION_LOG_LIMIT,
  appendActionLogEntry,
  formatActionLogAge,
  formatActionLogAction,
  type ActionLogEntry,
} from './action-log'

describe('action log formatting', () => {
  it.each([
    [{ type: 'place', pieceName: '7-hex Grass' }, 'Placed 7-hex Grass'],
    [
      {
        type: 'move',
        pieceName: '1-hex Grass',
        count: 1,
      },
      'Moved 1-hex Grass',
    ],
    [
      {
        type: 'move',
        pieceName: '2-hex Grass',
        count: 3,
      },
      'Moved 3 pieces',
    ],
    [
      { type: 'rotate', pieceName: '1-hex Grass', count: 1 },
      'Rotated 1-hex Grass',
    ],
    [
      { type: 'rotate', pieceName: '1-hex Grass', count: 3 },
      'Rotated 3 pieces (lead: 1-hex Grass)',
    ],
    [{ type: 'delete', pieceName: 'Water 1' }, 'Deleted Water 1'],
    [{ type: 'convert', count: 2 }, 'Converted 2 pieces'],
    [{ type: 'convert', count: 1 }, 'Converted 1 piece'],
    [
      {
        type: 'marker',
        operation: 'add',
        label: 'Elite',
      },
      'Added objective marker Elite',
    ],
    [{ type: 'marker', operation: 'move' }, 'Moved objective marker'],
    [
      { type: 'marker', operation: 'edit', label: 'Elite' },
      'Edited objective marker Elite',
    ],
    [
      { type: 'marker', operation: 'remove', label: 'Elite' },
      'Removed objective marker Elite',
    ],
    [{ type: 'undo', description: 'Moved Grass' }, 'Undid: Moved Grass'],
    [{ type: 'redo', description: 'Placed Grass' }, 'Redid: Placed Grass'],
  ] as const)('formats %s', (action, text) => {
    expect(formatActionLogAction(action).text).toBe(text)
  })

  it('marks warnings distinctly and does not make them undoable', () => {
    expect(
      formatActionLogAction({ type: 'warning', text: 'Blocked' }),
    ).toMatchObject({
      kind: 'warning',
      severity: 'warning',
      undoable: false,
    })
  })
})

describe('action log relative age', () => {
  it.each([
    [0, 'just now'],
    [4_999, 'just now'],
    [5_000, '5s ago'],
    [59_999, '59s ago'],
    [60_000, '1 min ago'],
    [120_000, '2 min ago'],
    [3_600_000, '1 hr ago'],
    [-1, 'just now'],
  ])('formats %i ms as %s', (ageMs, text) => {
    expect(formatActionLogAge(ageMs)).toBe(text)
  })

  it('uses an 8-second collapsed timeout', () => {
    expect(ACTION_LOG_COLLAPSED_TIMEOUT_MS).toBe(8_000)
  })
})

describe('action log ring buffer', () => {
  it('keeps only the newest 200 entries and clears to an empty list', () => {
    const entries = Array.from(
      { length: ACTION_LOG_LIMIT + 2 },
      (_, index) => ({
        id: `${index}`,
        time: index,
        kind: 'place' as const,
        severity: 'info' as const,
        text: `Placed ${index}`,
        undoable: true,
      }),
    )
    const result = entries.reduce<ActionLogEntry[]>(
      (current, entry) => appendActionLogEntry(current, entry),
      [],
    )
    const oldestEntry = entries[0]
    if (!oldestEntry) throw new Error('Expected the ring buffer fixture')

    expect(result).toHaveLength(ACTION_LOG_LIMIT)
    expect(result[0]?.text).toBe('Placed 2')
    expect(appendActionLogEntry(result, oldestEntry, 0)).toEqual([])
  })
})

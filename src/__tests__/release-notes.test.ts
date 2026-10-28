import { describe, expect, it } from 'vitest'
import {
  decideReleaseNotes,
  parseReleaseNotes,
  type ReleaseNoteEntry,
} from '../data/releaseNotes'

const entries: ReleaseNoteEntry[] = [
  { id: 'Oct-18-2026', items: [] },
  { id: 'Oct-17-2026', items: [] },
  { id: 'Sep-27-2026', items: [] },
  { id: 'Sep-23-2026', items: [] },
  { id: 'Sep-12-2026', items: [] },
  { id: 'Sep-08-2026', items: [] },
]

describe('parseReleaseNotes', () => {
  it('parses dated entries, TLDR, bullets, bold and italic source text', () => {
    expect(
      parseReleaseNotes(
        'Oct-18-2026\nTLDR: Click *most* pieces\n- **Drag**: Use **bold** and *italic*.',
      ),
    ).toEqual([
      {
        id: 'Oct-18-2026',
        tldr: 'Click *most* pieces',
        items: [{ title: 'Drag', body: 'Use **bold** and *italic*.' }],
      },
    ])
  })

  it('parses entries without a TLDR', () => {
    expect(parseReleaseNotes('Oct-17-2026\n- **Tools**: New tools.')).toEqual([
      { id: 'Oct-17-2026', items: [{ title: 'Tools', body: 'New tools.' }] },
    ])
  })

  it('keeps unknown non-empty lines as plain items', () => {
    expect(
      parseReleaseNotes('Oct-18-2026\nUnexpected text\n- broken bullet'),
    ).toEqual([
      {
        id: 'Oct-18-2026',
        items: [
          { title: '', body: 'Unexpected text' },
          { title: '', body: '- broken bullet' },
        ],
      },
    ])
  })

  it('preserves unheaded text and does not throw on empty input', () => {
    expect(parseReleaseNotes('Loose text')).toEqual([
      { id: '', items: [{ title: '', body: 'Loose text' }] },
    ])
    expect(parseReleaseNotes(' \n\n')).toEqual([])
  })
})

describe('decideReleaseNotes', () => {
  it('stores the newest id without showing notes on a first visit', () => {
    expect(decideReleaseNotes(entries, null, true)).toEqual({
      newestId: 'Oct-18-2026',
      entriesToShow: [],
      shouldStore: true,
    })
  })

  it('does not show notes when the newest id was already seen', () => {
    expect(decideReleaseNotes(entries, 'Oct-18-2026', true)).toMatchObject({
      entriesToShow: [],
      shouldStore: false,
    })
  })

  it('shows every newer entry, capped at five', () => {
    expect(
      decideReleaseNotes(entries, 'Sep-08-2026', true).entriesToShow,
    ).toEqual(entries.slice(0, 5))
  })

  it('shows the latest three entries when the stored id is unknown', () => {
    expect(decideReleaseNotes(entries, 'missing', true).entriesToShow).toEqual(
      entries.slice(0, 3),
    )
  })

  it('does nothing when storage is unavailable', () => {
    expect(decideReleaseNotes(entries, 'Sep-08-2026', false)).toEqual({
      newestId: 'Oct-18-2026',
      entriesToShow: [],
      shouldStore: false,
    })
  })
})

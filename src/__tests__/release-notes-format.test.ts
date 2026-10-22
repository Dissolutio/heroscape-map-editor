import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseReleaseNotes } from '../data/releaseNotes'

const text = readFileSync(resolve(process.cwd(), 'release-notes.md'), 'utf8')
const lines = text.split(/\r?\n/)
const headingPattern = /^[A-Z][a-z]{2}-\d{2}-\d{4}$/

describe('release-notes.md headings', () => {
  it('starts with a valid heading', () => {
    const firstLine = lines.find((line) => line.trim()) ?? ''
    const firstLineNumber = Math.max(
      1,
      lines.findIndex((line) => line.trim()) + 1,
    )
    expect(
      headingPattern.test(firstLine),
      `Invalid first non-blank line ${firstLineNumber}: "${firstLine}"`,
    ).toBe(true)
  })

  it('uses only valid headings, TLDR lines, and bullets', () => {
    const invalidLines = lines.flatMap((line, index) => {
      if (
        !line.trim() ||
        line.startsWith('- ') ||
        line.startsWith('TLDR:') ||
        headingPattern.test(line)
      ) {
        return []
      }
      return [{ lineNumber: index + 1, text: line }]
    })

    expect(
      invalidLines,
      `Invalid release-notes.md lines:\n${invalidLines
        .map(({ lineNumber, text }) => `line ${lineNumber}: ${text}`)
        .join('\n')}`,
    ).toEqual([])
  })

  it('uses unique valid heading ids', () => {
    const seen = new Set<string>()

    lines.forEach((line, index) => {
      if (!headingPattern.test(line)) return
      expect(
        seen.has(line),
        `Duplicate release-note heading at line ${index + 1}: "${line}"`,
      ).toBe(false)
      seen.add(line)
    })
  })

  it('parses every entry with a non-empty id and at least one item', () => {
    const entries = parseReleaseNotes(text)

    for (const entry of entries) {
      const lineNumber = entry.id
        ? lines.findIndex((line) => line === entry.id) + 1
        : lines.findIndex((line) => line.trim()) + 1
      const sourceLine = entry.id || lines[lineNumber - 1] || ''
      expect(
        entry.id.trim(),
        `Release-note entry has no id at line ${lineNumber}: "${sourceLine}"`,
      ).not.toBe('')
      expect(
        entry.items.length,
        `Release-note entry has no items at line ${lineNumber}: "${sourceLine}"`,
      ).toBeGreaterThan(0)
    }
  })
})

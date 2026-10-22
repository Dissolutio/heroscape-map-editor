import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseReleaseNotes } from '../data/releaseNotes'

const text = readFileSync(resolve(process.cwd(), 'release-notes.md'), 'utf8')
const lines = text.split(/\r?\n/)
const headingPattern = /^[A-Z][a-z]{2}-\d{2}-\d{4}$/
const monthPrefixPattern = /^[A-Z][a-z]{2}-/

describe('release-notes.md headings', () => {
  it('starts with a valid heading', () => {
    const firstLine = lines.find((line) => line.trim()) ?? ''
    expect(
      headingPattern.test(firstLine),
      `Invalid first non-blank heading line: "${firstLine}"`,
    ).toBe(true)
  })

  it('uses valid, unique heading ids for every capitalized month heading', () => {
    const seen = new Set<string>()

    for (const line of lines) {
      if (!monthPrefixPattern.test(line)) continue

      expect(
        headingPattern.test(line),
        `Invalid release-note heading line: "${line}"`,
      ).toBe(true)
      expect(
        seen.has(line),
        `Duplicate release-note heading line: "${line}"`,
      ).toBe(false)
      seen.add(line)
    }
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

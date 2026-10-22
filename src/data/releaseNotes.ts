export type ReleaseNoteItem = {
  title: string
  body: string
}

export type ReleaseNoteEntry = {
  id: string
  tldr?: string
  items: ReleaseNoteItem[]
}

const headingPattern = /^[A-Z][a-z]{2}-\d{2}-\d{4}$/
const bulletPattern = /^- \*\*(.+?)\*\*:\s*(.*)$/

export function parseReleaseNotes(text: string): ReleaseNoteEntry[] {
  const entries: ReleaseNoteEntry[] = []
  let current: ReleaseNoteEntry | undefined

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (headingPattern.test(trimmed)) {
      current = { id: trimmed, items: [] }
      entries.push(current)
      continue
    }

    if (!current) {
      current = { id: '', items: [] }
      entries.push(current)
    }

    if (trimmed.startsWith('TLDR:')) {
      current.tldr = trimmed.slice('TLDR:'.length).trim()
      continue
    }

    const bullet = bulletPattern.exec(trimmed)
    if (bullet) {
      current.items.push({ title: bullet[1], body: bullet[2] })
      continue
    }

    current.items.push({ title: '', body: trimmed })
  }

  return entries
}

export type ReleaseNotesDecision = {
  newestId: string | null
  entriesToShow: ReleaseNoteEntry[]
  shouldStore: boolean
}

export function decideReleaseNotes(
  entries: ReleaseNoteEntry[],
  storedId: string | null,
  storageAvailable: boolean,
): ReleaseNotesDecision {
  const newestId = entries[0]?.id || null
  if (!storageAvailable || !newestId) {
    return { newestId, entriesToShow: [], shouldStore: false }
  }

  if (storedId === null) {
    return { newestId, entriesToShow: [], shouldStore: true }
  }

  if (storedId === newestId) {
    return { newestId, entriesToShow: [], shouldStore: false }
  }

  const storedIndex = entries.findIndex((entry) => entry.id === storedId)
  const entriesToShow =
    storedIndex < 0
      ? entries.slice(0, 3)
      : entries.slice(0, storedIndex).slice(0, 5)
  return { newestId, entriesToShow, shouldStore: false }
}

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import releaseNotesText from '../../release-notes.md?raw'
import { parseReleaseNotes, type ReleaseNoteEntry } from '../data/releaseNotes'

export const releaseNoteEntries = parseReleaseNotes(releaseNotesText)

function renderInlineMarkdown(text: string) {
  const rendered: ReactNode[] = []
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) rendered.push(text.slice(cursor, start))
    if (match[1] !== undefined) {
      rendered.push(<strong key={`${start}-bold`}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      rendered.push(<em key={`${start}-italic`}>{match[2]}</em>)
    }
    cursor = start + match[0].length
  }

  if (cursor < text.length) rendered.push(text.slice(cursor))
  return rendered
}

type Props = {
  open: boolean
  entries: ReleaseNoteEntry[]
  onClose: () => void
}

export default function WhatsNewDialog({ open, entries, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>What&apos;s new</DialogTitle>
      <DialogContent dividers>
        {entries.map((entry, index) => (
          <section key={`${entry.id}-${index}`}>
            <Typography component="h2" variant="h6" sx={{ mt: index ? 3 : 0 }}>
              {entry.id || 'Other updates'}
            </Typography>
            {entry.tldr && (
              <Typography sx={{ mt: 1 }}>
                {renderInlineMarkdown(entry.tldr)}
              </Typography>
            )}
            {entry.items.map((item, itemIndex) => (
              <Typography
                component="p"
                key={`${item.title}-${itemIndex}`}
                sx={{ mb: 1, mt: 1 }}
              >
                {item.title && (
                  <strong>{renderInlineMarkdown(item.title)}: </strong>
                )}
                {renderInlineMarkdown(item.body)}
              </Typography>
            ))}
          </section>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent, useState } from 'react'
import {
  MAX_CRASH_FEEDBACK_LENGTH,
  submitCrashFeedback,
} from '../utils/crashFeedback'

type Status = 'idle' | 'sent' | 'failed'

/**
 * Shown by the root Sentry ErrorBoundary when the app crashes. Replaces
 * Sentry's built-in report dialog, which insists on a name and email even
 * though this app has no accounts. Collects one anonymous free-text note and
 * links it to the crash event.
 *
 * Must render inside the MUI ThemeProvider (see App.tsx).
 */
export default function CrashFallback({ eventId }: { eventId?: string }) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const canSend = message.trim().length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSend) {
      return
    }
    setStatus(submitCrashFeedback(message, eventId) ? 'sent' : 'failed')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 560, p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1">
            It looks like we're having issues.
          </Typography>
          {status === 'sent' ? (
            <>
              <Typography color="text.secondary">
                Thanks, your report was sent.
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </Button>
              </Box>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  Our team has been notified. If you'd like to help, tell us
                  what happened below.
                </Typography>
                <TextField
                  label="What happened?"
                  placeholder="I clicked on 'X' and then hit 'Confirm'"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  minRows={4}
                  maxRows={10}
                  fullWidth
                  autoFocus
                  error={status === 'failed'}
                  helperText={
                    status === 'failed'
                      ? "Couldn't send your report. You can reload and try again."
                      : undefined
                  }
                  slotProps={{
                    htmlInput: { maxLength: MAX_CRASH_FEEDBACK_LENGTH },
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={!canSend}>
                    Send report
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Reload
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}

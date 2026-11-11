import { Box, Button, Stack, Typography } from '@mui/material'
import * as Sentry from '@sentry/react'
import { useEffect, useState } from 'react'
import useBoundStore from '../store/store'
import {
  buildLoadTimeoutReport,
  claimLoadTimeoutReport,
  startLoadWatchdog,
} from './threeDLoadWatchdog'

function reportLoadTimeout() {
  if (!claimLoadTimeoutReport()) return
  const report = buildLoadTimeoutReport(document.createElement('canvas'))
  Sentry.captureMessage('3D view did not finish loading', {
    level: 'warning',
    tags: {
      webgl: report.webglSupported ? 'supported' : 'unsupported',
      webglRenderer: report.renderer ?? 'unavailable',
    },
    contexts: { threeDLoadTimeout: report },
  })
}

/**
 * Suspense fallback for the lazy 3D view. Shows "Loading page..." and, if
 * the 3D view still hasn't loaded after the watchdog timeout, offers the 2D
 * view instead (issue #379).
 */
export default function ThreeDLoadingFallback() {
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => startLoadWatchdog(() => setIsTimedOut(true)), [])

  useEffect(() => {
    if (isTimedOut) reportLoadTimeout()
  }, [isTimedOut])

  if (!isTimedOut) return <div>Loading page...</div>

  return (
    <Box
      data-testid="3d-load-timeout"
      role="alert"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Stack alignItems="center" maxWidth={560} spacing={2} textAlign="center">
        <Typography>
          3D couldn't start on this computer. 2D and PDF still work.
        </Typography>
        <Button
          variant="contained"
          onClick={() => useBoundStore.getState().toggleIs2DOpen(true)}
        >
          Switch to 2D view
        </Button>
      </Stack>
    </Box>
  )
}

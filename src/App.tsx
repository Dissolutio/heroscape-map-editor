import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import * as Sentry from '@sentry/react'
import { SnackbarProvider } from 'notistack'
import { Redirect, Route, Switch } from 'wouter'

import { EventProvider } from './hooks/useEvent'
import CrashFallback from './layout/CrashFallback'
import ErrorPage from './layout/ErrorPage'
import './layout/index.css'
import { ROUTES } from './ROUTES'
import HomePage from './layout/HomePage'
import { useMuiMediaQuery } from './layout/useMuiMediaQuery'
import { reloadOnceForChunkError } from './utils/lazyWithRetry'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
    ].join(','),
    // button: {
    // fontSize: 16,
    // fontWeight: 600,
    // },
  },
})
const RootPage = () => {
  return <Redirect to={ROUTES.heroscapeHome} />
}

const App = () => {
  const {
    isSmallScreenWidth,
    isSmallScreenLandscapeOrientation,
    isMediumScreenWidth,
  } = useMuiMediaQuery()
  const snackbarFontSize =
    isSmallScreenLandscapeOrientation || isSmallScreenWidth
      ? 10
      : isMediumScreenWidth
        ? 12
        : 20
  return (
    // ThemeProvider sits outside the ErrorBoundary so the crash fallback (MUI) is themed
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Sentry.ErrorBoundary
        fallback={CrashFallback}
        onError={(error) => {
          // stale-deployment chunk failures manifest as hook-order crashes (React #310); reload once to recover
          reloadOnceForChunkError(error)
        }}
      >
        <EventProvider>
          <SnackbarProvider
            dense
            style={{
              maxWidth: '100vw',
              fontSize: snackbarFontSize,
            }}
            anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
            maxSnack={3}
            autoHideDuration={3000}
          >
            <Switch>
              <Route path={ROUTES.root} component={RootPage} />
              <Route path={`${ROUTES.heroscapeHome}`} component={HomePage} />

              {/* Default route in a switch */}
              <Route>
                <ErrorPage />
              </Route>
            </Switch>
          </SnackbarProvider>
        </EventProvider>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  )
}

export default App

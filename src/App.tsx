import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import * as Sentry from '@sentry/react'
import { SnackbarProvider } from 'notistack'
import { Redirect, Route, Switch } from 'wouter'

import { EventProvider } from './hooks/useEvent'
import ErrorPage from './layout/ErrorPage'
import './layout/index.css'
import { ROUTES } from './ROUTES'
import HomePage from './layout/HomePage'
import { useMuiMediaQuery } from './layout/useMuiMediaQuery'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: [
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
    isMobileScreenLayout,
    isSmallScreenLandscapeOrientation,
  } = useMuiMediaQuery()
  return (
    <Sentry.ErrorBoundary fallback={ErrorPage} showDialog>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <EventProvider>
          <SnackbarProvider
            dense
            style={{
              maxWidth: '100vw',
              fontSize: isSmallScreenLandscapeOrientation || isMobileScreenLayout ? 10 : 20,
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
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  )
}

export default App

import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://abf54ce42681460cbea61d773becd43d@o374574.ingest.us.sentry.io/5192792',
  // integrations: [Sentry.replayIntegration()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],

  // // Capture Replay for 10% of all sessions,
  // // plus for 100% of sessions with an error
  // // Learn more at
  // // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,
})

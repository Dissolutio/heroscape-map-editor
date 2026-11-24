import * as Sentry from '@sentry/react'

const isProduction = import.meta.env.PROD

Sentry.init({
  dsn: 'https://abf54ce42681460cbea61d773becd43d@o374574.ingest.us.sentry.io/5192792',
  enabled: isProduction,
  // Whitelist Tauri v2 production environment protocols
  allowUrls: [
    /tauri\.localhost/, // Windows & Linux Desktop
    /tauri:/, // macOS Desktop
    /hexoscape/, // Web App Domain
    /localhost/, // Keep this temporarily so you can test it on your local production previews!
  ],

  // Sentry v11 collects user info, cookies, headers and bodies by default.
  // Keep the v10 privacy baseline: no user info or cookies, no bodies, and
  // drop IP-like headers and query params.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    },
    urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    httpBodies: [],
  },

  // Link errors to the release: vite.config.ts computes the version once and
  // defines it here, so this matches the Sentry plugin's release name
  release: `hexoscape@${import.meta.env.VITE_RELEASE_VERSION || 'local-development'}`,
})

import * as Sentry from '@sentry/react'

// Check if we are running in a built production release
const isProduction = !!import.meta.env.VITE_RELEASE_VERSION

Sentry.init({
  dsn: 'https://abf54ce42681460cbea61d773becd43d@o374574.ingest.us.sentry.io/5192792',

  // FORCE ENABLE based strictly on whether a release version exists
  enabled: isProduction,

  // Force Sentry to print internal logs to your browser/app Dev Console.
  // This will tell you EXACTLY why it is dropping or sending events!
  debug: true,

  // Whitelist Tauri v2 production environment protocols
  allowUrls: [
    /tauri\.localhost/, // Windows & Linux Desktop
    /tauri:/, // macOS Desktop
    /hexoscape/, // web app's live domain
  ],

  // Link errors to your GitHub Git Tag release version
  release: `hexoscape@${import.meta.env.VITE_RELEASE_VERSION || 'local-development'}`,
})

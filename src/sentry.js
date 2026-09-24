import * as Sentry from '@sentry/react'

const isProduction = import.meta.env.PROD

Sentry.init({
  dsn: 'https://abf54ce42681460cbea61d773becd43d@o374574.ingest.us.sentry.io/5192792',
  enabled: isProduction,
  debug: true,
  // Whitelist Tauri v2 production environment protocols
  allowUrls: [
    /tauri\.localhost/, // Windows & Linux Desktop
    /tauri:/, // macOS Desktop
    /hexoscape/, // Web App Domain
    /localhost/, // Keep this temporarily so you can test it on your local production previews!
  ],

  // Link errors to your GitHub Git Tag release version
  release: `hexoscape@${import.meta.env.VITE_RELEASE_VERSION || 'local-development'}`,
})

import * as Sentry from '@sentry/react'
Sentry.init({
  dsn: 'https://abf54ce42681460cbea61d773becd43d@o374574.ingest.us.sentry.io/5192792',

  // Only turn Sentry on for production builds
  enabled: !import.meta.env.DEV,

  // Whitelist Tauri v2 production environment protocols
  allowUrls: [/tauri\.localhost/, /tauri:/],

  // Link errors to your GitHub Git Tag release version
  release: `hexoscape@${import.meta.env.VITE_RELEASE_VERSION || 'local-development'}`,
})

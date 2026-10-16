import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts on purpose: the app config loads the React
// SWC plugin and the Sentry plugin (which does network telemetry outside of
// `development` mode). The tests only exercise pure logic (hex math, placement
// rules, serialization), so they need neither.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

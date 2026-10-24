import { defineConfig, devices } from '@playwright/test'

const PORT = 5173 // matches server.port in vite.config.ts (strictPort)

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  // Software WebGL is slow: give the map room to load.
  // Leave room for waitForAppReady's 60s timeout to report its diagnostics.
  timeout: 75_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each worker is a software-WebGL browser: more than two in parallel starve
  // each other and the slowest tests hit their timeout.
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Headless Chromium has no GPU: render WebGL in software.
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
      ],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // not `npm run dev`: that one adds --host, which exposes the server
    command: 'npx vite',
    url: `http://localhost:${PORT}/hs`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

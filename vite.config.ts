import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Grab the release version injected by GitHub Actions, default to local-dev
  const releaseVersion = process.env.VITE_RELEASE_VERSION || 'local-development'
  // Check if we are running in a CI/CD environment or production mode (only netlify and github-action have sentry token)
  const isCI = !!process.env.SENTRY_AUTH_TOKEN
  const isProduction = mode === 'production'
  return {
    plugins: [
      react(),
      // Only include and activate Sentry if we are in production AND have a token/CI environment
      isProduction && isCI
        ? sentryVitePlugin({
            org: 'hexoscape',
            project: 'hexoscape',
            telemetry: true,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
              name: `hexoscape@${releaseVersion}`,
            },
          })
        : null,
    ],
    // prevent vite from obscuring rust errors
    clearScreen: false,
    server: {
      // make sure this port matches the devUrl port in tauri.conf.json file
      port: 5173,
      // Tauri expects a fixed port, fail if that port is not available
      strictPort: true,
      // if the host Tauri is expecting is set, use it
      host: host || false,
      hmr: host
        ? {
            protocol: 'ws',
            host,
            port: 1421,
          }
        : undefined,

      watch: {
        // tell vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**'],
      },
    },
    // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
    envPrefix: ['VITE_', 'TAURI_ENV_*'],
    build: {
      // Tauri uses Chromium on Windows and WebKit on macOS and Linux
      target:
        process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      // don't minify for debug builds
      minify: !process.env.TAURI_ENV_DEBUG,
      // must set true to produce sourcemaps for debug builds
      sourcemap: isProduction && isCI,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const modulePath = id.replace(/\\/g, '/')
            if (!modulePath.includes('/node_modules/')) return

            if (modulePath.includes('/@mui/x-data-grid/'))
              return 'mui-data-grid'
            if (
              modulePath.includes('/@mui/') ||
              modulePath.includes('/@emotion/')
            ) {
              return 'mui'
            }

            if (modulePath.includes('/three/build/three.module.js')) {
              return 'three-core'
            }
            if (
              /\/(?:@react-three|three-stdlib|three-mesh-bvh|camera-controls|troika-three-text|troika-three-utils|troika-worker-utils|webgl-sdf-generator)\//.test(
                modulePath,
              )
            ) {
              return 'three-ecosystem'
            }

            if (/\/pdfkit\//.test(modulePath)) return 'pdf-writer'
            if (/\/yoga-layout\//.test(modulePath)) return 'pdf-layout'
            if (
              /\/(?:fontkit|brotli|hyphen|unicode-properties)\//.test(
                modulePath,
              )
            ) {
              return 'pdf-fonts'
            }
            if (modulePath.includes('/@react-pdf/')) return 'pdf-renderer'

            if (
              /\/(?:react|react-dom|scheduler|react-reconciler)\//.test(
                modulePath,
              )
            ) {
              return 'react-vendor'
            }
          },
        },
      },
    },
  }
})

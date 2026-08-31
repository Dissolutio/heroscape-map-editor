import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "hexoscape",
      project: "hexoscape",
      telemetry: mode !== "development",
    }),
  ],
  build: {
    sourcemap: true,
  },
}));
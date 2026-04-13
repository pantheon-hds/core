import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Sentry source map upload runs only in CI when auth token is present.
// Locally this plugin is a no-op — it never blocks the dev server.
const sentryPlugin = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { filesToDeleteAfterUpload: ['./build/**/*.map'] },
      telemetry: false,
    })
  : null;

export default defineConfig({
  plugins: [react(), ...(sentryPlugin ? [sentryPlugin] : [])],
  server: { port: 3000 },
  build: {
    outDir: 'build',
    sourcemap: true, // needed for Sentry to map minified traces to source
  },
});

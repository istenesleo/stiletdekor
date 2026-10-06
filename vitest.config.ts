import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for framework-independent code (src/domain, pure helpers in src/server, build scripts) and the
// UI library (src/ui). They run in plain Node, so they must not import `cloudflare:workers` or `astro:*`
// modules. UI tests that need a DOM opt in per file with a `@vitest-environment jsdom` docblock.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs'],
    setupFiles: ['./src/ui/test-setup.ts'],
    passWithNoTests: true,
  },
});

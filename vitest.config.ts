import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Vitest config for the @datasketch/monkeytab test suite.
//
// Tests live in ./tests/ — see tests/README.md for conventions.
// The @monkeytab/* aliases below match the package names used in
// the source so tests can import without relative paths.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/types.d.ts'],
      // OSS contribution requirement: minimum 15% line coverage.
      // Bumping this is encouraged — exercising the core utilities
      // (query, sort, filter, registries, MemoryAdapter) usually
      // hits 25–30% without touching the React layer.
      thresholds: {
        lines: 15,
        functions: 15,
        branches: 15,
        statements: 15,
      },
    },
  },
  resolve: {
    alias: {
      '@monkeytab/core': resolve(__dirname, 'src/core/index.ts'),
      '@monkeytab/adapter-memory': resolve(__dirname, 'src/adapters/memory/index.ts'),
      '@monkeytab/browser': resolve(__dirname, 'src/browser/index.ts'),
    },
  },
});

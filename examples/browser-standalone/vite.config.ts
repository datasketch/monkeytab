import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// The example imports from '@monkeytab/browser' (the workspace name used
// throughout the source). Vite aliases that to the parent repo's src/ so
// you can edit the source and see live updates without rebuilding the
// npm package. This makes the example a good place to test changes.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
  },
  resolve: {
    alias: {
      '@monkeytab/core': resolve(__dirname, '../../src/core/index.ts'),
      '@monkeytab/adapter-memory': resolve(__dirname, '../../src/adapters/memory/index.ts'),
      '@monkeytab/browser': resolve(__dirname, '../../src/browser/index.ts'),
    },
  },
});

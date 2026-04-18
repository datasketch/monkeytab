// @vitest-environment node
/**
 * Bundle import smoke test.
 *
 * Imports the actual built dist/monkeytab.js (not the source under
 * src/) and verifies the documented public API symbols are present.
 * This is the layer that catches sync/build issues that source-only
 * tests miss: missing exports, broken bundling, transform regressions.
 *
 * Runs in the Node environment (not jsdom) for two reasons:
 *   1. Node env keeps `import.meta.url` as a real file:// URL, which
 *      jsdom mocks to a non-file URL — breaking fileURLToPath.
 *   2. Importing the bundle doesn't need a DOM; React modules load
 *      cleanly without window/document at module-init time.
 *
 * Requires `npm run build` to have run first. The test fails with a
 * clear message if dist/monkeytab.js is missing.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUNDLE_PATH = resolve(__dirname, '../../dist/monkeytab.js');

describe('built bundle (dist/monkeytab.js)', () => {
  beforeAll(() => {
    if (!existsSync(BUNDLE_PATH)) {
      throw new Error(
        `dist/monkeytab.js not found at ${BUNDLE_PATH}\n` +
          `Run 'npm run build' before running the test suite.`,
      );
    }
  });

  it('exports the documented public API symbols', async () => {
    const bundle = await import(BUNDLE_PATH);

    // Core public components from src/browser/index.ts
    // MonkeyTable is wrapped in forwardRef (since 0.3.0), which returns an object.
    expect(bundle.MonkeyTable).toBeDefined();
    expect(typeof bundle.BrowserClient).toBe('function');
    expect(typeof bundle.Grid).toBe('function');
    expect(typeof bundle.PaginationBar).toBe('function');

    // Context + hooks
    expect(typeof bundle.MonkeyTabClientProvider).toBe('function');
    expect(typeof bundle.useClient).toBe('function');
    expect(typeof bundle.useI18n).toBe('function');

    // Embed API
    expect(typeof bundle.EmbedMonkeyTable).toBe('function');
    expect(typeof bundle.configToParams).toBe('function');
    expect(typeof bundle.paramsToConfig).toBe('function');

    // Catalogs (used by AI agents and option lifecycle tracking)
    expect(typeof bundle.OPTIONS_CATALOG).toBe('object');
    expect(typeof bundle.FIELD_TYPE_CATALOG).toBe('object');
    expect(typeof bundle.getFieldTypeInfo).toBe('function');
  });

  it('does not silently drop the MonkeyTable default export', async () => {
    const bundle = await import(BUNDLE_PATH);
    // MonkeyTable is the headline export — guard explicitly so the
    // failure message is unambiguous if it ever disappears.
    expect(bundle.MonkeyTable).toBeDefined();
    expect(bundle.MonkeyTable.displayName).toBe('MonkeyTable');
  });
});

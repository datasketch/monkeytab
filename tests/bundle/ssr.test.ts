// @vitest-environment node
/**
 * SSR safety check.
 *
 * Imports dist/monkeytab.js in a Node environment with NO DOM globals
 * (window, document, navigator). The test passes if the import
 * completes without throwing.
 *
 * This catches the class of bug where a component touches the DOM at
 * module load time (e.g., `const matches = window.matchMedia(...)` at
 * the top of a file). Such bugs make the package un-importable in
 * Next.js, Remix, Astro, or any other SSR-style consumer — but the
 * jsdom-based tests miss them entirely because jsdom provides
 * window/document.
 *
 * The `// @vitest-environment node` directive at the top of this file
 * tells vitest to use the Node environment instead of the global jsdom
 * default — that's the whole point of this test.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUNDLE_PATH = resolve(__dirname, '../../dist/monkeytab.js');

describe('SSR safety', () => {
  beforeAll(() => {
    if (!existsSync(BUNDLE_PATH)) {
      throw new Error(
        `dist/monkeytab.js not found at ${BUNDLE_PATH}\n` +
          `Run 'npm run build' before running the test suite.`,
      );
    }
  });

  it('imports cleanly in a Node environment with no DOM globals', async () => {
    // Sanity check that we are actually in a no-DOM environment.
    // If this fails, the @vitest-environment directive isn't taking effect
    // and the SSR test would silently pass for the wrong reason.
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');

    // The actual test: importing the bundle must not throw. If any
    // module-load-time code touches window/document, this throws here.
    const bundle = await import(BUNDLE_PATH);
    expect(bundle.MonkeyTable).toBeDefined();
  });
});

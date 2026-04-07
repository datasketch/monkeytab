// @vitest-environment node
/**
 * Public TypeScript API compilation test.
 *
 * Spawns `tsc --noEmit` against the standalone tsconfig in this
 * directory, which compiles tests/types/consumer.ts using
 * dist/index.d.ts as the type source for `@datasketch/monkeytab`.
 *
 * If consumer.ts fails to compile, the public type contract has
 * regressed and downstream consumers' projects would break too.
 *
 * Why a child process and not the typescript API directly: spawning
 * tsc keeps the test self-contained — no extra TS imports, no
 * runtime version coupling, error messages match what consumers see
 * in their own builds.
 *
 * Runs in node env (not jsdom) — no DOM needed, and node env keeps
 * import.meta.url as a real file:// URL for fileURLToPath.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TYPES_FILE = resolve(__dirname, '../../dist/index.d.ts');
const TS_CONFIG = resolve(__dirname, './tsconfig.json');

describe('public TypeScript API', () => {
  beforeAll(() => {
    if (!existsSync(TYPES_FILE)) {
      throw new Error(
        `dist/index.d.ts not found at ${TYPES_FILE}\n` +
          `Run 'npm run build' before running the test suite.`,
      );
    }
  });

  it('compiles consumer.ts against dist/index.d.ts', () => {
    const result = spawnSync(
      'npx',
      ['--no-install', 'tsc', '--noEmit', '-p', TS_CONFIG],
      { encoding: 'utf8' },
    );

    if (result.status !== 0) {
      // Surface tsc's diagnostics in the test output so the failure is
      // actionable without re-running tsc by hand.
      const out = (result.stdout || '') + (result.stderr || '');
      throw new Error(`tsc reported errors:\n${out}`);
    }

    expect(result.status).toBe(0);
  }, 30_000); // tsc cold start can be slow; give it 30s
});

// @vitest-environment node
/**
 * CHANGELOG.md consistency checks.
 *
 * Validates that version headers have matching compare links,
 * that [Unreleased] points to the latest version, and that
 * package.json version matches the latest CHANGELOG entry.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../..');

const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

/** Extract all `## [x.y.z]` version headers (excludes [Unreleased]). */
function getVersionHeaders(text: string): string[] {
  return [...text.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
}

/** Extract all `[x.y.z]: <url>` reference links at the bottom. */
function getCompareLinks(text: string): Map<string, string> {
  const links = new Map<string, string>();
  for (const m of text.matchAll(/^\[([^\]]+)\]:\s*(.+)$/gm)) {
    links.set(m[1], m[2].trim());
  }
  return links;
}

describe('CHANGELOG.md', () => {
  const versions = getVersionHeaders(changelog);
  const links = getCompareLinks(changelog);

  it('has at least one version entry', () => {
    expect(versions.length).toBeGreaterThan(0);
  });

  it('latest version matches package.json', () => {
    expect(versions[0]).toBe(pkg.version);
  });

  it('every version header has a matching compare link', () => {
    const missing = versions.filter((v) => !links.has(v));
    expect(missing).toEqual([]);
  });

  it('[Unreleased] link points to latest version tag', () => {
    const unreleased = links.get('Unreleased');
    expect(unreleased).toBeDefined();
    expect(unreleased).toContain(`v${versions[0]}...HEAD`);
  });

  it('compare links are in descending version order', () => {
    const linkVersions = [...links.keys()].filter((k) => k !== 'Unreleased' && /^\d+\.\d+\.\d+$/.test(k));
    expect(linkVersions).toEqual(versions);
  });
});

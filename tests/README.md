# Tests

The Vitest test suite for `@datasketch/monkeytab`. Tests run in Node with jsdom and V8 coverage; the configuration lives in `vitest.config.ts` at the repo root.

## Layout

You can structure tests however you like — `tests/unit/`, `tests/integration/`, flat files, fixtures, helpers, mocks. The runner picks up anything matching `tests/**/*.test.{ts,tsx}`.

`@testing-library/react` and `@testing-library/jest-dom` are preinstalled for component tests.

## Running tests

```bash
npm install
npm test                 # run once
npm run test:watch       # watch mode
npm run test:coverage    # with V8 coverage report
```

Coverage output goes to `./coverage/` (gitignored). The HTML report at `./coverage/index.html` is the friendliest format. The `lcov.info` file is what coverage services consume.

## Writing tests

Tests can import directly from the source via the `@monkeytab/*` aliases configured in `vitest.config.ts`:

```ts
// tests/core/query-utils.test.ts
import { describe, it, expect } from 'vitest';
import { applySort, compareValues } from '@monkeytab/core';

describe('compareValues', () => {
  it('sorts numbers ascending', () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
    expect(compareValues(2, 1)).toBeGreaterThan(0);
    expect(compareValues(1, 1)).toBe(0);
  });

  it('puts null last', () => {
    expect(compareValues(null, 5)).toBeGreaterThan(0);
    expect(compareValues(5, null)).toBeLessThan(0);
  });
});
```

For React component tests, use `@testing-library/react`:

```ts
// tests/components/MonkeyTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonkeyTable } from '@monkeytab/browser';

describe('<MonkeyTable>', () => {
  it('renders column headers', () => {
    render(
      <MonkeyTable
        columns={[{ id: 'Name' }, { id: 'Age', type: 'Number' }]}
        rows={[]}
      />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });
});
```

`@testing-library/react` and `@testing-library/jest-dom` are included in the default devDependencies, so you can write component tests immediately without installing anything else.

## Coverage target

The MonkeyTab project targets **15% line coverage** as a minimum bar. Aim higher when you can — exercising the core utilities (query, sort, filter, registries, MemoryAdapter) is usually enough to get to 25–30% without touching the React layer.

## What gets covered

`vitest.config.ts` includes `src/**/*.{ts,tsx}` and excludes test files and type-only `.d.ts` files. Anything in `src/` is fair game.

## CI integration

`.github/workflows/ci.yml` runs `npm run test:coverage` and fails the build if any of the 15% thresholds (lines, branches, functions, statements) are not met. Coverage artifacts are uploaded by the workflow.

## Reporting bugs found by tests

If a test catches a bug, file it as a GitHub issue with the failing test, expected behavior, and a minimal reproduction. Keep the failing test in your branch — it becomes the regression check once the bug is fixed.

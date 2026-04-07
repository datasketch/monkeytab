# Tests

This directory holds the public team's test suite for `@datasketch/monkeytab`.

## Important: this directory is YOURS

The upstream sync script (in the private workspace) **never touches
`tests/`**. Whatever you put here is preserved across every sync. You
can:

- Write tests in any structure (`tests/unit/`, `tests/integration/`,
  flat files, whatever works)
- Use any test framework — the default `vitest.config.ts` is set up
  for Vitest with jsdom + V8 coverage
- Mix `*.test.ts` and `*.test.tsx` for component tests
- Add fixtures, helpers, mocks — anything not committed by upstream

The upstream maintainers run their own (Deno-based) tests against the
private build. Your tests run in parallel against the same source code
but in Node — different runtime, different test author, different blind
spots. That's the point: parallel suites catch different things.

## Running tests

```bash
npm install
npm test                 # run once
npm run test:watch       # watch mode
npm run test:coverage    # with V8 coverage report
```

Coverage output goes to `./coverage/` (gitignored). The HTML report
at `./coverage/index.html` is the friendliest format. The `lcov.info`
file is what coverage services consume.

## Writing tests

Tests can import directly from the source via the `@monkeytab/*`
aliases configured in `vitest.config.ts`:

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

You'll need to install `@testing-library/react` and `@testing-library/jest-dom`
yourself if you want component tests — they're not in the default
`devDependencies` to keep the install lean.

## Coverage target

The MonkeyTab project targets **15% line coverage** as a minimum bar.
Aim higher when you can — exercising the core utilities (query, sort,
filter, registries, MemoryAdapter) is usually enough to get to 25–30%
without touching the React layer.

## What gets covered

`vitest.config.ts` includes `src/**/*.{ts,tsx}` and excludes test
files and type-only `.d.ts` files. Anything in `src/` is fair game,
which means your tests can drive the actual implementation that ships
to npm consumers.

## CI integration

If you set up CI (`.github/workflows/ci.yml`), the test job should
run `npm run test:coverage` and either fail on the 15% threshold or
upload the `lcov.info` to a coverage service like Codecov.

## A note on parallel suites

The maintainers run their own internal test suite against the full
feature set in a different runtime. This public test suite is
**independent** — it tests only what ships in `@datasketch/monkeytab`,
written by a different team.

If your tests catch a bug, file it in the public repo. The maintainers
will reproduce it on their side, fix it, and re-sync. Your test remains
as a regression check on the public side.

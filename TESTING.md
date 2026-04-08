# Testing

> First version. Captures the testing approach today (Phase 1 of the project) and links out to the working configuration. Will be expanded as the test surface grows.

## Strategy

MonkeyTab tests focus on **behavior that ships to consumers**: the public API of `@datasketch/monkeytab`, the field type registries, the in-memory adapter, and the rendering of the React components.

We test the source directly (via the `@monkeytab/*` aliases configured in `vitest.config.ts`) so that what's tested matches what's built. We do **not** mock — tests use real adapters, real registries, and real React renders via `@testing-library/react`.

The minimum bar is **15% line coverage**, enforced by `vitest.config.ts` thresholds. CI fails if coverage falls below the threshold. The current target is to grow from this floor as new tests are added.

> **TODO**: raise the coverage target as the test suite matures (suggested next step: 30% after a full pass on `src/core/`).

## Test layout

Tests live under [`tests/`](./tests/) and are picked up by Vitest's default glob `tests/**/*.test.{ts,tsx}`. There is no enforced sub-structure — flat files, `tests/unit/`, `tests/integration/`, and `tests/components/` are all fine. See [`tests/README.md`](./tests/README.md) for the conventions and example tests.

## Sample test cases

The test suite covers (or is targeted to cover) the following surface areas. This list is the working backlog for raising coverage past the 15% floor.

| Area | What to test | Status |
|---|---|---|
| `<MonkeyTable>` render | Mounts via React Testing Library, headers from `columns` appear, mounts cleanly with empty rows / custom render / `editable: false` | ✅ in suite |
| MemoryAdapter — schema | `listBases`, `getTable`, `info()` capabilities | ✅ in suite |
| MemoryAdapter — CRUD | Create → query → get → update → delete round-trip | ✅ in suite |
| MemoryAdapter — pagination | `queryRecords` with `offset` + `limit` slices correctly | ✅ in suite |
| MemoryAdapter — schema mutation | `createField` / `deleteField` round-trip | ✅ in suite |
| MemoryAdapter — error paths | `getRecord` throws on missing record | ✅ in suite |
| Bundle import smoke | `dist/monkeytab.js` exports the documented public API | ✅ in suite |
| SSR safety | Bundle imports cleanly in a no-DOM Node environment | ✅ in suite |
| Public type contract | `dist/index.d.ts` compiles a consumer-style file via `tsc --noEmit` | ✅ in suite |
| `compareValues` (sort) | numeric ordering, string ordering, null handling, mixed types | ⚠️ TODO |
| `applySort` | single-column ascending/descending, multi-column tiebreakers | ⚠️ TODO |
| `applyFilter` | each FilterOperator (eq, neq, lt/lte/gt/gte, contains, is_empty, etc.) per supported field type | ⚠️ TODO |
| Field type registry | direct `lookup()` and override registration assertions | ⚠️ TODO |
| `<MonkeyTable>` editing | `onChange` fires with new rows on cell edit | ⚠️ TODO |
| Type-aware sort labels | correct label per field type | ⚠️ TODO |
| Per-column control | `editable: false`, `sortable: false`, custom `width` exercised end-to-end | ⚠️ TODO |

> **TODO**: each ⚠️ row is a good first issue for new contributors.

## Data structures under test

The core data shapes are defined in `src/core/types.ts` and re-exported through `src/browser/types.d.ts`. Tests import them through the `@monkeytab/core` alias rather than reaching into source paths directly.

Key shapes:

- **`FieldSpec`** — `{ id, label, type, options? }` — describes a column
- **`Row`** — `{ id, fields: Record<string, Value>, createdAt, updatedAt }` — a single record
- **`TableSpec`** — `{ id, label, fields, primaryFieldId?, columnOrder?, rowOrder? }` — schema
- **`FilterCondition`** / **`FilterGroup`** — query filters
- **`SortSpec`** — sort directives
- **`FieldOptions`** — discriminated union of per-type options (NumberFieldOptions, SingleSelectFieldOptions, etc.)

See [`src/browser/types.d.ts`](./src/browser/types.d.ts) for the full surface.

## Pull request workflow

Every PR must:

1. Pass `npm run build:check` (TypeScript strict-mode check on the source)
2. Pass `npm test` (the full Vitest suite)
3. Pass `npm run test:coverage` (which enforces the 15% thresholds)
4. Pass `npm run build` (Vite library build, produces `dist/monkeytab.js`)

CI runs all four steps automatically on push and on PR. The CI status badge is in [`README.md`](./README.md). The coverage report is uploaded as a CI artifact (`coverage-report`) and can be downloaded from the Actions run page.

For the full PR submission flow, see [`CONTRIBUTING.md`](./CONTRIBUTING.md). The pull request template at [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) is auto-applied to every new PR.

## Running tests locally

```bash
npm install              # one-time setup
npm test                 # run the suite once
npm run test:watch       # interactive watch mode
npm run test:coverage    # run with coverage report (enforces 15% thresholds)
npm run build:check      # TypeScript type-check the source
npm run build            # Vite library build
```

The HTML coverage report is generated at `coverage/index.html` after `test:coverage`. Open it in a browser to see line-by-line coverage.

## Reporting test failures

If a test fails on `main`, file a GitHub issue with:

- The failing test name and file
- The expected vs actual output
- A minimal reproduction (what command you ran, what environment)
- Whether the failure is reproducible or intermittent

If a contributor's test catches a real bug, the failing test should be merged with the fix (so it becomes a regression check for the future).

---

*Testing v0.1 · last updated 2026-04-08*

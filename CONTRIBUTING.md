# Contributing to MonkeyTab

Thanks for your interest in contributing! MonkeyTab is the open-source embeddable React table from [datasketch](https://github.com/datasketch). We welcome bug reports, feature requests, and pull requests.

## Quick Start

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn — npm is the default)
- Git

### Setup

```bash
git clone https://github.com/datasketch/monkeytab.git
cd monkeytab
npm install
```

### Build the package

```bash
npm run build
```

This produces `dist/monkeytab.js` and `dist/index.d.ts`.

### Run the test suite

```bash
npm test                  # run once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

See [`tests/README.md`](./tests/README.md) for the test layout, conventions, and how to write your first test.

### Run the example app

```bash
cd examples/browser-standalone
npm install
npm run dev
```

The example demonstrates the field types and features of the package.

---

## Repository Layout

```
monkeytab/
├── src/
│   ├── core/              # Types, adapter interface, registries
│   ├── ui/                # React components, renderers, editors
│   ├── browser/           # The @datasketch/monkeytab entry point
│   └── adapters/
│       └── memory/        # In-memory adapter (the default)
├── tests/                 # Vitest test suite — public team owned
│   └── README.md          # How to write and run tests
├── examples/
│   └── browser-standalone/   # Minimal demo app
├── docs/
│   ├── architecture.md    # How it's structured
│   ├── guides/            # Tutorial-style guides (rendered at monkeytab.app)
│   └── reference/         # Reference docs (rendered at monkeytab.app)
├── .github/               # Issue templates, PR template, CI workflows
├── package.json
├── tsconfig.json
├── vite.config.ts         # Library build (Vite)
├── vitest.config.ts       # Test runner config
├── README.md
├── BROWSER.md             # API reference
├── EXTENDING.md           # Custom renderers, editors, functions
├── CHANGELOG.md
└── LICENSE                # MIT
```

The `src/` directory uses TypeScript path aliases (defined in `tsconfig.json` and `vite.config.ts`) so imports look like `@monkeytab/core` and `@monkeytab/adapter-memory` even though everything lives in a flat `src/` tree. You don't need to think about this — just use the aliases when importing across modules.

---

## Reporting Issues

Before opening an issue, please:

1. Check the [existing issues](https://github.com/datasketch/monkeytab/issues) — your problem may already be reported
2. Try the latest version (`npm install @datasketch/monkeytab@latest`)
3. Provide a minimal reproduction (a CodeSandbox or short code snippet works great)

When reporting a bug, include:
- The MonkeyTab version
- React version
- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## Submitting Changes

1. Fork the repo and create a topic branch (`git checkout -b fix-something`)
2. Make your changes
3. Add or update tests in `tests/` if relevant
4. Run `npm test` to verify
5. Run `npm run build` to verify it compiles
6. Commit with a clear message describing the *why*
7. Open a pull request

## How PRs get merged

Standard GitHub flow — open a PR, get reviewed, see it merged. The only quirk worth knowing: **the merge may lag a beat** behind your PR being approved.

That's because MonkeyTab is developed in an internal workspace and synced to this public repo, so when a maintainer accepts your PR they apply the same change upstream first, then merge here. You'll see commit attribution to you in the merge, the changelog entry credits you, and your PR closes as merged — same as any other open source project.

If anything ever looks weird (PR sitting in "approved" status for a while, your commit attribution missing, etc.), feel free to ping us in the PR thread.

### Coding standards

- TypeScript strict mode — no `any` unless absolutely necessary
- Use the `@monkeytab/*` aliases for cross-module imports (configured in `tsconfig.json`)
- Match the existing code style — Prettier defaults are fine
- Keep changes focused — one PR per topic

### Commit messages

- Lead with a verb in present tense ("Add X", "Fix Y", "Update Z")
- Explain *why* the change matters
- Reference issue numbers when relevant
- Keep the subject line under 70 characters

### Pull request descriptions

- Describe what the change does and why
- List any breaking changes (we follow semver)
- Include before/after screenshots for visual changes
- Link to related issues

---

## Improving the docs site

The easiest contribution path is improving the documentation. Every markdown file under `docs/guides/` and `docs/reference/` is rendered at [monkeytab.app](https://monkeytab.app), and the source for those pages lives right here in this repo.

To fix a typo, clarify a step, or add a new guide:

1. Find the file under `docs/guides/` or `docs/reference/`
2. Edit it (or create a new `.md` file)
3. Open a PR with a clear description

The maintainers apply the change upstream, the docs site rebuilds, and your improvement is live.

A few notes:

- **`README.md`, `BROWSER.md`, `EXTENDING.md`, `CHANGELOG.md`** at the root are the npm package's primary docs. Edit these for API reference and package-level documentation.
- **`docs/guides/*.md`** are tutorial-style guides — quick start, conceptual explanations, common patterns.
- **`docs/reference/*.md`** are reference docs — overviews and conceptual API notes.
- **`docs/architecture.md`** is the high-level architecture overview.

If you're not sure where a piece of documentation belongs, open an issue and we'll help.

---

## Adding a New Field Type

If you want to add a brand new field type (e.g., `Currency`, `Percent`, `Address`):

1. Add the type to the `FieldType` union in `src/core/types.ts`
2. Create a `*FieldOptions` interface for type-specific options in the same file
3. Add it to the `FieldOptions` union
4. Create a renderer in `src/ui/components/renderers/`
5. Create an editor in `src/ui/components/editors/`
6. Register the type in `src/ui/registry/FieldTypeRegistry.ts`
7. Register the renderer/editor pair in `src/ui/registry/defaults.ts`
8. Update `src/browser/types.d.ts` (the npm type declarations)
9. Add tests in `tests/`
10. Add documentation: a section in `EXTENDING.md` or a guide in `docs/guides/`

Note: you don't need a new field type just to customize an existing one — use the `renderers`, `editors`, or per-column `render` props instead. New field types are for genuinely new value shapes.

---

## Adding a New Adapter

Adapters connect MonkeyTab to a data source. To add a new one:

1. Create `src/adapters/your-adapter/`
2. Implement the `Adapter` interface from `@monkeytab/core`
3. Add tests in `tests/adapters/your-adapter.test.ts`
4. Document the adapter's capabilities (sort, filter, search, files, etc.)
5. Export from `src/adapters/your-adapter/index.ts`
6. Add a TypeScript path alias in `tsconfig.json` and `vite.config.ts` if cross-module imports are needed

The current public release ships only the in-memory adapter. File-system adapters (json, csv, folder, sqlite) are on the roadmap but not yet public — they need to be ported from Deno-specific filesystem APIs to `node:fs`. If you want to take that on, the upstream private repo has working Deno versions to port from — open an issue to coordinate.

For details on the adapter interface and what each method should do, see [`docs/architecture.md`](./docs/architecture.md).

---

## Internationalization (i18n)

All user-facing strings must go through the i18n system. Never hardcode UI text in components.

When you add a new string:

1. Add the key to the `I18nStrings` interface in `src/ui/i18n/strings.ts`
2. Add the English value in `src/ui/i18n/en.ts`
3. Add the Spanish value in `src/ui/i18n/es.ts`
4. Use `const { t } = useI18n()` in your component, then call `t('your.key')`

If you forget to add the key to all bundles, the UI will show the raw key string instead of translated text.

---

## Documentation checklist

When you add a feature, also update the relevant documentation:

- [`BROWSER.md`](./BROWSER.md) if it adds a new prop or changes the public API
- [`EXTENDING.md`](./EXTENDING.md) if it changes how to extend MonkeyTab
- [`CHANGELOG.md`](./CHANGELOG.md) under the unreleased section
- [`docs/architecture.md`](./docs/architecture.md) if it changes the structure
- A new guide under `docs/guides/` if it deserves a dedicated tutorial

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

## Code of Conduct

Be kind. Be respectful. Disagree with ideas, not people. We want this to be a welcoming community for contributors of all backgrounds and experience levels.

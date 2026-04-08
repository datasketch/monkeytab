# Project Charter — MonkeyTab

> First version. Expect this to evolve as the project and community grow. TODOs flag the parts that need a real answer before this charter is "done."

## Vision

Make tables easy to drop into any React app, so developers can give their users a real spreadsheet experience without spending weeks building one.

## Mission

MonkeyTab is an embeddable, editable React table component. Type-aware columns, spreadsheet-style keyboard navigation, copy-paste from Excel, sort/filter/search out of the box, virtualized for large datasets — installable from npm with one dependency and a peer dep on React.

The project's job is to make the **80% case** of "I need a good table in my React app" a single component install, while staying small enough that the **20% case** can be solved by overriding renderers, editors, and behaviors via props.

## Scope

**In scope:**

- The `@datasketch/monkeytab` npm package: a React component for editable tables
- Built-in field types (Text, Number, Boolean, Date, SingleSelect, MultiSelect, Email, URL, Phone, Image, Attachment, Rating, Color, Computed)
- Sort, filter, search, pagination, virtualization
- An in-memory adapter for trivial use cases
- Documentation site at <https://monkeytab.app>

**Out of scope (for now):**

- Hosted backend, multi-user collaboration, or sync — MonkeyTab renders, the host app owns the data
- File-based persistence (CSV, JSON, SQLite) is on the roadmap but not in the initial release
- Authentication, permissions, or organization features

## License

**MIT** — see [`LICENSE`](./LICENSE).

The MIT license was chosen because:

- It's permissive — anyone can use MonkeyTab in commercial products without copyleft obligations
- It's familiar to React ecosystem contributors and is the de facto standard for React component libraries on npm
- It minimizes legal friction for adoption, which is the primary success metric for a UI library
- It's OSI-approved, GPL-compatible, and SPDX-recognized

By contributing, you agree your contributions are licensed under the same terms.

## Community and governance

- **Issues and discussions**: <https://github.com/datasketch/monkeytab/issues>
- **Pull requests**: see [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Code of conduct**: see [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

**Maintainers**:

- JP Marin Diaz — [@jpmarindiaz](https://x.com/jpmarindiaz)

The project is in its early stages. All decisions about scope, design, breaking changes, and write access are currently made by JP Marin Diaz. As the contributor base and the project grow, this governance will be formalized into a multi-maintainer process with explicit criteria for new committers.

## Trademarks

"MonkeyTab" and the MonkeyTab logo are project marks. They may be used to refer to the project itself (in articles, presentations, integrations) without permission. Commercial use of the marks (selling derivative products under the MonkeyTab name) requires permission.

> **TODO**: formal trademark policy if/when the project is donated to a foundation or when commercial derivatives become a real concern.

## Charter changes

This charter is intentionally short. Updates happen via PR to this file. Substantial changes (scope, license, governance) should be discussed in a GitHub issue first.

---

*Charter v0.1 · MIT licensed · last updated 2026-04-08*

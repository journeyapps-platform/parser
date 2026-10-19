# JourneyApps Platform Parser

Product parsers and the shared type system for JourneyApps Platform. Engine integration remains in journey-js.

| Package                           | Responsibility                                                            |
| --------------------------------- | ------------------------------------------------------------------------- |
| `@ja-platform/parser-type-system` | Runtime type definitions, conversion, validation and formatting contracts |
| `@ja-platform/parser-expressions` | Expressions, code parsing and reference analysis                          |
| `@ja-platform/parser-core`        | Nodes, attributes, parsed trees and value providers                       |
| `@ja-platform/parser-schema`      | JourneyApps Platform schema parsing, schema types and Day date values     |

Core and schema depend on expressions and type-system; neither depends on the runtime engine. XML infrastructure comes from journeyapps/common. Schema retains its existing parser and compatibility behavior during this move.

## Development

Use Node 24 (`nvm install && nvm use`) and the pinned pnpm version.

- `pnpm install` installs dependencies.
- `pnpm build` builds packages through TypeScript project references.
- `pnpm clean` cleans TypeScript outputs.
- `pnpm watch` watches the same project graph.
- `pnpm test` builds and runs package tests, including existing browser suites.

Compiler checks retain their existing relaxed settings. CI runs the same tests on Node 22, 24 and 26.

For local common packages, copy `pnpm-links.json.template` to `pnpm-links.json`, enable the `common` group, and install again.

## Releases

Packages are independently versioned with Changesets and published publicly to npm. Add a changeset with `pnpm changeset`. Configure the repository's npm environment and publishing credentials before its first release.

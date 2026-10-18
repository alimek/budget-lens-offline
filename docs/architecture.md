# Architecture

## Current state

Stage 0 is in progress: the monorepo, tooling and CI exist; domain logic is being ported into `packages/core`
issue by issue. `apps/mobile` (Expo) and `packages/db` (Drizzle schema) are **planned, not created yet**.
What exists today in `packages/core`: the `MinorUnits` money type (`isMinorUnits`, `toMinorUnits`, `sumMinorUnits`),
`YearMonth` months and recurrence schedules (#4), occurrence overrides (#5), and characterization tests of the legacy implementation (#3).

## Repository layout

```
apps/                    # applications; apps/mobile (Expo) will be added in Stage 1
packages/core/           # pure TypeScript domain logic, tested with Vitest
  src/index.ts           # public API – everything exported from here
  test/                  # legacy characterization tests (#3): fixtures, legacy reference, snapshots, LEGACY.md
docs/                    # architecture, conventions, glossary, domain, decisions (ADRs), testing
.github/workflows/ci.yml # CI: lint, typecheck, test, fallow, audit, licenses
```

## Overview

```
apps/mobile  (planned, Stage 1)   Expo app: UI, navigation, state, platform integrations
   │ depends on
   ├── packages/db   (planned)    Drizzle schema + migrations for expo-sqlite (SQLCipher)
   └── packages/core (exists)     pure TypeScript domain logic
```

Scope: No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google
Drive. A multi-user shared wallet is out of scope; encrypted backup/restore is a
planned epic with details still open.

Dependencies point inwards: `apps/mobile` may use `packages/db` and `packages/core`; `packages/core` depends on
nothing app- or platform-specific.

## packages/core (exists)

- Package `@budget-lens/core`, public API exported from `src/index.ts` (source is consumed directly, no build step).
- Pure, deterministic TypeScript: no React Native, Expo, Next.js or Supabase imports (Biome `noRestrictedImports`
  override in `biome.json`), no I/O, no `Date.now()` / `new Date()` inside domain functions. Anything
  environment-dependent (current month, `fetch`, rate storage) is passed in as an argument or an injected interface.
- Money is `MinorUnits` (integer minor units); see [domain/money.md](domain/money.md).
- Minimal unit tests (business logic only) with Vitest next to the code (`src/**/*.test.ts`);
  `test/**/*.test.ts` holds the legacy characterization tests (#3). Tests are typechecked as a separate project
  with Node.js types (`test/tsconfig.json`); see [testing.md](testing.md#tools).

Planned content, one issue each: money operations and formatting (#2),
forecast (#6), month closing and `Settings` (#7), NBP exchange-rate client with an injected offline cache (#8).
Legacy behaviour is pinned by characterization tests first (#3).

## Planned app stack (Stage 1)

Decided, not implemented yet (see [decisions/](decisions/); sources: #1 "Decyzje", the [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427) and the #10
research with its correction comment):

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 58 (React Native 0.88, New Architecture), development builds (not Expo Go) |
| Navigation | Expo Router |
| UI | Expo UI (native SwiftUI / Jetpack Compose components) + Uniwind (Tailwind for React Native) for custom views |
| Local database | expo-sqlite with SQLCipher (`useSQLCipher: true`), Drizzle ORM + drizzle-kit migrations; DB key in expo-secure-store |
| Reactive reads | Drizzle `useLiveQuery` (simple single-table queries) |
| App state | Zustand with the provider pattern (store created inside a React provider) |
| Network data | TanStack Query only when network requests are added (NBP rates, license) |
| i18n | Polish and English; no hardcoded UI strings |
| Backup | No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google Drive. Encrypted backup/restore is a planned epic (details open) |
| Testing | Open-source [e2e](https://github.com/tester-army/e2e) framework with our own models ([#15 e2e decisions comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); provider open), on simulators/emulators, as the main testing; minimal Vitest unit tests in core |

Known constraints from the SDK 58 research (#10): Drizzle `useLiveQuery` only re-runs for changes to the main table
of the query (joins are ignored) and re-runs on every row change; `PRAGMA key` silently does nothing in a build
without SQLCipher, so the app must verify `PRAGMA cipher_version` before using the database.

## Open questions

Not decided yet; do not treat these as part of the stack:

- From the SDK 58 research (#10): DB key and recovery model, details of the encrypted
  backup/restore epic (e.g. full snapshot vs incremental backup to the user's own cloud storage),
  chart library (Expo UI has no Android charts), lint (Biome only vs Biome + minimal ESLint), minimum OS versions.

## Tooling

pnpm workspaces + Turborepo, TypeScript 7 (`tsc`), Vitest, Biome, Fallow, Lefthook, GitHub Actions. See
[README.md](../README.md) for commands and CI details, and [decisions/](decisions/) for the reasoning.

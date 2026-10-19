# Architecture

## Current state

Stage 0 is in progress: the monorepo, tooling and CI exist; domain logic is being ported into `packages/core`
issue by issue. `apps/mobile` now contains the Expo development-client scaffold (#73). `packages/db` (Drizzle schema) is planned.
What exists today in `packages/core`:
- money in integer minor units: the `MinorUnits` type, exact operations, parsing and native `Intl.NumberFormat`
  currency formatting for `pl` and `en`, always showing full amounts (#2/#131, see [domain/money.md](domain/money.md) and
  [ADR 0012](decisions/0012-native-intl-money-formatting.md));
- `YearMonth` months and recurrence schedules (#4, see [domain/recurrence.md](domain/recurrence.md));
- occurrence overrides (#5, see [domain/occurrence-overrides.md](domain/occurrence-overrides.md));
- the `Settings` model (#76);
- balance forecast, warning codes and exact cross-currency conversion (#6, see [domain/forecast.md](domain/forecast.md));
- month closing, balance updates and per-occurrence payment status (#84, see [domain/month-closing.md](domain/month-closing.md));
- characterization tests of the legacy implementation (#3).

## Repository layout

```
apps/mobile/             # Expo development client, Router, i18n, provider-scoped Zustand
packages/core/           # pure TypeScript domain logic, tested with Vitest
  src/index.ts           # public API – everything exported from here
  test/                  # legacy characterization tests (#3): fixtures, legacy reference, snapshots, LEGACY.md
docs/                    # architecture, conventions, glossary, domain, decisions (ADRs), testing
.github/workflows/ci.yml # CI: lint, typecheck, test, fallow, audit, licenses
```

## Overview

```
apps/mobile  (scaffold, Stage 1)   Expo app: UI, navigation, state, platform integrations
   │ depends on
   ├── packages/db   (planned)    Drizzle schema + migrations for expo-sqlite (SQLCipher)
   └── packages/core (exists)     pure TypeScript domain logic
```

Scope: No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google
Drive. A multi-user shared wallet is out of scope; encrypted backup/restore is a
planned epic with details still open (#30, E8, `epic:cloud-backup`).

Dependencies point inwards: `apps/mobile` may use `packages/db` and `packages/core`; `packages/core` depends on
nothing app- or platform-specific.

## packages/core (exists)

- Package `@budget-lens/core`, public API exported from `src/index.ts` (source is consumed directly, no build step).
- Pure, deterministic TypeScript: no React Native, Expo, Next.js or Supabase imports (Biome `noRestrictedImports`
  override in `biome.json`), no I/O, no `Date.now()` / `new Date()` inside domain functions. Anything
  environment-dependent (current month, `fetch`, rate storage) is passed in as an argument or an injected interface.
- Currency display uses the runtime's native Intl data; platform differences are accepted (#131).
- Money is `MinorUnits` (integer minor units); see [domain/money.md](domain/money.md).
- `Settings` (`src/settings.ts`, #76): the single local settings model with defaults and validation; see
  [domain/settings.md](domain/settings.md).
- Minimal unit tests (business logic only) with Vitest next to the code (`src/**/*.test.ts`);
  `test/**/*.test.ts` holds the legacy characterization tests (#3). Tests are typechecked as a separate project
  with Node.js types (`test/tsconfig.json`); see [testing.md](testing.md#tools).

Planned content: NBP exchange-rate client with an injected
offline cache (#8).
Legacy behaviour is pinned by characterization tests first (#3).

## App stack (Stage 1)

Decided stack (see [decisions/](decisions/); sources: #1 "Decyzje", the [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427) and the #10
research with its correction comment). The Status column says what the #73 `apps/mobile` scaffold
implemented and what is still planned:

| Concern | Choice | Status |
| --- | --- | --- |
| Framework | Expo SDK 58 (React Native 0.88, New Architecture), development builds (not Expo Go) | Implemented (#73): Expo SDK 58 development client |
| Navigation | Expo Router | Implemented (#73) |
| UI | Expo UI (native SwiftUI / Jetpack Compose components) + Uniwind (Tailwind for React Native) for custom views | Implemented (#73): Expo UI in `src/ui/native`, Uniwind layout; shared tokens/components in #119 |
| Local database | expo-sqlite with SQLCipher (`useSQLCipher: true`), Drizzle ORM + drizzle-kit migrations; DB key in expo-secure-store | Planned (#75) |
| Reactive reads | Drizzle `useLiveQuery` (simple single-table queries) | Planned (#75) |
| App state | Zustand with the provider pattern (store created inside a React provider) | Implemented (#73): provider-scoped store (selected month) |
| Network data | TanStack Query only when network requests are added (NBP rates, license) | Planned (with the first network requests, e.g. NBP rates #8) |
| i18n | Polish and English; no hardcoded UI strings | Implemented (#73): bundled PL/EN locale files, device-language initialization |
| Backup | No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google Drive. Encrypted backup/restore is a planned epic (#30, details open) | Planned (#30) |
| Testing | Open-source [e2e](https://github.com/tester-army/e2e) framework with our own models ([#15 e2e decisions comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); provider open), on simulators/emulators, as the main testing; minimal Vitest unit tests in core | Partly implemented (#73): e2e smoke tests on `BudgetLens-*` devices; CI plan in #15/#109 |

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

## Mobile scaffold (#73)

`apps/mobile` uses a custom entry for the English/Polish plural-rules polyfill and Expo Router.
Bundled i18n initializes synchronously from the device locale before navigation. The root contains
`I18nProvider` → `AppStoreProvider` → Router `ThemeProvider` → Stack. The Zustand vanilla store is
created once per provider with an injectable clock; it currently holds only the selected month.
No SQLite data is copied into Zustand. Boot guards, DB injection and migrations belong to #75;
onboarding and recovery belong to #59/#60. No database is opened by this scaffold.

The root redirects to Overview. Variant A from #36 has five static native tabs in this order:
Overview, Month, Forecast, Items, Settings. Each tab owns a Stack. Savings is pushed inside Overview,
using a small Expo UI native-button adapter. Other screens are translated placeholders. Typed routes
remain off. Uniwind handles custom layout; shared tokens/components remain in #119.
Expo UI imports are restricted by Biome to `src/ui/native/`.

Development commands and test IDs: [mobile development](mobile-development.md).

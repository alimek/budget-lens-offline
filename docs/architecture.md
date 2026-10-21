# Architecture

## Current state

Stage 0 is in progress: the monorepo, tooling and CI exist; domain logic is being ported into `packages/core`
issue by issue. `apps/mobile` now contains the Expo development-client scaffold (#73). `packages/db` holds the Drizzle
schema v1 and its migrations, which the app runs at startup (#74), plus the items and rule-version repository with
the list reads the item screens and the forecast hook will use (#81).
What exists today in `packages/core`:
- money in integer minor units: the `MinorUnits` type, exact operations, parsing and native `Intl.NumberFormat`
  currency formatting for `pl` and `en`, always showing full amounts (#2/#131, see [domain/money.md](domain/money.md) and
  [ADR 0012](decisions/0012-native-intl-money-formatting.md));
- `YearMonth` months and recurrence schedules (#4, see [domain/recurrence.md](domain/recurrence.md));
- occurrence overrides (#5, see [domain/occurrence-overrides.md](domain/occurrence-overrides.md));
- rule versions and the pure rule-edit planner (#80, see [domain/rule-versions.md](domain/rule-versions.md)), with
  the required per-item `currency` on a versioned item (#138, landed with #81);
- the `Settings` model (#76);
- injected NBP table-A client, current-rate store contract, shared rate selection and app-open refresh (#8);
- balance forecast, warning codes and exact cross-currency conversion (#6, see [domain/forecast.md](domain/forecast.md));
- month closing, balance updates and per-occurrence payment status (#84, see [domain/month-closing.md](domain/month-closing.md));
- characterization tests of the legacy implementation (#3).

## Repository layout

```
apps/mobile/             # Expo development client, Router, i18n, provider-scoped Zustand
packages/core/           # pure TypeScript domain logic, tested with Vitest
packages/db/             # Drizzle schema v1, migrations, runMigrations() and the items repository (#74/#81)
  src/index.ts           # public API – everything exported from here
  test/                  # legacy characterization tests (#3): fixtures, legacy reference, snapshots, LEGACY.md
docs/                    # architecture, conventions, glossary, domain, decisions (ADRs), testing
.github/workflows/ci.yml # CI: lint, typecheck, test, fallow, audit, licenses
```

## Overview

```
apps/mobile  (scaffold, Stage 1)   Expo app: UI, navigation, state, platform integrations
   │ depends on
   ├── packages/db   (exists)     Drizzle schema + migrations for expo-sqlite (SQLCipher since #75)
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

NBP uses an injected fetch and `RateStore` (#8); SQLite storage (#92) and app
lifecycle refresh integration (#93) remain in Stage 1.
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
| UI | Expo UI (native SwiftUI / Jetpack Compose components) + Uniwind (Tailwind for React Native) for custom views | Implemented (#73, #119): Expo UI wrappers in `src/ui/native`, Indigo tokens in `global.css` + `src/ui/lib/theme.ts`, React Native Reusables components in `src/ui/components` ([design system](design-system.md)) |
| Local database | expo-sqlite with SQLCipher (`useSQLCipher: true`), Drizzle ORM + drizzle-kit migrations; DB key in expo-secure-store | Implemented (#74, #75): expo-sqlite 58.0.13 with SQLCipher, `packages/db` schema v1 with drizzle-orm 0.45.4 / drizzle-kit 0.31.11, migrations applied by `runMigrations()` on every start behind an encrypted copy ([packages/db/README.md](../packages/db/README.md)); device key in expo-secure-store, `PRAGMA cipher_version` guard and boot screens ([#75](https://github.com/alimek/budget-lens-offline/issues/75), below) |
| Reactive reads | A small in-house hook on expo-sqlite's `addDatabaseChangeListener` declaring the tables a query reads (#35 §4); Drizzle `useLiveQuery` only where one table suffices | Planned (#75); `packages/db` exposes the item list reads with the tables they depend on (#81) |
| App state | Zustand with the provider pattern (store created inside a React provider) | Implemented (#73): provider-scoped store (selected month) |
| Network data | TanStack Query only when network requests are added (NBP rates, license) | Planned (with the first network requests, e.g. NBP rates #8) |
| i18n | Polish and English; no hardcoded UI strings | Implemented (#73, #77): i18next + react-i18next, bundled PL/EN resources per namespace, English source and runtime fallback, typed keys, system language with an in-app override API, i18next-cli for extraction only, no CI translation check ([i18n](i18n.md)) |
| Backup | No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google Drive. Encrypted backup/restore is a planned epic (#30, details open) | Planned (#30) |
| App updates | EAS Update (`expo-updates`) for JavaScript and asset changes, fingerprint runtime version, background check that never blocks startup, applied on the next launch | Implemented (#184): [release/updates.md](release/updates.md), [ADR 0013](decisions/0013-eas-update-network-exception.md) |
| Testing | Open-source [e2e](https://github.com/tester-army/e2e) framework with our own models ([#15 e2e decisions comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252); provider open), on simulators/emulators, as the main testing; minimal Vitest unit tests in core | Partly implemented (#73): e2e smoke tests run locally on a dev machine on dedicated simulators/emulators (not in CI, [ci.md](ci.md#native-builds-and-e2e-local)); setup in #15 |

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
Bundled i18n initializes synchronously before navigation, from the stored language preference when a store is
injected, otherwise from the device language (unsupported languages fall back to English); see [i18n](i18n.md).
The root contains
`I18nProvider` → `AppStoreProvider` → Router `ThemeProvider` → Stack. The Zustand vanilla store is
created once per provider with an injectable clock; it currently holds only the selected month.
No SQLite data is copied into Zustand. Onboarding and recovery belong to #59/#60.

**Database bootstrap (#74, #75).** `DatabaseGate` (`src/db/database-gate.tsx`) wraps the Stack in the root layout. It
calls `bootAppDatabase()` (`src/db/database.ts`), which opens `budget-lens.db` encrypted (change listener on), wraps
it with `createDatabase()` from `packages/db` and migrates it. The gate renders the screens only after that, and
shows a boot screen (`src/db/boot-screens.tsx`) instead of the app while the database stays closed; nothing here
throws during render or deletes the database file. `openEncryptedDatabase()` (`src/db/encrypted-database.ts`) keeps
the order #34 requires: `PRAGMA cipher_version` first — in a build without SQLCipher `PRAGMA key` silently does
nothing, so such a build stops rather than write plaintext — then `PRAGMA key` with the device key, then a read of
`sqlite_master`, because a wrong key is only reported when a page is read. The key is 32 random bytes as lowercase
hex in expo-secure-store under `bl.db.key.v1`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, written and read back before the
file is created; a new file always gets a new key because the iOS Keychain survives an uninstall. A read that
SecureStore refuses is its own screen with a retry, never "key missing" (#34 §2). Before migrations the app takes
an encrypted copy (`sqlcipher_export` into a database attached with the same key) whenever one is pending, keeps it
until the next successful boot, and puts it back if a migration or the post-commit integrity check fails; the user
then sees the recovery screen. "Start over" renames the old file and keeps it: deleting such files and restoring a
backup are E8 work (#96, #97). Android Auto Backup and device transfer are excluded by explicit rules from
`plugins/withBackupRules.js` (not `allowBackup=false`); the iOS device backup keeps the ciphertext file (owner
review #34). A root error boundary is follow-up work with the final #60 screens. No repository or screen reads the
database yet (#81).

The root redirects to Overview. Variant A from #36 has five static native tabs in this order:
Overview, Month, Forecast, Items, Settings. Each tab owns a Stack. Savings is pushed inside Overview,
from the Overview card's native secondary button. Other screens are translated placeholders built from the
design system components. Typed routes remain off. Tokens, typography and shared components are described in
[design system](design-system.md) (#119). Expo UI imports are restricted by Biome to `src/ui/native/`.

Development commands and test IDs: [mobile development](mobile-development.md).

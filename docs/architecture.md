# Architecture

## Overview

```
apps/mobile  (planned, Stage 1)   Expo app: UI, navigation, state, platform integrations
   │ depends on
   ├── packages/db   (planned)    Drizzle schema + migrations for expo-sqlite (SQLCipher)
   └── packages/core (exists)     pure TypeScript domain logic
```

Dependencies point inwards: `apps/mobile` may use `packages/db` and `packages/core`; `packages/core` depends on
nothing app- or platform-specific.

## packages/core (exists)

- Package `@budget-lens/core`, public API exported from `src/index.ts` (source is consumed directly, no build step).
- Pure, deterministic TypeScript: no React Native, Expo, Next.js or Supabase imports (Biome `noRestrictedImports`
  override in `biome.json`), no I/O, no `Date.now()` / `new Date()` inside domain functions. Anything
  environment-dependent (current month, `fetch`, rate storage) is passed in as an argument or an injected interface.
- Money is `MinorUnits` (integer minor units); see [domain/money.md](domain/money.md).
- Unit tests with Vitest next to the code (`src/**/*.test.ts`).

Planned content, one issue each: money operations and formatting (#2), recurrence (#4), occurrence overrides (#5),
forecast (#6), month closing and `Settings` (#7), NBP exchange-rate client with an injected offline cache (#8).
Legacy behaviour is pinned by characterization tests first (#3).

## Planned app stack (Stage 1)

Decided, not implemented yet (see [decisions/](decisions/); sources: #1 "Decyzje" and the #10 research with its
correction comment):

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 58 (React Native 0.88, New Architecture), development builds (not Expo Go) |
| UI | Expo UI (native SwiftUI / Jetpack Compose components) + Uniwind (Tailwind for React Native) for custom views |
| Local database | expo-sqlite with SQLCipher (`useSQLCipher: true`), Drizzle ORM + drizzle-kit migrations; DB key in expo-secure-store |
| Reactive reads | Drizzle `useLiveQuery` (simple single-table queries) |
| App state | Zustand with the provider pattern (store created inside a React provider) |
| Network data | TanStack Query only when network requests are added (NBP rates, license) |
| i18n | Polish and English; no hardcoded UI strings |
| Sync / backup | The user's own iCloud / Google Drive; no Budget Lens backend |
| E2E tests | TesterArmy `e2e` on simulators/emulators (#15) |

Known constraints from the SDK 58 research (#10): Drizzle `useLiveQuery` only re-runs for changes to the main table
of the query (joins are ignored) and re-runs on every row change; `PRAGMA key` silently does nothing in a build
without SQLCipher, so the app must verify `PRAGMA cipher_version` before using the database.

## Open questions

Not decided yet; do not treat these as part of the stack:

- **Navigation library** – Expo Router is a candidate, but no decision has been recorded.
- From the SDK 58 research (#10): DB key and recovery model, MVP sync scope (snapshot backup/restore vs record sync),
  chart library (Expo UI has no Android charts), lint (Biome only vs Biome + minimal ESLint), minimum OS versions.

## Tooling

pnpm workspaces + Turborepo, TypeScript 7 (`tsc`), Vitest, Biome, Fallow, Lefthook, GitHub Actions. See
[README.md](../README.md) for commands and CI details, and [decisions/](decisions/) for the reasoning.

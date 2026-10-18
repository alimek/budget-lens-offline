# AGENTS.md

Guide for AI coding agents (and humans) working on **Budget Lens (offline)**. Keep it accurate: if a PR
changes domain behaviour, architecture or conventions, update this file or the linked doc in the same PR.

## Product

Budget Lens is an **offline-first personal budget app** built with Expo (iOS and Android).

- All data stays on the user's device (encrypted SQLite). There is no Budget Lens server.
- Sync/backup only goes through the user's own **iCloud** or **Google Drive**.
- Monetization: a **one-time license**. The core logic is open source under the **MIT** license (`LICENSE`).
- The app ports the business logic of the legacy web app [`alimek/budget-lens`](https://github.com/alimek/budget-lens)
  (Next.js + Supabase) into a platform-agnostic TypeScript package.

## Current state of the repo

Stage 0 is in progress: the monorepo, tooling and CI exist; domain logic is being ported into `packages/core`
issue by issue. `apps/mobile` (Expo) and `packages/db` (Drizzle schema) are **planned, not created yet**.
What exists today in `packages/core`: the `MinorUnits` money type (`isMinorUnits`, `toMinorUnits`, `sumMinorUnits`).

## Monorepo layout

```
apps/                    # applications; apps/mobile (Expo) will be added in Stage 1
packages/core/           # pure TypeScript domain logic, tested with Vitest
  src/index.ts           # public API – everything exported from here
docs/                    # architecture, domain, decisions (ADRs), testing
.github/workflows/ci.yml # CI: lint, typecheck, test, fallow
```

Planned packages: `apps/mobile` (Expo app), `packages/db` (Drizzle schema and migrations for expo-sqlite).

Decided app stack (not implemented yet): Expo SDK 58 with development builds, Expo Router, Expo UI + Uniwind,
Zustand (provider pattern), Drizzle on expo-sqlite with SQLCipher, TanStack Query only for network requests.
See [docs/architecture.md](docs/architecture.md).

## Commands

Run from the repo root (pnpm version is pinned in `packageManager`; use `corepack enable`):

```sh
pnpm install          # dependencies + Git hooks (Lefthook via the `prepare` script)
pnpm lint             # Biome lint + format check
pnpm format           # Biome autofix
pnpm typecheck        # TypeScript 7 `tsc --noEmit` in every package (via Turborepo)
pnpm test             # Vitest in every package (via Turborepo)
pnpm fallow           # Fallow: dead code, unused exports/dependencies, duplication
pnpm check            # all of the above
pnpm --filter @budget-lens/core test:coverage   # coverage report (no thresholds)
```

CI runs the same tasks as four required jobs: `lint`, `typecheck`, `test`, `fallow`. Additional quality gates are
planned in #18.

## Conventions (must follow)

- **English only**: code, identifiers, comments, docs, test names, commit messages, PR titles and descriptions.
  (Issue discussions may be in Polish.) Legacy user-facing data quoted verbatim in characterization tests is the
  only exception.
- **No hardcoded UI strings.** The app ships in **Polish and English** via i18n (separate issue). Domain code
  returns data and codes (e.g. warning codes with parameters), never translated messages.
- **Money is integer minor units** (grosze for PLN) using the branded `MinorUnits` type. No floats for amounts,
  no `parseFloat` on money. See [docs/domain/money.md](docs/domain/money.md).
- **`packages/core` is pure TypeScript**: no imports from React Native, Expo, Next.js or Supabase (enforced by
  Biome `noRestrictedImports`), no network or storage side effects, no reading the system clock – pass the current
  month/time in as arguments.
- **Dependencies: always the latest stable version, pinned exactly** (no `^`/`~`, no RC/beta; a pre-release only
  when a package has no stable release at all). See [ADR 0010](docs/decisions/0010-dependency-versions.md). Node version is pinned in `.nvmrc` (latest LTS).
- **TypeScript 7** (`typescript` package, CLI `tsc`), `strict` plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` (`tsconfig.base.json`).
- **Biome** for lint and format, **Fallow** must stay clean, **Lefthook** pre-commit runs Biome and typecheck.
- **Tests** follow [docs/testing.md](docs/testing.md): TesterArmy e2e is the main testing; unit tests are minimal
  (business logic only, Arrange-Act-Assert); no percentage coverage thresholds.

## Workflow

- One issue → one branch `dev/<issue-number>-<short-slug>` from the latest `origin/main`.
- `main` is protected: changes only via pull request; never push to `main`.
- PR to `main` with an English description ending in `Closes #<n>`. Stacked PRs are allowed (base on the parent
  branch and say so in the description).
- All CI checks must be green. The **Reviewer squash-merges** the PR (with an English commit message).
- **UI PRs** must include e2e evidence with **screenshots or a video**, from a TesterArmy `e2e` test run or
  `e2e explore` on a development build.
- Run the app only on the dedicated **`BudgetLens-*` simulators/emulators**, never on personal or shared devices.
- Metro runs on the repo's **fixed port**. The port number is not chosen yet; it will be defined together with
  `apps/mobile` in #15.
- **Docs rule:** every PR that changes domain behaviour or architecture updates the relevant file in `docs/`
  (and this file if needed). The Reviewer checks this.
- Issue status labels: `status:in-progress`, `status:in-review`, `status:blocked`; the GitHub Project board
  mirrors them.

## Domain glossary

| Term | Meaning | Doc |
| --- | --- | --- |
| Minor units / `MinorUnits` | Integer amount in the currency's smallest unit (1 PLN = 100 grosze). | [money](docs/domain/money.md) |
| Item | A budget entry: an expense or an income, one-time or recurring. | [recurrence](docs/domain/recurrence.md) |
| Recurrence | Rule deciding in which months a recurring item is active (target: "every N months from an anchor month", optional end). | [recurrence](docs/domain/recurrence.md) |
| Occurrence | A single month's instance of an item. | [recurrence](docs/domain/recurrence.md) |
| Occurrence override | Change of the amount of, or skipping, one occurrence in one month (`occurrence_overrides`). Replaces the legacy name-based "(nadpisanie)" items. | [occurrence-overrides](docs/domain/occurrence-overrides.md) |
| Payment status | Whether an expense was paid / an income received in a given month. | [forecast](docs/domain/forecast.md) |
| Forecast | Month-by-month projection of the balance (rolling balance, total funds, warnings). | [forecast](docs/domain/forecast.md) |
| Month closing | Closing the active month: record its totals and open the next month with opening balance = closing balance. | [month-closing](docs/domain/month-closing.md) |
| Settings-driven thresholds | Warning thresholds (low balance, large expense) come from user `Settings`, never constants. | [month-closing](docs/domain/month-closing.md) |
| NBP exchange rates | Average rates (table A) from the National Bank of Poland API, cached on the device for offline use. Rates are used exactly as the API returns them (per 1 unit of the currency). | [exchange-rates](docs/domain/exchange-rates.md) |
| `LEGACY:` | Comment marking legacy behaviour kept on purpose in characterization tests, linked to the issue that changes it. | [testing](docs/testing.md) |

## Documentation map

- [docs/architecture.md](docs/architecture.md) – packages, boundaries, planned app stack
- [docs/domain/](docs/domain/) – one file per domain area (legacy behaviour, target behaviour, status)
- [docs/decisions/](docs/decisions/) – short ADRs for stack decisions
- [docs/testing.md](docs/testing.md) – testing guidelines
- [README.md](README.md) – setup, commands, CI details

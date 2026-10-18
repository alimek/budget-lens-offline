# AGENTS.md

Instructions for AI coding agents (and humans) working on **Budget Lens (offline)**. Keep this file short: details
live in `docs/`. If a PR changes domain behaviour, architecture or conventions, update the linked doc in the same PR.

## Product and scope

Budget Lens is a **fully offline personal budget app** built with Expo (iOS and Android). It ports the business logic
of the legacy web app [`alimek/budget-lens`](https://github.com/alimek/budget-lens) (Next.js + Supabase) into a
platform-agnostic TypeScript package.

- No Budget Lens server or accounts; data stays on device; optional backup only via the user's own iCloud / Google Drive.
- A multi-user shared wallet is out of scope. Encrypted backup/restore is a planned epic; its details are still open
  (research in #10).
- One-time license; the core logic is open source under the MIT license (`LICENSE`).

## Hard rules

- **English only** in code, docs, commits, PRs and issues. **No hardcoded UI strings**: the app ships in Polish and
  English via i18n; domain code returns codes and parameters, never translated messages.
- **Money is integer minor units** (`MinorUnits`, grosze for PLN). No floats and no `parseFloat` for amounts.
- **Dependencies: latest stable, pinned exactly** (no `^`/`~`, no RC/beta) – [ADR 0010](docs/decisions/0010-dependency-versions.md).
- **`packages/core` stays pure TypeScript**: no React Native, Expo, Next.js or Supabase imports; no network, storage
  or system clock – pass them in as arguments or injected interfaces.
- **No secrets on GitHub.** Secrets and API keys (e.g. for models) never go into the repo, PR or issue text,
  comments, screenshots or CI logs. Keep them only in the local env or GitHub Actions secrets; CI must never echo
  them; `.env*` is gitignored ([#15 e2e decisions](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252)).

Details and the rest of the conventions: [docs/conventions.md](docs/conventions.md).

## Commands

Run from the repo root (pnpm version pinned in `packageManager`; use `corepack enable`):

```sh
pnpm install     # dependencies + Git hooks (Lefthook)
pnpm lint        # Biome lint + format check (pnpm format to autofix)
pnpm typecheck   # TypeScript 7 `tsc --noEmit`
pnpm test        # Vitest
pnpm fallow      # dead code, unused exports/dependencies
pnpm check       # all of the above
```

CI runs `lint`, `typecheck`, `test` and `fallow` as required jobs. More in [README.md](README.md).

## Workflow

- One issue → one branch `dev/<issue-number>-<short-slug>` from the latest `origin/main`. Never push to `main`.
- PR to `main` with an English description ending in `Closes #<n>`.
- The **Reviewer** reviews and squash-merges after approval and fully green CI.
- Testing: e2e first; unit tests only for business logic, Arrange-Act-Assert; no coverage thresholds – [docs/testing.md](docs/testing.md).
- UI PRs include e2e evidence (screenshots or video) from a development build.
- Run the app only on the dedicated `BudgetLens-*` simulators/emulators, never on personal or shared devices.
- Metro runs on the repo's fixed port; the number will be defined in #15.
- Docs rule: every PR that changes domain behaviour or architecture updates `docs/`; the Reviewer checks this.

## Docs

- [docs/conventions.md](docs/conventions.md) – detailed conventions and workflow rules
- [docs/glossary.md](docs/glossary.md) – domain glossary
- [docs/architecture.md](docs/architecture.md) – current state, layout, packages, planned app stack
- [docs/domain/](docs/domain/) – one file per domain area
- [docs/testing.md](docs/testing.md) – testing strategy and rules
- [docs/decisions/](docs/decisions/) – ADRs; the 2026-10-18 decisions are summarized in the
  [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427)

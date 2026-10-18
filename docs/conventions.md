# Conventions

Detailed rules behind the hard rules in [AGENTS.md](../AGENTS.md). Sources: the ADRs in [decisions/](decisions/) and
the [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

## Language and UI strings

- **English only**: code, identifiers, comments, docs, test names, commit messages, PR titles and descriptions,
  issues. Legacy user-facing data quoted verbatim in characterization tests is the only exception
  ([ADR 0009](decisions/0009-english-and-i18n.md)).
- **No hardcoded UI strings.** The app ships in **Polish and English** via i18n (separate issue). Domain code
  returns data and codes (e.g. warning codes with parameters), never translated messages.

## Code

- **Money is integer minor units** (grosze for PLN) using the branded `MinorUnits` type. No floats for amounts,
  no `parseFloat` on money. See [domain/money.md](domain/money.md).
- **`packages/core` is pure TypeScript**: no imports from React Native, Expo, Next.js or Supabase (enforced by
  Biome `noRestrictedImports`), no network or storage side effects, no reading the system clock – pass the current
  month/time in as arguments. See [architecture.md](architecture.md).
- **TypeScript 7** (`typescript` package, CLI `tsc`), `strict` plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` (`tsconfig.base.json`).
- **Biome** for lint and format, **Fallow** must stay clean, **Lefthook** pre-commit runs Biome and typecheck.
- **Tests** follow [testing.md](testing.md): e2e tests are the main testing; unit tests are minimal (business logic
  only, Arrange-Act-Assert); no percentage coverage thresholds.

## Dependencies

- **Always the latest stable version, pinned exactly** (no `^`/`~`, no RC/beta; a pre-release only when a package
  has no stable release at all). See [ADR 0010](decisions/0010-dependency-versions.md).
- Node version is pinned in `.nvmrc` (latest LTS).

## Secrets

- Secrets and API keys (for example model API keys for e2e tests) **never go to GitHub**: not into the repo, not
  into PR or issue text or comments, and not into CI logs.
- Keep them only in a local environment (not committed) or a secret store (e.g. GitHub Actions secrets for CI).
- CI steps must never echo or print secrets.

## Workflow

- One issue → one branch `dev/<issue-number>-<short-slug>` from the latest `origin/main`.
- `main` is protected: changes only via pull request; never push to `main`.
- PR to `main` with an English description ending in `Closes #<n>`. Stacked PRs are allowed (base on the parent
  branch and say so in the description).
- The **Reviewer squash-merges** the PR after approval and fully green CI (with an English commit message).
- **UI PRs** must include e2e evidence with **screenshots or a video**, from an `e2e` test run or `e2e explore` on a
  development build (see [testing.md](testing.md)).
- Run the app only on the dedicated **`BudgetLens-*` simulators/emulators**, never on personal or shared devices.
- Metro runs on the repo's **fixed port**. The port number is not chosen yet; it will be defined together with
  `apps/mobile` in #15.
- **Docs rule:** every PR that changes domain behaviour or architecture updates the relevant file in `docs/`
  (and [AGENTS.md](../AGENTS.md) if needed). The Reviewer checks this.
- Issue status labels: `status:in-progress`, `status:in-review`, `status:blocked`; the GitHub Project board
  mirrors them.
- CI runs the same tasks as four required jobs: `lint`, `typecheck`, `test`, `fallow`. Additional quality gates
  are planned in #18. Commands and CI details: [README.md](../README.md).

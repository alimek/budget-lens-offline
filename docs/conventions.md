# Conventions

Detailed rules behind the hard rules in [AGENTS.md](../AGENTS.md). Sources: the ADRs in [decisions/](decisions/) and
the [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

## Language and UI strings

- **English only**: code, identifiers, comments, docs, test names, commit messages, PR titles and descriptions,
  issues. Legacy user-facing data quoted verbatim in characterization tests is the only exception
  ([ADR 0009](decisions/0009-english-and-i18n.md)).
- **No hardcoded UI strings.** The app ships in **Polish and English** via i18n ([i18n](i18n.md)): add keys to
  English first; Polish may lag and falls back to English. Domain code returns data and codes (e.g. warning codes
  with parameters), never translated messages.

## Code

- **Money is integer minor units** (grosze for PLN) using the branded `MinorUnits` type. No floats for amounts,
  no `parseFloat` on money. See [domain/money.md](domain/money.md).
- **`packages/core` is pure TypeScript**: no imports from React Native, Expo, Next.js or Supabase (enforced by
  Biome `noRestrictedImports`), no network or storage side effects, no reading the system clock – pass the current
  month/time in as arguments. See [architecture.md](architecture.md).
- **TypeScript 7** (`typescript` package, CLI `tsc`), `strict` plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` and more (`tsconfig.base.json`,
  [ci.md](ci.md#typescript)).
- **Biome** for lint and format, **Fallow** must stay clean, **Lefthook** pre-commit runs Biome and typecheck.
- **Test files:** `src/**/*.test.ts` next to the code, or `packages/core/test/**/*.test.ts` for the legacy
  characterization tests (#3); both locations are allowed.
- **Tests** follow [testing.md](testing.md): e2e tests are the main testing; unit tests are minimal (business logic
  only, Arrange-Act-Assert); no percentage coverage thresholds.

## Dependencies

- **Always the latest stable version, pinned exactly** (no `^`/`~`, no RC/beta; a pre-release only when a package
  has no stable release at all). See [ADR 0010](decisions/0010-dependency-versions.md).
- Node version is pinned in `.nvmrc` (latest LTS).

## Secrets

Source: [#15 e2e decisions comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252).

- Secrets and API keys (for example the model provider API key for e2e tests) **never appear on GitHub**: not
  committed, not in PR or issue descriptions, comments or screenshots, and not in CI logs.
- Keep them only in the local environment (on the local dev machine for e2e) or in GitHub Actions secrets if CI needs
  them.
- `.env*` files are gitignored. CI steps never echo or print secrets; secrets are masked in CI logs.
- Setup that needs a secret is documented in `docs/` by variable name only, never with a value.

## Telemetry

Tool telemetry is disabled through environment variables, locally and in CI:
- Turborepo: `TURBO_TELEMETRY_DISABLED=1` (set in `.github/workflows/ci.yml`).
- `e2e` CLI (sends anonymous usage telemetry by default): `E2E_TELEMETRY_DISABLED=1` in every environment, local
  and CI ([#15 e2e decisions comment](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6253895252);
  behaviour: [e2e telemetry docs](https://e2e.tester.army/docs/telemetry)). The CLI also honours
  `DO_NOT_TRACK=1`, but the repo standard is `E2E_TELEMETRY_DISABLED=1`.
- Expo CLI (`@expo/cli` sends usage telemetry by default): `EXPO_NO_TELEMETRY=1`, set as a prefix in the
  `start`, `ios`, `android` and `export` scripts of `apps/mobile/package.json` (Expo does not run in CI, see
  [ci.md](ci.md#native-builds-and-e2e-local)); set it yourself when calling `expo` directly on your dev machine
  (for example `EXPO_NO_TELEMETRY=1 pnpm --filter @budget-lens/mobile exec expo prebuild`).

## Workflow

- One issue → one branch `dev/<issue-number>-<short-slug>` from the latest `origin/main`.
- `main` is protected: changes only via pull request; never push to `main`.
- PR to `main` with an English description ending in `Closes #<n>`. Stacked PRs are allowed (base on the parent
  branch and say so in the description).
- A reviewer **squash-merges** the PR after approval and fully green CI (with an English commit message).
- **UI PRs** must include e2e evidence: the **e2e result summary and 1–3 key screenshots that show the change**
  (simulator/emulator named; **iOS only** by default, both platforms only when the PR is platform-specific or before a
  release build, see [testing.md](testing.md#platforms)) from a TesterArmy `e2e` run or `e2e explore` on a local
  development build on a local dev machine, attached to the PR description in the Screenshots section of the PR
  template. Test evidence is never committed; the full run output stays local, outside the repo (#241, see
  [testing.md](testing.md#test-evidence-stays-out-of-the-repo)). A manual screenshot from a
  development build alone is not enough. Native builds and E2E do not run in CI (see
  [ci.md](ci.md#native-builds-and-e2e-local)).
- Run the app only on **dedicated simulators/emulators** (names via `E2E_IOS_SIMULATOR` / `E2E_ANDROID_AVD`), never
  on personal or shared devices.
- Metro runs on the repo's **fixed port 8073**; see [mobile development](mobile-development.md).
- **Docs rule:** every PR that changes domain behaviour or architecture updates the relevant file in `docs/`
  (and [AGENTS.md](../AGENTS.md) if needed). Reviewers check this.
- Issue status labels: `status:in-progress`, `status:in-review`, `status:blocked`; the GitHub Project board
  mirrors them.
- **Labels are config:** the label set lives in `.github/labels.tsv`; change a label in a PR, and
  `scripts/github/sync-labels.sh` applies it. Scripts, token scopes and the scheduling rules (pinned reviewed
  checkout, owner consent): [github-automation.md](github-automation.md).
- **Machine-agnostic repo:** no host-, user- or operator-specific data and no references to a specific agent or bot
  setup (see the hard rule in [AGENTS.md](../AGENTS.md)).
- PR titles follow Conventional Commits (`feat(core): …`, `fix: …`, `ci: …`); CI checks it (`pr-title`).
- CI gates: `lint`, `typecheck`, `test`, `fallow`, `audit`, `licenses`, `pr-title`, `pr-body`; all must pass.
  Details: [ci.md](ci.md). Commands: [README.md](../README.md).

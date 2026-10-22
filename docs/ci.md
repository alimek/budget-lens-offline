# CI quality gates

CI is the safety net for automatic merges (#18): a PR is merged only after approval and fully green CI, so every
regression we care about must turn a job red. Each gate is a separate job with a stable id, usable as a required
status check. Making checks required in the `main` ruleset is the repository owner's decision; see
[README.md](../README.md#ci) for the job list and how to require them.

## Workflows

- `.github/workflows/ci.yml` runs on every pull request and on every push to `main`: `lint`, `typecheck`, `test`,
  `fallow`, `audit`, `licenses`. All jobs run in parallel; outdated PR runs are cancelled (`concurrency`).
- `.github/workflows/pr.yml` checks the PR metadata on `opened`, `edited`, `reopened` and `synchronize`:
  `pr-title`, `pr-body`. A separate workflow, so editing the title or body re-runs only these jobs. They do not
  run on push to `main` (there is no PR there).
- `.github/workflows/issue-status-cleanup.yml` runs when an issue is closed: it removes every `status:*` label and,
  for issues closed as completed, adds `status:done`. It uses only the default `GITHUB_TOKEN` with `issues: write`.
- Every job runs on the GitHub-hosted `ubuntu-latest` runner. CI keeps only fast checks; native builds and E2E tests
  do not run in GitHub Actions. See [Native builds and E2E (local)](#native-builds-and-e2e-local).
- Shared setup: `.github/actions/setup` (pnpm from `packageManager` with the pnpm store cache, Node.js from `.nvmrc`,
  `pnpm install --frozen-lockfile`). `typecheck` and `test` also restore the local Turborepo cache
  (`.turbo/cache`, via `actions/cache`). `.nvmrc` is a Turborepo `globalDependencies` entry, so a Node.js bump
  (which can also change `Intl`/ICU output) invalidates every cached task. Third-party actions are pinned to commit
  SHAs.

## Gates

| Job | Fails when |
| --- | --- |
| `lint` | Any Biome diagnostic, including warnings (`biome check --error-on-warnings`), or a migration problem in `packages/db`: `drizzle-kit check` not clean, schema changes without a migration, a stale `migrations.generated.ts` or a migration not newer than the previous one (`db:check`, see [packages/db](../packages/db/README.md#migrations)) |
| `typecheck` | Any TypeScript 7 error with the strict options in `tsconfig.base.json` |
| `test` | Any failing Vitest test (coverage is reported, no thresholds) |
| `fallow` | Any unused file, export, type or dependency (dev dependencies too), unlisted dependency, cycle or stale suppression |
| `audit` | `pnpm audit` finds a high or critical advisory |
| `licenses` | A dependency has a license outside the allowlist, or an unknown or missing license |
| `pr-title` | The PR title is not in Conventional Commits format (`feat(core): …`, `fix: …`, `ci: …`); GitHub's `Revert "…"` title is also accepted |
| `pr-body` | The PR description has no `Closes #N`, `Fixes #N` or `Resolves #N` |
| every job | `pnpm install --frozen-lockfile` fails because `pnpm-lock.yaml` is out of date with a `package.json` |

### Biome

`biome.json`: the `recommended` preset plus stricter rules at `error` level, for example `noExplicitAny`,
`noNonNullAssertion`, `noParameterAssign`, `noEnum`, `useImportType`, unused variables, imports and parameters, and
the type-aware `nursery` rules `noFloatingPromises` and `noMisusedPromises` (nursery rules may be renamed in a Biome
upgrade; the upgrade PR updates the config). `useLiteralKeys` is off because it conflicts with
`noPropertyAccessFromIndexSignature`.

### TypeScript

`tsconfig.base.json`: `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature` and `verbatimModuleSyntax`.
Index signatures (for example `process.env`) are read with brackets: `process.env["TZ"]`.

Exception: in app code, read `EXPO_PUBLIC_*` variables with dot access (`process.env.EXPO_PUBLIC_API_URL`). Expo
inlines their values at build time only for dot access; `process.env["EXPO_PUBLIC_API_URL"]` is silently left
un-inlined and is `undefined` in the app (`useLiteralKeys` is off, so Biome does not catch it). Declare each variable
in a typed `ProcessEnv` augmentation so that `noPropertyAccessFromIndexSignature` accepts the dot access:

```ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly EXPO_PUBLIC_API_URL?: string;
    }
  }
}
```

### Fallow

`.fallowrc.json` sets every dead-code and dependency rule to `error`, without an allow-list. Entry points are
detected from `package.json` (`exports`, scripts) and the tool plugins (Vitest, Biome, Lefthook…); add an `entry`
glob only for a real, documented entry point.

### Audit

`pnpm audit --audit-level high`; the level is also set in `pnpm-workspace.yaml` (`audit.level`).
To tolerate one advisory temporarily (for example, no fix is published yet and the code path is not used), add its
GHSA id to `audit.ignore` in `pnpm-workspace.yaml` with a comment giving the reason, the tracking issue and a review
date, in a PR that explains it:

```yaml
audit:
  level: high
  ignore:
    # Dev-only, not reachable from the app; remove when a patched version is out (#123, review 2026-12-01).
    - GHSA-xxxx-xxxx-xxxx
```

### Licenses

`pnpm check:licenses` (`scripts/check-licenses.mjs`) reads `pnpm licenses list --recursive --json` (production and
dev dependencies) and allows only MIT-compatible licenses: MIT, MIT-0, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0,
0BSD, CC0-1.0, CC-BY-4.0, Unlicense, BlueOak-1.0.0, Python-2.0. An SPDX `OR` expression passes when one
alternative is allowed; `AND` needs every part allowed. GPL, AGPL, LGPL, any other license and a missing or unknown
license fail.

Reviewed exceptions are listed in `EXCEPTIONS` in the script: a package name pattern, the exact license and a
reason. Current exception: `lightningcss` (and its platform binaries), MPL-2.0, a build-time dependency of
Vite (Vitest) and Uniwind, never modified or shipped in the app.

## Native builds and E2E (local)

Owner decision (#166, 2026-10-19): CI on GitHub runs only the fast checks above, all on `ubuntu-latest`. No workflow
builds the app natively (no macOS/iOS or Android runner, no `expo prebuild`, `xcodebuild`, Gradle or simulator) and
no workflow runs E2E or smoke tests. This replaces the `macOS and iOS` workflow from #148.

- Native builds (iOS and Android development builds) and E2E tests run **locally on a dev machine** (macOS with
  Xcode for iOS, Android SDK for Android), only on **dedicated simulators/emulators** (see
  [mobile development](mobile-development.md#development-builds)).
- iOS release builds for internal TestFlight run on **EAS Build** and are uploaded with **EAS Submit**, both started
  manually (#178, [release/testflight.md](release/testflight.md)); no GitHub workflow triggers them.
- The evidence on the PR is **screenshots** (simulator/emulator named; a video is also fine; **iOS only** by
  default, both iOS and Android only for platform-specific changes and before a release build, see
  [testing.md](testing.md#platforms)) from a TesterArmy `e2e` run or `e2e explore` on a local development build on a local dev machine, in the
  **Screenshots** section of the [PR template](../.github/pull_request_template.md). A manual screenshot from a
  development build alone is not enough. It is required for every PR
  that changes UI; reviewers check it. `pr-body` does not check it (it only checks `Closes #N`), so non-UI PRs
  can leave the section out.

## Planned gates (when `apps/mobile` exists)

Only fast checks that run on `ubuntu-latest` without a native build, for example `expo-doctor`, `migrations`
(`drizzle-kit check`) and `bundle-size` (JS bundle size against a committed budget). Tracked in
[#109](https://github.com/alimek/budget-lens-offline/issues/109).

Current audit exceptions: `node-forge` (GHSA-86w9-cpqp-85rv) in Expo CLI code signing and `braces`
(GHSA-vfj7-8cjw-p6xm) in Metro's Node.js file watcher. Both expire 2026-11-19 and are tracked in
[#162](https://github.com/alimek/budget-lens-offline/issues/162). Dependency-path and production
source-map evidence is recorded in [mobile development](mobile-development.md#dependency-compatibility-and-temporary-audit-exceptions).
Neither package is part of the mobile runtime; no runtime dependency is exempted.

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
- Shared setup: `.github/actions/setup` (pnpm from `packageManager` with the pnpm store cache, Node.js from `.nvmrc`,
  `pnpm install --frozen-lockfile`). `typecheck` and `test` also restore the local Turborepo cache
  (`.turbo/cache`, via `actions/cache`). Third-party actions are pinned to commit SHAs.

## Gates

| Job | Fails when |
| --- | --- |
| `lint` | Any Biome diagnostic, including warnings (`biome check --error-on-warnings`) |
| `typecheck` | Any TypeScript 7 error with the strict options in `tsconfig.base.json` |
| `test` | Any failing Vitest test (coverage is reported, no thresholds) |
| `fallow` | Any unused file, export, type or dependency (dev dependencies too), unlisted dependency, cycle or stale suppression |
| `audit` | `pnpm audit` finds a high or critical advisory |
| `licenses` | A dependency has a license outside the allowlist, or an unknown or missing license |
| `pr-title` | The PR title is not in Conventional Commits format (`feat(core): …`, `fix: …`, `ci: …`) |
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
reason. Current exception: `lightningcss` (and its platform binaries), MPL-2.0, a dev-only transitive dependency of
Vite (Vitest), never modified or shipped in the app.

## Planned gates (when `apps/mobile` exists)

`expo-doctor`, `expo-export` (matrix `ios` / `android`), `migrations` (`drizzle-kit check`), `e2e-android`
(TesterArmy smoke tests, #15) and `bundle-size` (JS bundle size against a committed budget). They are added
together with the app scaffold.

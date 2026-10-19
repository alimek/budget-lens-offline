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
- `.github/workflows/macos.yml` runs on every same-repo pull request and on every push to `main` on the
  self-hosted Mac Studio runner: `macos-typecheck`, `macos-vitest`, `ios-build`. See
  [Self-hosted macOS runner](#self-hosted-macos-runner).
- Shared setup: `.github/actions/setup` (pnpm from `packageManager` with the pnpm store cache, Node.js from `.nvmrc`,
  `pnpm install --frozen-lockfile`). `typecheck` and `test` also restore the local Turborepo cache
  (`.turbo/cache`, via `actions/cache`). `.nvmrc` is a Turborepo `globalDependencies` entry, so a Node.js bump
  (which can also change `Intl`/ICU output) invalidates every cached task. Third-party actions are pinned to commit
  SHAs.

## Gates

| Job | Fails when |
| --- | --- |
| `lint` | Any Biome diagnostic, including warnings (`biome check --error-on-warnings`) |
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
reason. Current exception: `lightningcss` (and its platform binaries), MPL-2.0, a dev-only transitive dependency of
Vite (Vitest), never modified or shipped in the app.

## Self-hosted macOS runner

Typecheck, unit tests and the iOS simulator build also run on Grzegorz's Mac Studio, so PRs get an iOS build without
hosted macOS minutes (#148). These jobs are **not required status checks** yet; making them required is part of #149
and needs the repository owner's confirmation.

| | |
| --- | --- |
| Runner name | `mac-studio-bl-runner` (repository runner of `alimek/budget-lens-offline`; replaces `mac-studio-aliclaw`) |
| Labels | `self-hosted`, `macOS`, `aliclaw` (GitHub adds `ARM64` automatically); jobs use `runs-on: [self-hosted, macOS, aliclaw]`. The `aliclaw` label is kept so the workflow did not have to change; it names the machine pool, not the user the jobs run as |
| Machine / user | Mac Studio (Apple silicon), dedicated macOS user `bl-runner` ("BL CI Runner"): **not an admin**, hidden from the login window (`IsHidden 1`), random password that nobody knows |
| Directory | `/Users/bl-runner/actions-runner` (owned by `bl-runner`; job workspaces in `_work`, Node.js tool cache in `_work/_tool`); home `/Users/bl-runner` is mode 700 |
| Service | LaunchDaemon `com.budgetlens.actions-runner` (`/Library/LaunchDaemons/com.budgetlens.actions-runner.plist`, root:wheel 644) with `UserName=bl-runner`, `RunAtLoad`, `KeepAlive`; it runs `runsvc.sh` and starts at boot without anyone logged in. Logs in `/Users/bl-runner/Library/Logs/com.budgetlens.actions-runner/` |
| Simulator | `BudgetLens-CI` (iPhone 16, iOS 27.0) of the `bl-runner` user (simulators are per user); the `ios-build` job uses only `BudgetLens-*` simulators, preferring `BudgetLens-CI` |

Jobs (`.github/workflows/macos.yml`):

| Job | What it does |
| --- | --- |
| `macos-typecheck` | `pnpm turbo run typecheck` |
| `macos-vitest` | `pnpm turbo run test` |
| `ios-build` | Picks a `BudgetLens-*` simulator (fails if there is none). When `apps/mobile` exists: `expo prebuild --platform ios --clean` (incl. `pod install`) and `xcodebuild … -sdk iphonesimulator -destination "platform=iOS Simulator,id=<BudgetLens UDID>" CODE_SIGNING_ALLOWED=NO build`. Until the app scaffold lands (#109) it only selects the simulator and reports a notice. |

The jobs use the same `.github/actions/setup` as the hosted jobs (pnpm from `packageManager`, installed per job in
`$RUNNER_TEMP`; Node.js from `.nvmrc` via `actions/setup-node` into the runner's tool cache). They pass
`isolated-store: "true"`, so each job uses its own pnpm store in `$RUNNER_TEMP/pnpm-store` and its own pnpm metadata
cache in `$RUNNER_TEMP/pnpm-cache`, and skips the pnpm store cache. System tools (Xcode, Homebrew in `/opt/homebrew`,
CocoaPods) are shared read-only; the daemon's `PATH` is `/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin`.

### Isolation

Jobs run as `bl-runner`, never as the owner's account `aliclaw`:

- `/Users/aliclaw` is mode 700, so `bl-runner` cannot list or read anything in it: not `~/agents`, not
  `~/agent-development`, not `~/.ssh`, not the `gh` login in `~/.config/gh/hosts.yml`. The migration script checks
  this (`ls`/`cat` as `bl-runner` must fail with "Permission denied").
- `bl-runner` is not in the `admin` group, so jobs cannot use `sudo`.
- The runner holds only its own runner credentials (`.credentials` in its directory); no GitHub user token, SSH key
  or other secret is available to jobs.

### Security rules (mandatory)

The repository is public, so a self-hosted runner must never execute untrusted code.

- **Fork guard on every self-hosted job:**
  `if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository`.
  A fork PR does not schedule these jobs at all. Any new job with `runs-on: [self-hosted, …]` must carry it.
- **Fork workflow approval:** the repository setting requires approval for workflow runs from fork PRs of **all
  outside contributors** (`approval_policy: all_external_contributors`, Settings → Actions → General).
- **No `pull_request_target`** in workflows that check out PR code, and none on the self-hosted runner.
- **No secrets** in self-hosted jobs; `permissions: contents: read`; `actions/checkout` with
  `persist-credentials: false`.
- The runner and its jobs stay inside `/Users/bl-runner` (runner directory plus the Xcode and CocoaPods caches of
  `bl-runner`) and use only `BudgetLens-*` simulators. `bl-runner` must never be made an admin or given access to
  `/Users/aliclaw`.

### Setup / migration

The runner was moved from the `aliclaw` user agent to `bl-runner` with a one-off script kept outside the repository,
`~/.bl-t3-client/runner/migrate-runner-to-bl-runner.sh`, run once by the owner with `sudo` (`--dry-run` previews it
without changes). It removes `mac-studio-aliclaw` (the old directory is kept as `~/actions-runner.retired-<date>`),
creates `bl-runner`, installs and registers the latest runner (sha256-verified) as `mac-studio-bl-runner`, installs
the LaunchDaemon, sets `/Users/aliclaw` to 700, creates the `BudgetLens-CI` simulator for `bl-runner` and verifies
the isolation. It also prints the rollback steps.

### Operating the runner

```sh
sudo launchctl print system/com.budgetlens.actions-runner | head      # daemon state
sudo launchctl kickstart -k system/com.budgetlens.actions-runner      # restart
gh api repos/alimek/budget-lens-offline/actions/runners --jq '.runners[] | {name, status, labels: [.labels[].name]}'
sudo tail -f /Users/bl-runner/Library/Logs/com.budgetlens.actions-runner/stdout.log
```

Upgrade: the runner updates itself. Re-register (for example on a new machine), with the daemon stopped:
`sudo -u bl-runner -H bash -c 'cd /Users/bl-runner/actions-runner && ./config.sh remove --token "$0"' "$T"`, then
the same with `./config.sh --unattended --url https://github.com/alimek/budget-lens-offline --token "$0" --name
mac-studio-bl-runner --labels self-hosted,macOS,aliclaw --work _work --replace`, then start the daemon again. Get
tokens as `aliclaw` with `T=$(gh api -X POST repos/alimek/budget-lens-offline/actions/runners/registration-token
--jq .token)` (or `remove-token`) straight into a shell variable; never print, log or commit them, and `unset T`
afterwards.

Simulator for `bl-runner` (if it is missing):
`sudo launchctl asuser $(id -u bl-runner) sudo -u bl-runner -H xcrun simctl create BudgetLens-CI "iPhone 16" com.apple.CoreSimulator.SimRuntime.iOS-27-0`.

If the runner is offline, the self-hosted jobs stay queued (they are not required, so merges are not blocked).

### Disabling the runner

Use this when the runner misbehaves, a job looks suspicious, or the Mac Studio is needed for something else:

```sh
sudo launchctl bootout system/com.budgetlens.actions-runner          # stop now; jobs stay queued on GitHub
sudo launchctl disable system/com.budgetlens.actions-runner          # optional: keep it off after a reboot
# later: sudo launchctl enable system/com.budgetlens.actions-runner
#        sudo launchctl bootstrap system /Library/LaunchDaemons/com.budgetlens.actions-runner.plist
```

To take it off the repository entirely, also run `config.sh remove` as `bl-runner` (token handling as above) and
delete the plist (`sudo rm /Library/LaunchDaemons/com.budgetlens.actions-runner.plist`). Self-hosted jobs then stay
queued until the runner is back; they are not required checks, so PRs can still merge. To pause only the
self-hosted jobs without touching the runner, disable the `macOS (self-hosted)` workflow in the Actions tab
(`gh workflow disable macos.yml`).

## Planned gates (when `apps/mobile` exists)

`expo-doctor`, `expo-export` (matrix `ios` / `android`), `migrations` (`drizzle-kit check`), `e2e-android`
(TesterArmy smoke tests, #15) and `bundle-size` (JS bundle size against a committed budget). They are added
together with the app scaffold and tracked in [#109](https://github.com/alimek/budget-lens-offline/issues/109).

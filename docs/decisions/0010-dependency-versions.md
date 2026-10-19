# 0010 – Latest stable dependencies, pinned exactly

Status: Accepted (#10 correction comment: "always the latest stable … no RC/beta"; #20; [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427))

**Decision.** Every dependency uses its latest stable release (the `latest` dist-tag), pinned to an exact version
(no `^` / `~`). No RC/beta releases; a pre-release is used only when a package has no stable release at all. The same
applies to the pnpm version (`packageManager`), Node.js (`.nvmrc`, latest LTS) and GitHub Actions (pinned to commit
SHAs).

**Consequences.** Upgrades are explicit PRs.

**Release-age behaviour of pnpm (as of pnpm 12.14.0).** The repo configures no release-age policy:
`pnpm-workspace.yaml` has no `minimumReleaseAge`, there is no `.npmrc`, and `pnpm config get minimumReleaseAge`
prints `undefined`. pnpm 12 still applies a default check against very recent releases:
- a version range resolves to the newest version older than about one day (for example `^3.34.0` resolved to
  `fallow` 3.34.0 while 3.34.1 was less than a day old);
- an explicitly requested exact version (`pnpm add -E fallow@3.34.1`) installs, and pnpm records
  `minimumReleaseAgeExclude` entries for it in `pnpm-workspace.yaml`.

The repo pins `fallow` 3.34.1 (installed once it was older than a day) and has no exclude entries. Whether to
adopt an explicit `minimumReleaseAge` or allow exclude entries is not decided.

**Expo React compatibility exception (#73, 2026-10-19).** React and React DOM follow the exact
versions in the installed SDK's `expo/bundledNativeModules.json`, rather than an independent latest
release. This keeps them aligned with React Native's renderer. Verify from `apps/mobile` with
`npx expo install --check`. Source: [#73 decision](https://github.com/alimek/budget-lens-offline/issues/73#issuecomment-6276834077).
TypeScript remains on the repository's TypeScript 7 decision (ADR 0002); only its SDK compiler
recommendation is excluded from Expo's install check.

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

The repo currently pins `fallow` 3.34.0 and has no exclude entries. Whether to adopt an explicit
`minimumReleaseAge` or allow exclude entries is not decided.

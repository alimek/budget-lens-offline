# 0010 – Latest stable dependencies, pinned exactly

Status: Accepted

**Decision.** Every dependency uses its latest stable release (no pre-releases unless no stable release exists),
pinned to an exact version (no `^` / `~`). The same applies to the pnpm version (`packageManager`), Node.js
(`.nvmrc`, latest LTS) and GitHub Actions (pinned to commit SHAs).

**Consequences.** Upgrades are explicit PRs. pnpm's default `minimumReleaseAge` policy can delay a release that is
less than a day old.

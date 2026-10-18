# 0005 – Fallow, Lefthook and CI

Status: Accepted (#1, #9; merge rule: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427))

**Decision.**
- **Fallow** checks dead code, unused exports and unused dependencies from the first commit (`.fallowrc.json`,
  `unused-dependencies` is an error).
- **Lefthook** pre-commit runs Biome on staged files and typecheck for changed packages (`lefthook.yml`).
- **GitHub Actions** (`.github/workflows/ci.yml`) runs `lint`, `typecheck`, `test` and `fallow` as separate jobs
  through Turborepo; every job is a required merge condition. Coverage is reported without thresholds.

**Consequences.** Changes reach `main` only through PRs. The Reviewer squash-merges after approval and fully
green CI.

# 0001 – Monorepo: pnpm workspaces + Turborepo

Status: Accepted (#1). Decision summary of 2026-10-18: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Context.** Domain logic must live in a package testable without the app; the legacy repo used Yarn 4 + Turborepo.

**Decision.** pnpm workspaces (`pnpm-workspace.yaml`: `apps/*`, `packages/*`) with Turborepo tasks (`turbo.json`).
No Yarn. pnpm version pinned in `packageManager`.

**Consequences.** The `lint`, `typecheck`, `test` and `fallow` checks run through Turborepo, locally and in CI.

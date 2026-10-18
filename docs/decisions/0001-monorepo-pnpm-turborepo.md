# 0001 – Monorepo: pnpm workspaces + Turborepo

Status: Accepted (#1)

**Context.** Domain logic must live in a package testable without the app; the legacy repo used Yarn 4 + Turborepo.

**Decision.** pnpm workspaces (`pnpm-workspace.yaml`: `apps/*`, `packages/*`) with Turborepo tasks (`turbo.json`).
No Yarn. pnpm version pinned in `packageManager`.

**Consequences.** Every check (`lint`, `typecheck`, `test`, `fallow`) runs through Turborepo, locally and in CI.

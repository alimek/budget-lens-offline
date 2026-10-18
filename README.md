# Budget Lens (offline)

Monorepo for the offline version of the Budget Lens app.

## Structure

```
apps/            # applications (the Expo app will be added in a separate step)
packages/core/   # pure TypeScript domain logic (no RN/Expo/Next/Supabase)
```

Monetary amounts in `packages/core` are stored as integers in minor currency units (`MinorUnits`).

## Requirements

- Node.js ≥ 22 (recommended version in `.nvmrc`)
- pnpm (version pinned in the `packageManager` field – the easiest way is `corepack enable`)

## Usage

```sh
pnpm install      # installs dependencies and Git hooks (Lefthook, `prepare` script)
pnpm test         # tests (Vitest) for all packages via Turborepo
pnpm typecheck    # typecheck (tsgo, strict mode) for all packages via Turborepo
pnpm lint         # Biome: lint + format (check only)
pnpm format       # Biome: apply automatic fixes
pnpm fallow       # Fallow: dead code, unused exports and dependencies, duplication
pnpm check        # all of the above in sequence
```

Tests for a single package:

```sh
pnpm --filter @budget-lens/core test
pnpm --filter @budget-lens/core exec vitest   # watch mode
```

## Tooling

| Area | Tool | Configuration |
| --- | --- | --- |
| Workspace | pnpm workspaces + Turborepo | `pnpm-workspace.yaml`, `turbo.json` |
| TypeScript | tsgo (`@typescript/native-preview`), `strict` | `tsconfig.base.json`, `packages/*/tsconfig.json` |
| Unit tests | Vitest | `packages/core/vitest.config.ts` |
| Lint + format | Biome | `biome.json` |
| Dead code | Fallow | `.fallowrc.json` |
| Pre-commit | Lefthook (Biome + typecheck of changed packages) | `lefthook.yml` |

`biome.json` forbids imports from `react-native`, `expo*`, `next` and `@supabase/*` in `packages/core`
(`noRestrictedImports` rule).

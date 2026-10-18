# Budget Lens (offline)

Monorepo for the offline version of the Budget Lens app.

## Structure

```
apps/            # applications (the Expo app will be added in a separate step)
packages/core/   # pure TypeScript domain logic (no RN/Expo/Next/Supabase)
```

Monetary amounts in `packages/core` are stored as integers in minor currency units (branded `MinorUnits` type; create values with `toMinorUnits`).

## Requirements

- Node.js ≥ 22 (CI and recommended version pinned in `.nvmrc`, currently 24 LTS)
- pnpm (version pinned in the `packageManager` field – the easiest way is `corepack enable`)

## Usage

```sh
pnpm install      # installs dependencies and Git hooks (Lefthook, `prepare` script)
pnpm test         # tests (Vitest) for all packages via Turborepo
pnpm typecheck    # typecheck (TypeScript 7 `tsc`, strict mode) for all packages via Turborepo
pnpm lint         # Biome: lint + format (check only)
pnpm format       # Biome: apply automatic fixes
pnpm fallow       # Fallow: dead code, unused exports and dependencies, duplication
pnpm check        # all of the above in sequence
```

Tests for a single package:

```sh
pnpm --filter @budget-lens/core test
pnpm --filter @budget-lens/core exec vitest   # watch mode
pnpm --filter @budget-lens/core test:coverage # with coverage report (packages/core/coverage)
```

### Turborepo telemetry

Turborepo collects anonymous usage telemetry by default (CI disables it). To opt out locally:

```sh
pnpm exec turbo telemetry disable   # or set TURBO_TELEMETRY_DISABLED=1
```

## Tooling

| Area | Tool | Configuration |
| --- | --- | --- |
| Workspace | pnpm workspaces + Turborepo | `pnpm-workspace.yaml`, `turbo.json` |
| TypeScript | TypeScript 7 (native Go compiler, `tsc --noEmit`), `strict` | `tsconfig.base.json`, `packages/*/tsconfig.json` |
| Unit tests | Vitest | `packages/core/vitest.config.ts` |
| Lint + format | Biome | `biome.json` |
| Dead code | Fallow | `.fallowrc.json` |
| Pre-commit | Lefthook (Biome + typecheck of changed packages) | `lefthook.yml` |

`packages/core/tsconfig.json` covers only `src` with `"types": []`, so Node.js APIs (`node:*`, `process`, `Buffer`)
do not typecheck there; tooling files such as `vitest.config.ts` are checked by `tsconfig.node.json` (both run in
`pnpm typecheck`). `src/__typetests__/no-node-types.ts` fails the typecheck if Node.js types ever leak into `src`.

`biome.json` forbids imports from `react-native`, `expo*`, `next` and `@supabase/*` in `packages/core`
(`noRestrictedImports` rule).

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs on every pull request and on every push to `main`.
Each check is a separate job, and every task runs through Turborepo:

| Job (status check) | Command |
| --- | --- |
| `lint` | `pnpm turbo run lint` (Biome check) |
| `typecheck` | `pnpm turbo run typecheck` (tsgo) |
| `test` | `pnpm turbo run test:coverage` (Vitest + coverage summary in the job summary and a `coverage` artifact) |
| `fallow` | `pnpm turbo run fallow` |

Shared setup (pnpm from `packageManager` with store caching, Node.js from `.nvmrc`,
`pnpm install --frozen-lockfile`) lives in `.github/actions/setup/action.yml`.

### Making the checks required (repository owner)

1. Open **Settings → Rules → Rulesets** (or **Settings → Branches → Branch protection rules**) for `main`.
2. Enable **Require status checks to pass** (and optionally **Require branches to be up to date before merging**).
3. Add the status checks `lint`, `typecheck`, `test` and `fallow` (they appear in the search after the workflow has run at least once).
4. Save the rule.

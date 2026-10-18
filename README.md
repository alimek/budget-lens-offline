# Budget Lens (offline)

Monorepo aplikacji Budget Lens w wersji offline.

## Struktura

```
apps/            # aplikacje (przyszła aplikacja Expo – osobny krok)
packages/core/   # czysta logika domenowa w TypeScript (bez RN/Expo/Next/Supabase)
```

Kwoty pieniężne w `packages/core` przechowujemy jako liczby całkowite w groszach (`Grosze`).

## Wymagania

- Node.js ≥ 22 (zalecana wersja w `.nvmrc`)
- pnpm (wersja przypięta w polu `packageManager` – najprościej przez `corepack enable`)

## Uruchomienie

```sh
pnpm install      # instaluje zależności i hooki Git (Lefthook, skrypt `prepare`)
pnpm test         # testy (Vitest) wszystkich pakietów przez Turborepo
pnpm typecheck    # typecheck (tsgo, tryb strict) wszystkich pakietów przez Turborepo
pnpm lint         # Biome: lint + format (sprawdzenie)
pnpm format       # Biome: automatyczne poprawki
pnpm fallow       # Fallow: martwy kod, nieużywane eksporty i zależności, duplikacja
pnpm check        # wszystko powyższe po kolei
```

Testy pojedynczego pakietu:

```sh
pnpm --filter @budget-lens/core test
pnpm --filter @budget-lens/core exec vitest   # tryb watch
```

## Narzędzia

| Obszar | Narzędzie | Konfiguracja |
| --- | --- | --- |
| Workspace | pnpm workspaces + Turborepo | `pnpm-workspace.yaml`, `turbo.json` |
| TypeScript | tsgo (`@typescript/native-preview`), `strict` | `tsconfig.base.json`, `packages/*/tsconfig.json` |
| Testy jednostkowe | Vitest | `packages/core/vitest.config.ts` |
| Lint + format | Biome | `biome.json` |
| Martwy kod | Fallow | `.fallowrc.json` |
| Pre-commit | Lefthook (Biome + typecheck zmienionych pakietów) | `lefthook.yml` |

`biome.json` blokuje w `packages/core` importy z `react-native`, `expo*`, `next` i `@supabase/*`
(reguła `noRestrictedImports`).

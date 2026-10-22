# Architecture decision records

Short records of stack decisions. Each has a status (`Proposed`, `Accepted`, `Superseded by …`). Add a
new ADR instead of rewriting an accepted one when a decision changes. Unless noted, decisions were made
by Grzegorz on 2026-10-18
(see the [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427), the
"Decyzje" section of #1 and the research in #10).

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-monorepo-pnpm-turborepo.md) | pnpm workspaces + Turborepo | Accepted |
| [0002](0002-typescript-7.md) | TypeScript 7 `tsc` for typechecking | Accepted |
| [0003](0003-biome.md) | Biome for lint and format | Accepted |
| [0004](0004-testing-tools.md) | Open-source e2e framework as main testing, minimal Vitest unit tests, no coverage thresholds | Accepted |
| [0005](0005-fallow-lefthook-ci.md) | Fallow, Lefthook and required CI checks | Accepted |
| [0006](0006-app-stack.md) | Expo SDK 58 app stack (incl. Expo Router) | Accepted |
| [0007](0007-local-database.md) | expo-sqlite + Drizzle; SQLCipher superseded by [#242](https://github.com/alimek/budget-lens-offline/issues/242) | Superseded by [#242](https://github.com/alimek/budget-lens-offline/issues/242) (encryption); expo-sqlite + Drizzle accepted |
| [0008](0008-money-minor-units.md) | Money as integer minor units | Accepted |
| [0009](0009-english-and-i18n.md) | English codebase, i18n for UI | Accepted |
| [0010](0010-dependency-versions.md) | Latest stable dependencies, pinned exactly | Accepted |
| [0011](0011-money-formatting-without-intl.md) | Money formatting without native Intl, CLDR data in core | Superseded by [0012](0012-native-intl-money-formatting.md) |
| [0012](0012-native-intl-money-formatting.md) | Native Intl money formatting, always full amounts | Accepted |
| [0013](0013-eas-update-network-exception.md) | EAS Update check as the only outbound request (offline exception) | Accepted |
| [0014](0014-chart-library-and-minimum-os.md) | Chart library (chart-kit v2 on react-native-svg) and minimum OS versions | Accepted |

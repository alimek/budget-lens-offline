# Mobile development

The #73 scaffold lives in `apps/mobile`. Use Node from `.nvmrc`, pnpm 12.14.0, Xcode with an iOS
simulator runtime, CocoaPods, and the Android SDK/JDK required by Expo SDK 58. Install dependencies
from the repository root with `pnpm install`. Native projects are generated locally and ignored by Git.

## Development builds

Use development builds, not Expo Go. Select only a dedicated `BudgetLens-*` simulator/emulator;
never let Expo auto-select a personal/shared device. The smoke config names `BudgetLens-CI` (iOS)
and `BudgetLens-Android` (Android). Those devices must exist before running tests.

```sh
pnpm --filter @budget-lens/mobile exec expo run:ios --device <BudgetLens-simulator-UDID> --no-bundler
pnpm --filter @budget-lens/mobile exec expo run:android --device <BudgetLens-emulator-serial> --no-bundler
pnpm --filter @budget-lens/mobile start
```

Metro currently uses Expo's default port 8081. The repository-wide fixed-port decision remains in #15;
do not attach to another project's server if that port is occupied. Open the development client against
that Metro server before Android smoke tests. The iOS smoke target passes the server URL as a launch
argument. All application data stays local; this scaffold opens no database or Budget Lens service.

## Checks and smoke evidence

```sh
pnpm check
pnpm --filter @budget-lens/mobile exec expo export --platform ios --platform android
pnpm --filter @budget-lens/mobile e2e:ios
pnpm --filter @budget-lens/mobile e2e:android
```

The e2e scripts disable telemetry. Tests use no agent steps, model provider or secrets.
Results, screenshots, traces and video are written under `apps/mobile/.e2e/` (ignored); review the
report before attaching evidence to a PR. A passing bundle export does not prove that a native
build starts. The broader e2e setup/CI plan remains in #15; mobile CI gates remain in #109.

## Test IDs

Use stable `kebab-case` IDs: `<area>-<element>[-<variant>]`. Never put translated labels or personal
data in an ID. Screen roots use `screen-<name>` with `collapsable={false}`. Overview uses `screen-home`
for the #15 smoke contract; other roots are `screen-month`, `screen-forecast`, `screen-items`,
`screen-settings`, and `screen-savings`. Native triggers use `tab-overview`, `tab-month`,
`tab-forecast`, `tab-items`, `tab-settings`. The Overview action uses `overview-open-savings`.

## Scope

The scaffold has bundled English/Polish strings, device-language initialization, light/dark system
navigation, Uniwind layout, and a provider-scoped Zustand selected month. All visible app copy comes
from locale resources. Native controls live in `src/ui/native`; #119 owns shared design tokens and
components. DB boot, recovery, persistence, language preferences and onboarding are separate work.

## Current verification blockers

`pnpm audit --audit-level high` reports unpatched advisories in Expo's toolchain:
`node-forge@1.4.0` (GHSA-86w9-cpqp-85rv) and `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm).
No audit exceptions were added. Resolving or accepting these advisories is required before CI is green.

`expo install --check` recommends React 19.3.0 and TypeScript ~6.0.3, while the repository's
latest-stable rule selects React 19.3.1 and its established TypeScript version is 7.0.2. The scaffold
keeps those exact latest/repository versions pending a compatibility decision; native smoke verification
is not complete. pnpm added exact `minimumReleaseAgeExclude` entries for newly published stable
Expo/Uniwind/i18n packages during installation; no global release-age policy was changed.

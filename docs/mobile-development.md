# Mobile development

The #73 scaffold lives in `apps/mobile`. Use Node from `.nvmrc`, pnpm 12.14.0, Xcode with an iOS
simulator runtime, CocoaPods, and the Android SDK/JDK required by Expo SDK 58. Install dependencies
from the repository root with `pnpm install`. Native projects are generated locally and ignored by Git.

## Development builds

Use development builds, not Expo Go. Select only a dedicated simulator/emulator that you create for
this project; never let Expo auto-select a personal/shared device. The e2e config reads the device
names from env vars; the defaults follow the recommended `BudgetLens-*` naming convention:

| Env var | Platform | Default |
| --- | --- | --- |
| `E2E_IOS_SIMULATOR` | iOS simulator name | `BudgetLens-iOS` |
| `E2E_ANDROID_AVD` | Android emulator (AVD) name | `BudgetLens-Android` |

Create the devices (or point the env vars at your own dedicated ones) before running tests, for
example `E2E_IOS_SIMULATOR=My-iPhone pnpm --filter @budget-lens/mobile e2e:ios`. The iOS default was
`BudgetLens-CI` before #171; an existing simulator with that name keeps working with
`E2E_IOS_SIMULATOR=BudgetLens-CI`.

```sh
EXPO_NO_TELEMETRY=1 pnpm --filter @budget-lens/mobile exec expo run:ios --device <BudgetLens-simulator-UDID> --port 8073
EXPO_NO_TELEMETRY=1 pnpm --filter @budget-lens/mobile exec expo run:android --device <BudgetLens-emulator-serial> --port 8073
pnpm --filter @budget-lens/mobile start
```

Metro uses the repository's fixed port **8073**, checked free with `lsof -nP -iTCP -sTCP:LISTEN`
and [recorded in #15](https://github.com/alimek/budget-lens-offline/issues/15#issuecomment-6276858226).
The `start`, `ios`, and `android` scripts pass it explicitly and, like `export`, set `EXPO_NO_TELEMETRY=1`. Do not accept an automatic port change
or attach to another project's server if 8073 is occupied. The iOS smoke target passes the server URL
as a launch argument; Android uses an explicit development-client VIEW intent to the same port after `adb -s <BudgetLens-emulator-serial> reverse
tcp:8073 tcp:8073`. On first Android development launch, allow the local/nearby-device permission
prompt required to connect the development client to Metro. All application data stays local; the app opens
and migrates its local SQLite database, encrypted with SQLCipher, before rendering data screens (#74, #75). A
development build can also show the boot screens and check that this build really encrypts, on deep links:
`budget-lens:///dev/boot-screen?screen=recovery` (also `migration-failed`,
`restore-failed`, `state-unrecognized`, `encryption-unavailable`, `storage-unreachable`) and
`budget-lens:///dev/storage-check`, which reports the cipher pragmas, the encryption state of the database file and
of the copy, and the files a "start over" kept. `budget-lens:///dev/forget-key` (#75 R6) forgets the stored key, so
a cold start afterwards reaches the recovery screen through a real unreadable database instead of a preview.

**The screens under `src/app/dev` never run in a release build (#75 R7).** Forgetting the key of a database that is
still on the device makes that budget unreadable for good, so this is guarded in three places: those routes are
registered inside `<Stack.Protected guard={__DEV__}>`, so a release build does not mount them and a deep link to one
redirects to Overview; their effects go through `useDevEffect` (`src/dev/use-dev-effect.ts`), which checks `__DEV__`
inside the effect, where a `return` placed before a hook cannot be forgotten; and `forgetDatabaseKey` refuses
outside `__DEV__` itself. `pnpm lint` runs `scripts/check-dev-routes.mjs`, which fails if a development screen is
registered outside the guard, reaches for `useEffect` instead of `useDevEffect`, renders without an `__DEV__`
check, or deletes the key before one.

## Checks and smoke evidence

CI on GitHub runs only the fast checks; native builds, `expo prebuild` and e2e run **locally on a dev machine**
on the dedicated devices ([ci.md](ci.md#native-builds-and-e2e-local)). With Metro running on 8073 and the
development build installed on those simulators/emulators:

```sh
pnpm check
EXPO_NO_TELEMETRY=1 pnpm --filter @budget-lens/mobile exec expo export --platform ios --platform android
pnpm --filter @budget-lens/mobile e2e:ios
pnpm --filter @budget-lens/mobile e2e:android
```

The root `pnpm e2e:ios` / `pnpm e2e:android` scripts run the same targets. The e2e scripts disable
telemetry. Tests use no agent steps, model provider or secrets. The Savings action targets
`overview-open-savings`; on Android, where Expo UI puts that ID on a wrapper, it taps the native button
inside it ([testing](testing.md#e2e-smoke-tests-15)).
Results, screenshots, traces and video are written under `apps/mobile/.e2e/<platform>/` (ignored); review the
report before attaching evidence to a PR. UI PRs attach the iOS and Android screenshots (device named) and the
e2e command in the Screenshots section of the [PR template](../.github/pull_request_template.md). A passing
bundle export does not prove that a native build starts. The e2e setup is described in
[testing](testing.md#e2e-smoke-tests-15); the fast mobile CI gates (no native build) remain in #109.

## Test IDs

Use stable `kebab-case` IDs: `<area>-<element>[-<variant>]`. Never put translated labels or personal
data in an ID. Screen roots use `screen-<name>` with `collapsable={false}`. Overview uses `screen-home`
for the #15 smoke contract; other roots are `screen-month`, `screen-forecast`, `screen-items`,
`screen-settings`, and `screen-savings`. Native triggers use `tab-overview`, `tab-month`,
`tab-forecast`, `tab-items`, `tab-settings`. The Overview action uses `overview-open-savings`. The Settings privacy card uses `settings-privacy` and its EAS Update disclosure text `settings-privacy-updates`. The dev-only
design system showcase uses `screen-design-system`, opened by `settings-open-design-system`; its elements use the
`ds-` prefix ([design system](design-system.md#showcase)). The boot screens (#75) use
`screen-encryption-unavailable`, `screen-recovery` (with `recovery-start-over` and its
`recovery-start-over-alert`) and `screen-storage-unreachable` (with `storage-unreachable-retry`). The dev-only
storage check uses `screen-storage-check` and its `storage-check-*` rows.

## Scope

The scaffold has bundled English/Polish strings, device-language initialization, light/dark system
navigation, Uniwind layout, and a provider-scoped Zustand selected month. All visible app copy comes
from locale resources. Screens are built from the [design system](design-system.md) (#119): Expo UI
wrappers in `src/ui/native`, tokens and React Native Reusables components in `src/ui`. Database boot and
migrations are implemented in #74, and the SQLCipher key, cipher guard, encrypted pre-migration copies and boot
screens in #75; the recovery screen is an interim UI until the #60 mockups land. Repositories, language preference
persistence ([i18n](i18n.md)) and onboarding are separate work.

## Release builds (TestFlight)

Release builds for internal TestFlight testing are built and submitted with EAS (`apps/mobile/eas.json`):
`pnpm eas:build:ios` and `pnpm eas:submit:ios`. Signing credentials and the App Store Connect API key stay in EAS.
Profiles, the linked project, the release flow, versioning, free-plan limits and the export compliance setting:
[release/testflight.md](release/testflight.md).

## Native permissions and network

The app is offline-first, so `app.json` keeps the native defaults minimal. Verify changes with
`EXPO_NO_TELEMETRY=1 pnpm --filter @budget-lens/mobile exec expo prebuild --clean --no-install` and check the
generated (ignored) `android/` and `ios/` projects; for Android also check the Gradle merged manifest
(`./gradlew :app:processReleaseMainManifest`).

- **Android:** `android.blockedPermissions` removes `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and
  `WRITE_EXTERNAL_STORAGE` (Expo adds them by default). The release manifest keeps only:
  - `INTERNET`: needed for NBP rates (#8) and for the development client to reach Metro;
  - `VIBRATE`: an Expo default, a normal (no-prompt) permission for haptics;
  - `<package>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`: an app-private signature permission that AndroidX adds.

  Debug builds only also get `SYSTEM_ALERT_WINDOW` (from the generated `src/debug` manifest, for the React
  Native dev overlay), `ACCESS_LOCAL_NETWORK`, `ACCESS_NETWORK_STATE` and `CHANGE_WIFI_MULTICAST_STATE` (React
  Native and the development launcher, to find and connect to Metro), and cleartext traffic to Metro. None of
  these are in release builds.
- **iOS:** App Transport Security sets `NSAllowsArbitraryLoads: false` and `NSAllowsLocalNetworking: true`.
  Local networking stays because the development client loads the bundle from Metro over plain HTTP on the
  local network; it only allows local addresses (for example `localhost`, `*.local`), not internet hosts,
  so every remote request must use HTTPS.
- **EAS Update:** `expo-updates` adds no permission on either platform (Android already has `INTERNET`). Release
  builds with an EAS channel make one background HTTPS request to Expo's update server after launch; it never blocks
  startup and fails silently offline ([release/updates.md](release/updates.md), what it sends:
  [ADR 0013](decisions/0013-eas-update-network-exception.md)).

## Dependency compatibility and temporary audit exceptions

React and React DOM use **19.3.0**, exactly as pinned by SDK 58's `expo/bundledNativeModules.json`,
per the [#73 decision](https://github.com/alimek/budget-lens-offline/issues/73#issuecomment-6276834077).
Verify from `apps/mobile` with `npx expo install --check`. TypeScript remains 7.0.2 per ADR 0002;
only TypeScript is excluded from Expo's older compiler recommendation via `expo.install.exclude`.
All runtime package compatibility checks, including React, remain enabled.

The two temporary `audit.ignore` entries expire **2026-11-19** and are tracked by
[#162](https://github.com/alimek/budget-lens-offline/issues/162). Evidence from
`pnpm --filter @budget-lens/mobile why node-forge braces --depth 3`:

- `node-forge@1.4.0` (GHSA-86w9-cpqp-85rv): direct consumers are `@expo/cli` and
  `@expo/code-signing-certificates` (itself used only by that CLI). The import is in Expo's
  Node.js iOS code-signing helper, `build/src/run/ios/codeSigning/Security.js`.
- `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm): `micromatch` → `metro-file-map` → `metro` / `@expo/metro`.
  Metro's `src/watchers/common.js` uses micromatch for Node.js file watching.

These toolchain packages are installed transitively under Expo/React Native, so manifest
`dependencies` vs `devDependencies` alone is not sufficient proof of runtime reachability.
`expo export --platform ios --platform android --source-maps` was checked on both platforms:
no `node-forge`, `braces`, `micromatch`, `metro-file-map`, code-signing certificates or Expo CLI
`build/src` modules occur in the production source maps. Expo's `build/metro-require/require.js`
bootstrap does occur; it does not import those vulnerable modules. No runtime dependency has
an exception. Recheck after upgrades and remove both ignores once upstream patches are available.

pnpm added exact `minimumReleaseAgeExclude` entries for newly published stable Expo/Uniwind/i18n
packages during installation; no global release-age policy was changed.

Uniwind regenerates `src/uniwind-types.d.ts`; Biome excludes that exact generated file so exporting
or starting Metro cannot make the format check fail.

Android 17 video retrieval currently fails in agent-device, so its target records screenshots and
traces instead; iOS retains video. The six assertions run on both platforms.

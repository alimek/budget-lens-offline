# iOS builds and TestFlight with EAS (internal testing)

Owner decisions: iOS builds go to **TestFlight, internal testing only** (#176; no external testers, no App Store
submission), and they are built and submitted with **Expo Application Services**: EAS Build and EAS Submit (#178).
The local build and upload script from #177 was removed; EAS is the only release path. Native builds stay out of
GitHub CI (#166): every EAS build is started manually with `eas build`. Only the **free EAS plan** is used; paid
features need the owner's consent.

## Configuration in the repository

- `apps/mobile/eas.json`. EAS expects it in the app directory of a monorepo, and every `eas` command runs from
  `apps/mobile` (the pnpm scripts below do that).
  - `cli.appVersionSource: "remote"`: EAS stores the iOS build number (see [Versions](#versions-and-build-numbers)).
  - `build.base`: shared settings. Node.js `24.22.0` (as in `.nvmrc`) and pnpm `12.14.0` (as in `packageManager`),
    because the default EAS images ship older versions. `EXPO_NO_TELEMETRY=1`.
  - `build.development`: development client (`expo-dev-client`), internal distribution (ad hoc, registered devices).
  - `build.preview`: Release build, internal distribution (ad hoc), for testing without TestFlight.
  - `build.production`: Release build for App Store Connect (`distribution: store`), `autoIncrement: true`.
  - `submit.production.ios`: intentionally empty. It has no `ascAppId`, `appleTeamId` or Apple ID; those come from
    EAS credentials and the interactive `eas submit` (see [Owner setup](#owner-setup-one-time)).
- `apps/mobile/app.json`: bundle identifier, version, icon, splash and export compliance (see
  [Release configuration](#release-configuration)). It is static. There is no `app.config.ts`, so `eas init` can write
  `extra.eas.projectId` into `app.json` itself. `app.json` never contains `owner` (an Expo account name, #171);
  `pnpm lint` rejects it (`scripts/check-machine-agnostic.mjs`).
- The root `prepare` script skips `lefthook install` when `EAS_BUILD=true` (set on EAS builders), so the install step
  does not depend on Git hooks. Locally, `pnpm install` still installs the hooks.
- EAS uploads the repository without the files ignored by `.gitignore`. It installs dependencies with pnpm from the
  workspace root and runs `expo prebuild` itself (CNG; `ios/` is never committed).

No credentials, team IDs, Apple IDs or Expo account names are in the repository. Signing credentials (distribution
certificate, provisioning profiles) and the App Store Connect API key live in **EAS credentials** on the owner's Expo
account.

## Owner setup (one time)

1. **Apple:** a paid Apple Developer Program membership (approved).
2. **Expo:** create an Expo account (free plan) and log in on the machine that starts builds:
   `pnpm --filter @budget-lens/mobile eas login`.
3. **Link the project:** `pnpm --filter @budget-lens/mobile eas init`. This creates the EAS project and writes
   `extra.eas.projectId` and `owner` into `apps/mobile/app.json`. **Commit only `extra.eas.projectId`**: delete the
   `owner` line before committing, because it is an Expo account name and the repository stays account-agnostic
   (#171; `pnpm lint` fails while it is there). EAS does not need it: since SDK 53, EAS CLI identifies the project by
   `extra.eas.projectId` alone, and `owner` is only required for SDK 52 and older (eas-cli changelog, "No longer
   require owner field for SDK >= 53", eas-cli #2835 and #3017). The project ID is not a secret; it stays out of the
   repository until the owner's project exists. Commit it in a small PR.
4. **Credentials and first build:** `pnpm eas:build:ios` (production profile). On the first run EAS CLI asks for the
   Apple Developer login and offers to create and store the distribution certificate and provisioning profile.
   Let EAS manage them. `pnpm --filter @budget-lens/mobile eas credentials --platform ios` shows or changes them later.
5. **App Store Connect API key for submissions:** in
   `pnpm --filter @budget-lens/mobile eas credentials --platform ios`, choose *production* → *App Store Connect: Manage
   your API Key* → *Set up your project to use an API Key for EAS Submit*. EAS can create the key (App Manager role)
   and keeps it on EAS servers, never in the repository or an env file.
6. **App Store Connect app record and internal testers:** the first `pnpm eas:submit:ios` can create the app record
   for `com.budgetlens.offline` (or create it in App Store Connect first). Then add an internal testing group in the
   app's TestFlight tab with the testers (team members).
7. **Optional values for `submit.production.ios`** (only for non-interactive submits, for example
   `--non-interactive` or `--auto-submit` on a later EAS Workflow): `ascAppId` (App Store Connect → App Information →
   Apple ID, a number) and, if wanted, `groups` (internal TestFlight group names). These are app identifiers, not
   secrets; the owner adds them once the app record exists. `appleTeamId` and the Apple ID are not needed when the
   API key is stored in EAS.

## Build and submit

Run from the repository root (the scripts call EAS CLI pinned to `eas-cli@25.2.0` via `pnpm dlx` in `apps/mobile`):

```sh
pnpm eas:build:ios        # eas build --platform ios --profile production (cloud build, remote build number)
pnpm eas:submit:ios       # eas submit --platform ios --profile production (pick the build, upload to TestFlight)
pnpm --filter @budget-lens/mobile eas build --platform ios --profile preview   # ad hoc internal build
pnpm --filter @budget-lens/mobile eas <command>                                  # any other EAS CLI command
```

After the upload, App Store Connect processes the build (usually 10–15 minutes). It then appears in TestFlight; add it
to the internal group (or enable automatic distribution for the group) and install it with the TestFlight app.

## Free plan limits

- Up to **15 iOS builds** (and 15 Android builds) per month, on the medium worker only (`resourceClass: large` is paid).
- **Low-priority queue:** at peak times the wait can be 90+ minutes before a build starts.
- **45-minute build timeout** and at most one macOS build at a time.
- EAS Submit is included.

**EAS Update (over-the-air updates) is not used.** `expo-updates` contacts Expo's update servers when the app starts,
which conflicts with the offline, no-server rule (AGENTS.md). Adding it needs an explicit owner decision first; until
then, every change reaches TestFlight through a new EAS build.

Check the current numbers on the Expo pricing page before relying on them.

## Versions and build numbers

- **Version** (`CFBundleShortVersionString`) is `expo.version` in `apps/mobile/app.json` (`0.1.0`, approved by the
  owner for the first TestFlight build). Bump it in a PR for a new release line.
- **Build number** (`CFBundleVersion`) is managed by EAS (`appVersionSource: remote`). Every production build
  increments it on EAS servers (`autoIncrement`), starting at 1 for a new project, and EAS writes it into the native
  project during the build. Nothing is committed per build, two machines cannot produce the same number, and a
  duplicate upload to App Store Connect is avoided. A local `ios.buildNumber` would be ignored, so `app.json` does not
  set one. Local development builds use build number 1. `eas build:version:get` / `eas build:version:set` show or
  correct the remote value.

The alternative, `appVersionSource: local` with `autoIncrement`, would change `app.json` on every build and need a
commit each time, which is why it was not chosen.

## Release configuration

Owner decision (2026-10-20, [#177 comment](https://github.com/alimek/budget-lens-offline/pull/177#issuecomment-6289624873)): the bundle identifier `com.budgetlens.offline`,
`ITSAppUsesNonExemptEncryption = NO` and version `0.1.0` for the first TestFlight build are approved.

- **Bundle identifier:** `com.budgetlens.offline` (`ios.bundleIdentifier`, same as the Android package), approved by
  the owner. It cannot be changed after the App Store Connect record exists.
- **Display name:** `Budget Lens`. **Icon and splash:** placeholders in `apps/mobile/assets/` (`icon.png`,
  1024×1024 without alpha as App Store Connect requires; `splash-icon.png` on `#0F766E`), to be replaced by the
  design work.
- **Export compliance:** `ios.config.usesNonExemptEncryption: false` sets `ITSAppUsesNonExemptEncryption = NO`, so
  App Store Connect does not ask the compliance question for every build. Approved by the owner, who treats the
  on-device SQLCipher encryption as exempt. Reasoning:
  the app has no encryption of its own except HTTPS through Apple's OS networking and, once #75 lands, SQLCipher
  (AES) that only protects the user's own data at rest on the device. The app's primary function is personal
  budgeting, not information security, communication or networking, so this falls under the exemptions Apple lists
  for encryption that is not the primary function (EAR Category 5 Part 2, Note 4). If this assessment changes, set
  it to `true` and answer the export compliance questions in App Store Connect.
- **Usage strings:** none are needed today. The app requests no protected resources (camera, photos, location,
  contacts, motion activity, Face ID, tracking). Expo and React Native link system frameworks such as CoreMotion and
  CryptoKit, but no code path calls an API that needs an `NS*UsageDescription` key; if App Store Connect reports a
  missing purpose string (ITMS-90683) after an upload, add the key it names. Add the string (English, with the Polish
  translation via Expo's `locales` config) in the same PR as the feature that needs it, for example
  `NSFaceIDUsageDescription` for a biometric lock.
- **Network:** App Transport Security as described in [mobile development](../mobile-development.md#native-permissions-and-network).

## Local compile check (optional)

An unsigned local Release archive shows whether the native project compiles without using EAS build credit. It needs
Xcode and CocoaPods but no Apple or Expo account; `ios/` stays ignored:

```sh
cd apps/mobile
CI=1 EXPO_NO_TELEMETRY=1 pnpm exec expo prebuild --platform ios --clean
xcodebuild archive -workspace ios/BudgetLens.xcworkspace -scheme BudgetLens -configuration Release \
  -destination generic/platform=iOS -archivePath "${TMPDIR:-/tmp}/BudgetLens.xcarchive" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""
```

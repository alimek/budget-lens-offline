# iOS builds and TestFlight with EAS (internal testing)

Owner decisions: iOS builds go to **TestFlight, internal testing only** (#176; no external testers, no App Store
submission), and they are built and submitted with **Expo Application Services**: EAS Build and EAS Submit (#178).
Native builds stay out of GitHub CI (#166): every EAS build is started manually with `eas build`. Only the **free EAS
plan** is used; paid features need the owner's consent.

## Configuration in the repository

- `apps/mobile/eas.json`. EAS expects it in the app directory of a monorepo, and every `eas` command runs from
  `apps/mobile` (the pnpm scripts below do that).
  - `cli.appVersionSource: "remote"`: EAS stores the iOS build number (see [Versions](#versions-and-build-numbers)).
  - `build.base`: shared settings. Node.js `24.22.0` (as in `.nvmrc`) and pnpm `12.14.0` (as in `packageManager`),
    because the default EAS images ship older versions. `EXPO_NO_TELEMETRY=1`.
  - `build.development`: development client (`expo-dev-client`), internal distribution (ad hoc, registered devices).
  - `build.preview`: Release build, internal distribution (ad hoc), for testing without TestFlight, EAS Update
    channel `preview`.
  - `build.production`: Release build for App Store Connect (`distribution: store`), `autoIncrement: true`, EAS
    Update channel `production`.
  - `submit.production.ios`: only `ascAppId` (`6824934955`), the numeric App Store Connect app ID of
    `com.budgetlens.offline` (App Store Connect → App Information → Apple ID). It is an app identifier, not a secret
    or an account name, and lets `eas submit` run non-interactively (#190). There is no `appleTeamId` or Apple ID;
    the App Store Connect API key comes from EAS credentials (see [Release flow](#release-flow)).
- `apps/mobile/app.json`: bundle identifier, version, icon, splash, export compliance (see
  [Release configuration](#release-configuration)), the EAS project link `extra.eas.projectId` (#183) and the EAS
  Update settings `updates` and `runtimeVersion` ([updates.md](updates.md)). It is static; there is no
  `app.config.ts`.
  - **The project is already linked.** `extra.eas.projectId` is committed; it is not a secret. EAS CLI identifies the
    project and its account by this ID alone (since SDK 53 it does not need `owner`; eas-cli #2835 and #3017).
  - **Never commit `owner`.** It is an Expo account name, and the repository stays account-agnostic (#171).
  - **`extra.router` is not committed.** The `expo-router` config plugin adds `extra.router.asyncRoutes.web: true`
    whenever the config is evaluated (`expo config` shows the same value with or without it in `app.json`), and it
    only affects async routes on web. EAS writes it into `app.json` only while linking a project (`eas init`), not on
    `eas build` once `extra.eas.projectId` is set.
- The root `prepare` script skips `lefthook install` when `EAS_BUILD=true` (set on EAS builders), so the install step
  does not depend on Git hooks. Locally, `pnpm install` still installs the hooks.
- EAS uploads the repository without the files ignored by `.gitignore`. It installs dependencies with pnpm from the
  workspace root and runs `expo prebuild` itself (CNG; `ios/` is never committed).

No credentials, team IDs, Apple IDs or Expo account names are in the repository. Signing credentials (distribution
certificate, provisioning profile) and the App Store Connect API key live in **EAS credentials** of the linked project.

## Release flow

Run every command from a **clean working tree** of an up-to-date `main` (`git status` shows nothing). EAS uploads the
working tree, and `eas` may write `owner` or `extra.router` into `apps/mobile/app.json` (see
[Relinking](#relinking-the-project)); a clean tree shows such a change immediately, so it can be reverted and never
ends up in a build or a commit.

A change that only touches JavaScript or assets can reach an installed build as an EAS Update instead of a new build
([updates.md](updates.md#update-or-new-build)).

Before a release build, run the local e2e suites on **both iOS and Android** (`pnpm e2e:ios`, `pnpm e2e:android`);
day-to-day UI PRs are tested on iOS only ([testing](../testing.md#platforms)).

Prerequisites: a paid Apple Developer Program membership, and an Expo login with access to the account that owns the
linked project (`pnpm --filter @budget-lens/mobile eas whoami`; Developer role or higher).

1. **Build:** `pnpm eas:build:ios`, which runs `eas build --platform ios --profile production` in the EAS cloud; its
   page on expo.dev shows the progress. **Signing credentials already exist in EAS** (#183): the owner's first
   production build ran interactively with his Apple Developer login, and EAS created the distribution certificate and
   provisioning profile for `com.budgetlens.offline` and stored them in the project's EAS credentials. Later builds
   reuse them; `pnpm --filter @budget-lens/mobile eas credentials --platform ios` shows them. If they are ever revoked
   or expire, the next interactive build asks for the Apple login again and recreates them.
2. **App Store Connect API key (for EAS Submit):** it lives in the project's EAS credentials, never in the
   repository, an env file or a CI secret. Check it, or add it if it is missing, on expo.dev (project → *Credentials*
   → iOS → `com.budgetlens.offline` → App Store Connect API Key) or with
   `pnpm --filter @budget-lens/mobile eas credentials --platform ios` → *production* → *App Store Connect: Manage
   your API Key* → *Set up your project to use an API Key for EAS Submit*. EAS can create the key (App Manager role).
   Without a stored key, `eas submit` asks for the Apple login interactively instead.
3. **Submit:** `pnpm eas:submit:ios`, which runs `eas submit --platform ios --profile production`. Pick the finished
   build, or submit a known build without prompts:
   `pnpm --filter @budget-lens/mobile eas submit --platform ios --profile production --id <build-id> --non-interactive`
   (needs the stored API key and `ascAppId`). EAS uploads it to App Store Connect for **internal TestFlight testing**; on the first submit it can create
   the App Store Connect app record for `com.budgetlens.offline`. Processing takes about 10–15 minutes.
4. **Testers:** in App Store Connect → the app → *TestFlight*, create an internal testing group with the testers
   (team members), add the build (or enable automatic distribution for the group), and the testers install it with
   the **TestFlight** app on their iPhone. The owner's first production build reached TestFlight and is installed on an iPhone (#183).

Non-interactive submits (`--non-interactive`, `eas build --auto-submit`) work because `ascAppId` is set and the API key
is stored in EAS. If wanted, `groups` (internal TestFlight group names) can be added to `submit.production.ios` too.
`appleTeamId` and an Apple ID are not needed while the API key is stored in EAS.

## Commands

Run from the repository root (the scripts call EAS CLI pinned to `eas-cli@25.2.0` via `pnpm dlx` in `apps/mobile`):

```sh
pnpm eas:build:ios        # eas build --platform ios --profile production (cloud build, remote build number)
pnpm eas:submit:ios       # eas submit --platform ios --profile production (pick the build, upload to TestFlight)
pnpm --filter @budget-lens/mobile eas project:info                              # linked project and ID
pnpm --filter @budget-lens/mobile eas build --platform ios --profile preview   # ad hoc internal build
pnpm --filter @budget-lens/mobile eas <command>                                  # any other EAS CLI command
```

## Relinking the project

Only needed if `extra.eas.projectId` is lost or the project changes. Use the ID shown on the project's overview page
on expo.dev:

```sh
pnpm --filter @budget-lens/mobile eas init --id <projectId> --non-interactive --no-icon
```

`--no-icon` matters: without it, `eas init` uploads the app icon from `app.json` to the project on expo.dev. `eas init`
also writes `owner` (and `extra.router`, see above) into `app.json`. Before committing, keep only
`extra.eas.projectId` and revert the rest; `pnpm lint` fails while `owner` is there. Never use `eas init` without
`--id` or with `--force`: those can create a new project or relink to another account.

## Free plan limits

- Up to **15 iOS builds** (and 15 Android builds) per month, on the medium worker only (`resourceClass: large` is paid).
- **Low-priority queue:** at peak times the wait can be 90+ minutes before a build starts.
- **45-minute build timeout** and at most one macOS build at a time.
- EAS Submit is included.

**EAS Update** (over-the-air JavaScript and asset updates to installed builds) is configured (#184): channels,
runtime version, publishing and rollback are described in [updates.md](updates.md).

Check the current numbers on the Expo pricing page before relying on them.

**Privacy label:** not needed for internal TestFlight testing; before external testing or App Store submission the
owner fills in App Store Connect → *App Privacy* from [app-store-privacy.md](app-store-privacy.md).

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
  App Store Connect does not ask the compliance question for every build. Approved by the owner. Reasoning:
  since [#242](https://github.com/alimek/budget-lens-offline/issues/242) the app ships no encryption of its own at
  all — the database is plain SQLite inside the app sandbox, and the only encryption left is HTTPS through Apple's OS
  networking. The app's primary function is personal
  budgeting, not information security, communication or networking, so this falls under the exemptions Apple lists
  for encryption that is not the primary function (EAR Category 5 Part 2, Note 4). If this assessment changes (for
  example with the encrypted backup of E8), set it to `true` and answer the export compliance questions in App Store
  Connect.
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

# iOS release builds and TestFlight (internal testing)

Owner decision (#176, 2026-10-20): iOS builds go to **TestFlight, internal testing only** (no external testers, no
App Store submission). Native builds stay out of CI (#166), so a release build is made and uploaded **locally on a
macOS dev machine** with `scripts/ios/testflight.sh`, exposed as pnpm scripts.

## Prerequisites

- macOS with Xcode (command line tools selected), CocoaPods, Node from `.nvmrc` and pnpm 12.14.0;
  `pnpm install` from the repository root.
- A **paid Apple Developer Program** membership. Note the 10-character team ID (Apple Developer account,
  Membership details).
- An **App Store Connect app record** (Apps > New App, platform iOS) with the bundle identifier from
  `apps/mobile/app.json` (`ios.bundleIdentifier`), registered as an explicit App ID in the Developer account.
- An **internal testing group** in the app's TestFlight tab with the testers' Apple Accounts (team members only).
- An **App Store Connect API key** (Users and Access > Integrations > App Store Connect API, a team key with the
  **App Manager** role). Download the `AuthKey_<key id>.p8` once, store it **outside the repository** with
  `chmod 600`, and note the key ID and issuer ID. The key both signs (automatic signing with
  `-allowProvisioningUpdates`, no Xcode account needed) and uploads.

The unsigned compile check (`pnpm ios:build:unsigned`) needs only Xcode and CocoaPods, no Apple account.

## Environment variables

The script reads secrets and team-specific values **only from the environment**; nothing is committed. It prints
whether a variable is set, never its value, and fails closed when a required one is missing or malformed. A
template is in [`.env.example`](../../.env.example); export the values in your shell (the script does not load
`.env` files).

| Variable | Needed for | Meaning |
| --- | --- | --- |
| `APPLE_TEAM_ID` | signed build | Apple Developer team ID; written into the generated (ignored) Xcode project |
| `ASC_KEY_ID` | signed build, upload | App Store Connect API key ID |
| `ASC_ISSUER_ID` | signed build, upload | App Store Connect API issuer ID |
| `ASC_KEY_PATH` | signed build, upload | Path to `AuthKey_<key id>.p8`; must be outside the repository |
| `IOS_BUNDLE_IDENTIFIER` | optional | Overrides `ios.bundleIdentifier` from `app.json` |
| `IOS_BUILD_NUMBER` | optional | `CFBundleVersion`; default: UTC `YYYYMMDD.HHMM.SS`, each part an integer (see below) |
| `IOS_BUILD_DIR` | optional | Output directory; default `apps/mobile/build/ios` (gitignored). Inside the repository only `apps/mobile/build/` is accepted, since the directory holds `ExportOptions.plist` with the team ID and the logs; paths with `..` are refused |

`apps/mobile/app.config.ts` applies `IOS_BUNDLE_IDENTIFIER`, `IOS_BUILD_NUMBER` and `APPLE_TEAM_ID` on top of
`app.json` during `expo prebuild`.

## Versions and build numbers

- **Version** (`CFBundleShortVersionString`) is `expo.version` in `apps/mobile/app.json`. Bump it in a PR for a new
  release line.
- **Build number** (`CFBundleVersion`) is generated per build: by default the UTC date, time and seconds as
  `YYYYMMDD.HHMM.SS` with every part written as an integer without leading zeros, so 09:05:07 UTC on 2026-10-20 gives
  `20261020.905.7` and 14:05:00 gives `20261020.1405.0`. App Store Connect compares the parts numerically, so the
  number increases automatically and never repeats for the same version as long as builds start at least a second
  apart. Set `IOS_BUILD_NUMBER` to override it (one to three
  period-separated integers, higher than the last uploaded build).

## Commands

Run from the repository root. Every command accepts `--dry-run`, which prints the planned steps and the env status
without running anything.

```sh
pnpm ios:build:unsigned          # prebuild + Release archive with code signing disabled (compile check)
pnpm ios:build                   # prebuild + signed Release archive + App Store Connect IPA export
pnpm ios:upload                  # upload the exported IPA to TestFlight (or: pnpm ios:upload --ipa <path>)
pnpm ios:release                 # ios:build, then ios:upload
pnpm ios:build --dry-run         # show the plan and which variables are missing
```

Steps of `pnpm ios:release`:

1. `expo prebuild --platform ios --clean` regenerates the ignored `apps/mobile/ios` project (CNG) and runs
   `pod install`. `--skip-prebuild` reuses an existing project.
2. `xcodebuild archive -configuration Release -destination generic/platform=iOS` with automatic signing and API key
   authentication (`-allowProvisioningUpdates -authenticationKey*`).
3. `xcodebuild -exportArchive` with a generated `ExportOptions.plist` (method `app-store-connect`) exports the IPA to
   `apps/mobile/build/ios/export/`.
4. `xcrun altool --upload-app -t ios --api-key … --api-issuer …` uploads it. altool finds the key as
   `AuthKey_<key id>.p8` in `API_PRIVATE_KEYS_DIR`, which the script points at a private temporary directory with a
   link to `ASC_KEY_PATH` (under `$TMPDIR`). The directory is removed right after the upload and, as a fallback, by
   an exit trap; the script's exit code is altool's exit code.

`xcodebuild` output goes to `apps/mobile/build/ios/logs/` (gitignored; it contains the command line, so the key ID
and key path, never the key itself). On failure the script prints only the error lines.

After App Store Connect finishes processing (usually a few minutes), add the build to the internal testing group and
install it with the TestFlight app on the tester's iPhone.

## Release configuration

- **Bundle identifier:** `com.budgetlens.offline` (`ios.bundleIdentifier`, same as the Android package), pending the
  owner's confirmation in #176. It cannot be changed after the App Store Connect record exists.
- **Display name:** `Budget Lens`. **Icon and splash:** placeholders in `apps/mobile/assets/` (`icon.png`,
  1024×1024 without alpha as App Store Connect requires; `splash-icon.png` on `#0F766E`), to be replaced by the
  design work.
- **Export compliance:** `ios.config.usesNonExemptEncryption: false` sets `ITSAppUsesNonExemptEncryption = NO`, so
  App Store Connect does not ask the compliance question for every build. Reasoning (pending owner confirmation):
  the app has no encryption of its own except HTTPS through Apple's OS networking and, once #75 lands, SQLCipher
  (AES) that only protects the user's own data at rest on the device. The app's primary function is personal
  budgeting, not information security, communication or networking, so this falls under the exemptions Apple lists
  for encryption that is not the primary function (EAR Category 5 Part 2, Note 4). If the owner or an adviser
  concludes otherwise, set it to `true` and answer the export compliance questions in App Store Connect.
- **Usage strings:** none are needed today. The app requests no protected resources (camera, photos, location,
  contacts, motion activity, Face ID, tracking). Expo and React Native link system frameworks such as CoreMotion and
  CryptoKit, but no code path calls an API that needs an `NS*UsageDescription` key; if App Store Connect reports a
  missing purpose string (ITMS-90683) after an upload, add the key it names. Add the string
  (English, with the Polish translation via Expo's `locales` config) in the same PR as the feature that needs it, for example
  `NSFaceIDUsageDescription` for a biometric lock.
- **Network:** App Transport Security as described in [mobile development](../mobile-development.md#native-permissions-and-network).

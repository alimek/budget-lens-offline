# Over-the-air updates with EAS Update

Owner decision (#184): JavaScript and asset changes reach installed TestFlight builds through **EAS Update**
(`expo-updates`), without a new native build. Builds stay on the free EAS plan. The app stays offline-first: the update
check never blocks startup and the app works fully without network. The check is the app's only outbound request today and an
accepted exception to the offline rule: [ADR 0013](../decisions/0013-eas-update-network-exception.md).

## How it works

- `apps/mobile/app.json`:
  - `updates.url` is the update URL of the linked EAS project (`https://u.expo.dev/<extra.eas.projectId>`). It is not
    a secret.
  - `runtimeVersion.policy: "fingerprint"`: the runtime version is a hash of everything native (dependencies with
    native code, config plugins, native-relevant `app.json` fields). EAS serves an update only to binaries with the
    same runtime version, so an update that needs different native code can never be installed on an old build.
  - `updates.checkAutomatically: "NEVER"` and `updates.fallbackToCacheTimeout: 0`: the native layer neither waits
    for nor starts a network request at launch. It starts the newest compatible bundle already on the device (the one
    embedded in the build, or a downloaded update).
- `apps/mobile/eas.json`: `build.production.channel: "production"` (TestFlight builds) and
  `build.preview.channel: "preview"` (ad hoc builds). EAS Build writes the channel into the binary; development builds
  have no channel and load the bundle from Metro.
- `apps/mobile/src/updates/update-check.ts`, called from the root layout after the first render on **every launch**: if
  the binary has `expo-updates` enabled, is not a development bundle and has a channel, it asks the update server for a newer update
  of that channel and downloads it in the background. Every error (offline, server, download) is swallowed and the app
  keeps running the current bundle. Nothing is reloaded during a session: a downloaded update is applied on the
  **next launch** (after the app is closed and started again).

## What an update check sends

The check (and, when an update is downloaded, the requests for its files) goes over HTTPS to Expo's EAS Update server
(`u.expo.dev`, the project's update URL). Verified in the `expo-updates` 58.0.17 sources (`FileDownloader` on iOS and
Android) and `expo-eas-client` 58.0.2, the request carries these headers:

| Header | Content |
| --- | --- |
| `EAS-Client-ID` | A random UUID created on first use and kept on the device (see [Installation ID storage](#installation-id-storage)); a **persistent per-install identifier**, sent on every check |
| `Expo-Fatal-Error` | The message of the fatal JavaScript error that ended the previous launch, truncated to 1024 characters; only when there was one |
| `Expo-Recent-Failed-Update-IDs` | IDs of updates that recently failed to launch, if any |
| `Expo-Current-Update-ID`, `Expo-Embedded-Update-ID` | The running update and the update embedded in the build (`Expo-Requested-Update-ID` on asset requests) |
| `Expo-Platform`, `Expo-Runtime-Version` | `ios` / `android` and the fingerprint |
| `expo-channel-name` | The channel EAS Build writes into the binary (`production`, `preview`) |
| `Expo-Protocol-Version`, `Expo-API-Version`, `Expo-Updates-Environment`, `Expo-JSON-Error`, `Accept` | Protocol constants |
| Server-defined headers, `Expo-Extra-Params` | Headers the server asked the client to send back; extra params only if the app sets them (it does not) |

The server also sees the device's **IP address** and the **time** of the request. The app adds no analytics or tracking
of its own and sends no budget data, but the installation identifier reaches Expo with every check, and a crash message with the first check after a
crash. Local
builds without a channel (for example `expo run:ios`) and development bundles make no request. How to switch the
check off if that is ever required: [ADR 0013](../decisions/0013-eas-update-network-exception.md) (Consequences).

### Installation ID storage

Verified in `expo-eas-client` 58.0.2 (`EASClientID` on iOS and Android) and in the generated Android manifest
(`expo prebuild`):

- **iOS:** `UserDefaults` key `expo.eas-client-id`, in the app's preferences in its data container (not the
  keychain). Deleting the app removes it; restoring an iCloud or computer backup of the device (or moving to a new
  iPhone from a backup) brings it back.
- **Android:** `SharedPreferences` file `dev.expo.EASSharedPreferences`, key `eas-client-id`. The app sets
  `android:allowBackup="true"` (Expo's default) without backup rules, so Android Auto Backup includes the file:
  deleting the app removes it, but a reinstall with a cloud backup or a device-to-device transfer restores it.

So the ID is reset by deleting the app unless a device backup is restored. Excluding it from backups would need
native backup rules (a new build, a new fingerprint); the explicit Android backup rules are planned with the
database ([app-shell-storage.md](../features/app-shell-storage.md)).

Users see this in the app: Settings → *Privacy* (`privacy.updates` in the locale files, English and Polish) explains
that the app checks for updates each time it starts, the installation ID (and that a device backup can restore it),
the technical details, the crash message and the IP address. The App Store
privacy label answers are prepared in [app-store-privacy.md](app-store-privacy.md).

## Update or new build?

An update is enough when only JavaScript/TypeScript code, translations or bundled assets (images, fonts) change.

A **new build** (`pnpm eas:build:ios`, then `pnpm eas:submit:ios`, see [testflight.md](testflight.md)) is required
when the fingerprint changes, for example:

- adding, removing or upgrading a dependency with native code (any `expo-*` module, React Native, an Expo SDK
  upgrade);
- changing config plugins or native fields in `app.json` (bundle identifier, icon, splash, permissions, Info.plist,
  `updates`, `runtimeVersion`);
- the first build after this change: binaries built before `expo-updates` was added cannot receive updates. The
  first build with `expo-updates`, a test publish and a rollback test on TestFlight are tracked in
  [#190](https://github.com/alimek/budget-lens-offline/issues/190).

To check, compare the local fingerprint with the build on the phone (the build ID is on its expo.dev page):

```sh
pnpm --filter @budget-lens/mobile eas fingerprint:compare --build-id <build-id> --environment production
```

If they differ, `eas update` still publishes, but under the new runtime version: no installed build receives it.

## Publishing an update

Updates reach the owner's phone **only on request or with the owner's go-ahead**, like any release. Nothing is
published automatically on merge.

From a clean working tree of an up-to-date `main` (as for builds, `eas` may write `owner` into `app.json`; revert it,
never commit it), with an Expo login that has access to the linked project:

```sh
pnpm --filter @budget-lens/mobile eas update --channel production --environment production --platform ios \
  --message "<what changed>"
```

`--environment` is required for Expo SDK 55 and later. EAS bundles the app locally, computes the fingerprint and
uploads the update to the `production` branch, which the `production` channel points to. On the phone: open the app
(it downloads the update in the background), close it completely, open it again: the update is running.
`pnpm --filter @budget-lens/mobile eas update:list` shows published update groups and their IDs;
`pnpm --filter @budget-lens/mobile eas channel:view production` shows the channel.

## Rollback

Two options, both published as a new update and applied on the phone after a relaunch like any other update:

- **Republish the previous update** (undo the latest update):

  ```sh
  pnpm --filter @budget-lens/mobile eas update:rollback
  ```

  It asks for the update group to roll back (it must be the latest one for its branch and runtime version) and
  republishes the group published before it; if there is none, it rolls back to the embedded bundle. To republish a
  specific older group: `eas update:republish --group <update-group-id> --message "<reason>"`.
- **Roll back to the embedded bundle** (the code that shipped in the build):

  ```sh
  pnpm --filter @budget-lens/mobile eas update:roll-back-to-embedded --channel production --platform ios \
    --message "<reason>"
  ```

A fix forward (a new `eas update` with the corrected code) is the third option. If an update crashes on launch,
`expo-updates` itself falls back to the previous working bundle on the next start.

## Limits

- The free plan includes a monthly quota of update monthly active users and bandwidth, far above what internal
  TestFlight testing uses. Check the current numbers on the Expo pricing page.
- Updates do not change the build number or version shown in TestFlight.

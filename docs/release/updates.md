# Over-the-air updates with EAS Update

Owner decision (#184): JavaScript and asset changes reach installed TestFlight builds through **EAS Update**
(`expo-updates`), without a new native build. Builds stay on the free EAS plan. The app stays offline-first: the update
check never blocks startup and needs no network.

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
- `apps/mobile/src/updates/update-check.ts`, called once from the root layout after the first render: if the binary has
  `expo-updates` enabled, is not a development bundle and has a channel, it asks the update server for a newer update
  of that channel and downloads it in the background. Every error (offline, server, download) is swallowed and the app
  keeps running the current bundle. Nothing is reloaded during a session: a downloaded update is applied on the
  **next launch** (after the app is closed and started again).
- The request goes only to Expo's update server over HTTPS and carries what `expo-updates` needs to pick an update
  (platform, runtime version, channel, current and embedded update IDs). No user data, no analytics and no
  telemetry are sent. Local builds without a channel (for example `expo run:ios`) make no request.

## Update or new build?

An update is enough when only JavaScript/TypeScript code, translations or bundled assets (images, fonts) change.

A **new build** (`pnpm eas:build:ios`, then `pnpm eas:submit:ios`, see [testflight.md](testflight.md)) is required
when the fingerprint changes, for example:

- adding, removing or upgrading a dependency with native code (any `expo-*` module, React Native, an Expo SDK
  upgrade);
- changing config plugins or native fields in `app.json` (bundle identifier, icon, splash, permissions, Info.plist,
  `updates`, `runtimeVersion`);
- the first build after this change: binaries built before `expo-updates` was added cannot receive updates.

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

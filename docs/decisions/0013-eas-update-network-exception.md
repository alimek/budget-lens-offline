# 0013 – EAS Update check as the offline exception

Status: Accepted ([#184](https://github.com/alimek/budget-lens-offline/issues/184), owner decision 2026-10-20).

**Context.** Budget Lens is offline-first: no Budget Lens server, no accounts, data stays on the device (AGENTS.md).
The first TestFlight build is installed (#183), and the owner wants JavaScript and asset changes to reach installed
builds without a new native build each time. `docs/release/testflight.md` recorded that `expo-updates` contacts Expo's
update servers and needed an explicit owner decision first.

**Decision.**
- Use EAS Update (`expo-updates`) with the `fingerprint` runtime version policy
  ([release/updates.md](../release/updates.md)).
- The EAS Update check is the app's **only outbound request today**. Other network use stays limited to the planned
  product features (public NBP exchange rates, #8; optional backup to the user's own iCloud / Google Drive, #30).
- Scope: release builds that have an EAS channel (`production`, `preview`). Development bundles and local builds
  without a channel make no request. The native launch-time check is off (`checkAutomatically: "NEVER"`,
  `fallbackToCacheTimeout: 0`); the app runs one check in the background after the first render on every launch.
  It only checks and downloads; it never reloads the running session, and a downloaded update applies on the next
  launch.
- Failure is swallowed: offline, server or download errors are ignored and the app keeps running the current
  bundle. The check never blocks startup.
- What is sent, and to whom: an HTTPS request to Expo's EAS Update server (`u.expo.dev`, the project's update URL)
  and, when an update is downloaded, requests for its files. Per the `expo-updates` 58.0.17 sources
  (`FileDownloader` on iOS and Android) and `expo-eas-client` 58.0.2, the headers are:
  - `EAS-Client-ID`: a random UUID created once per installation and stored on the device (iOS `UserDefaults`,
    Android `SharedPreferences`), sent on every check;
  - `Expo-Fatal-Error`: the message of the fatal JavaScript error that ended the previous launch, truncated to 1024
    characters, only when there was one;
  - `Expo-Recent-Failed-Update-IDs`, `Expo-Current-Update-ID`, `Expo-Embedded-Update-ID` (and
    `Expo-Requested-Update-ID` for asset requests): update IDs, not user data;
  - `Expo-Platform`, `Expo-Runtime-Version` (the fingerprint), `expo-channel-name` (the channel EAS Build writes
    into the binary), `Expo-Protocol-Version`, `Expo-API-Version`, `Expo-Updates-Environment`, `Expo-JSON-Error`,
    `Accept`;
  - headers the update server asked the client to send back (`expo-server-defined-headers`), and
    `Expo-Extra-Params` only if the app sets extra params (it does not).

  The server also sees the device's IP address and the request time. The app adds no analytics or tracking of its
  own and sends no budget data.

**Consequences.**
- Updates reach installed builds without the App Store review or a new EAS build; native changes still need a build
  because the fingerprint changes.
- Expo (the EAS project's account) receives a persistent per-installation identifier, crash messages and the IP
  address. Privacy texts (onboarding, store privacy labels) must mention this request.
- **Opt-out later, if required:** set `updates.enabled: false` in `app.json` (needs a new build), or add a user
  setting that skips `checkForUpdateInBackground` (JavaScript only). Either removes the request entirely.
- Publishing stays manual and needs the owner's go-ahead; nothing is published on merge.

**Rejected alternatives.** A new EAS build and TestFlight submit for every change (slow, uses free-plan build
quota). A self-hosted update server (contradicts "no Budget Lens server"). The native launch-time check
(`checkAutomatically: "ON_LOAD"`) runs before JavaScript and cannot be gated or skipped by app logic.

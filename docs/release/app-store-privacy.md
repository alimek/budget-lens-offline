# App Store privacy label worksheet

Status: **proposed answers, to be reviewed by the owner** before any external TestFlight group or App Store
submission (#191). Internal TestFlight testing does not need the privacy label. App Store Connect → the app → *App
Privacy* is where the answers go; the owner fills it in.

## What leaves the device

Budget data never leaves the device; the optional backup goes only to the user's own iCloud / Google Drive (#30) and
is not collected by the developer. Today the only outbound request is the EAS Update check
([ADR 0013](../decisions/0013-eas-update-network-exception.md), headers in [updates.md](updates.md#what-an-update-check-sends)).
It goes to **Expo** (the EAS Update service), a third party, so Apple counts it as data collected by the app:

| Sent with every check | Apple data type | Notes |
| --- | --- | --- |
| `EAS-Client-ID`: random UUID per installation, removed when the app is deleted but restored with an iOS device backup or Android Auto Backup ([storage](updates.md#installation-id-storage)) | Identifiers → **Device ID** | Not an advertising ID (no IDFA), not linked to an account; the app has no accounts |
| `Expo-Fatal-Error`: last fatal JavaScript error message (up to 1024 characters), only after a crash | Diagnostics → **Crash Data** | Error text of the app's code; no budget data is put into error messages on purpose |
| Platform, runtime version, channel, update IDs | Diagnostics → **Other Diagnostic Data** (see question 2) | Technical metadata of the installed build |
| IP address and request time (seen by the server) | Not a data type by itself; **Coarse Location** only if location is derived from it (see question 3) | |

The planned NBP exchange rate download (#8) only reads public rates and sends no user data.

## Proposed answers

1. *Do you or your third-party partners collect data from this app?* **Yes** (Expo, through the update check).
2. Data types:
   - **Device ID**: purpose **App Functionality** (deliver compatible updates, gradual rollouts). Linked to the
     user's identity: **No**. Used for tracking: **No**.
   - **Crash Data**: purpose **App Functionality** (error recovery after a failed update). Linked: **No**.
     Tracking: **No**.
   - **Other Diagnostic Data**: as Crash Data, if open question 2 is answered yes.
3. Everything else (contact info, health, financial info, location, contacts, user content, browsing and search
   history, usage data, purchases, sensitive info): **not collected**. Financial data is entered by the user but
   stays on the device, so it is not "collected" in Apple's sense.
4. **Tracking: No.** No data is combined with third-party data for advertising, and nothing is shared with data
   brokers. The app has no ads, analytics or tracking SDKs, so no App Tracking Transparency prompt is needed.

## Open questions for the owner

1. Confirm the answers above, in particular **Device ID** and **Crash Data** for App Functionality, not linked, no
   tracking.
2. Declare platform / runtime version / update IDs as **Other Diagnostic Data**, or treat them as non-personal
   technical request data that needs no declaration?
3. Expo sees the IP address. Declare **Coarse Location** (only needed if Expo or the developer derives location from
   it), or not?
4. Expo counts installations (by `EAS-Client-ID`) for update usage and plan quotas. Is **App Functionality** the right
   purpose, or should **Analytics** be added as well?

If the update check is ever switched off (ADR 0013, *Consequences*), the label becomes "Data Not Collected".

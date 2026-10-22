# PRD: Backup & restore via the user's iCloud / Google Drive (E8)

Epic: [#30](https://github.com/alimek/budget-lens-offline/issues/30) · Status: proposed (open: [#49](https://github.com/alimek/budget-lens-offline/issues/49), [#50](https://github.com/alimek/budget-lens-offline/issues/50), [#51](https://github.com/alimek/budget-lens-offline/issues/51)) · decisions: [#48 direction](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6262913616), [#48 frequency](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263253821), [#48 owner review](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345) · MVP

## Problem

People don't want to lose their budget when they change or lose a phone, but they won't hand their data to a company
server, and they won't remember another password.

## Goal

Direction from the [owner, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6262913616):
- The backup is an **encrypted file** in the user's **own** iCloud app container or Google Drive appDataFolder.
- Its key is stored **automatically** in the platform's synced secret store: iOS Keychain with iCloud sync, Android
  Block Store. The user doesn't need to remember anything.
- After a reinstall or on a new device of the same platform, the app finds both the file and the key on its own.
- An **optional recovery code** (or export) is offered for switching platforms (iOS ↔ Android), and once when the
  platform's key sync isn't available ([owner review #48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)).
- There is no Budget Lens server and no plaintext in the cloud.

## Scope

**In:**
- Encrypted backup file ([#96](https://github.com/alimek/budget-lens-offline/issues/96)) in a `BLBK` AES-GCM container with a JSON payload, including items with their currencies, rate snapshots, manual rates and the
  locked base currency. NBP rate rows are excluded (they are re-fetched).
- Synced key storage (iOS Keychain `kSecAttrSynchronizable`, Android Block Store) through our own small `synced-key`
  Expo module.
- iCloud ([#98](https://github.com/alimek/budget-lens-offline/issues/98)) and Google Drive ([#99](https://github.com/alimek/budget-lens-offline/issues/99)) providers.
- Backup on by default, with no prompt or nudge: automatic **once a day on app open** (foreground) plus a manual
  **"Back up now"** button in Settings ([#100](https://github.com/alimek/budget-lens-offline/issues/100)). No background backup in MVP (revisit in [#51](https://github.com/alimek/budget-lens-offline/issues/51)).
- Retention: the last 5 backups plus one per closed month, at most 12.
- Automatic restore during onboarding ([#116](https://github.com/alimek/budget-lens-offline/issues/116)). On Android, onboarding has one **"Enable backup to Google
  Drive"** step (Google Sign-In consent for `appDataFolder`), nothing afterwards; iOS iCloud needs no prompt.
- Optional recovery code + file export for a platform switch ([#97](https://github.com/alimek/budget-lens-offline/issues/97)).

**Out:**
- Two-way record sync / CloudKit merge.
- Shared wallet.
- Any Budget Lens backend.
- A mandatory user password.
- Background backup (post-MVP, [#51](https://github.com/alimek/budget-lens-offline/issues/51)).
- Backup reminders or nudges.
- App lock (post-MVP, [#34](https://github.com/alimek/budget-lens-offline/issues/34)).

## User stories

- As a user, my budget is backed up automatically once a day when I open the app, without prompts, and I never have
  to remember a password.
- As an Android user, I allow backup to my Google Drive once, during onboarding.
- As a user, I see when my last backup ran and can back up now.
- As a user who reinstalls the app or sets up a new phone of the same platform, my budget is found and restored
  automatically.
- As a user moving from iPhone to Android (or back), I export the backup file and use a recovery code to restore it.

## Acceptance criteria (high level)

- Cloud files are unreadable without the key. A tampered file is rejected.
- Same-platform restore works without any user secret when the platform's key sync is available.
- When key sync is not available (e.g. iCloud Keychain off, Android without screen lock / E2EE), the app offers
  (never forces) saving a recovery code once. "Move to another platform" creates it automatically.
- A backup runs at most once a day on app open and on "Back up now". Retention keeps the last 5 backups plus one per
  closed month (at most 12).
- On Android the only backup prompt is the onboarding Google Drive consent step; on iOS there is none.
- A backup made on device A restores on device B with identical data, including closed months and rate snapshots.
  Older backup versions are migrated on restore.
- After a restore an integrity check confirms exactly one active month, a contiguous month sequence and opening =
  previous closing. A restore that rewinds the active month leads to the catch-up close ([E5](month-closing.md)), not
  an error ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), row 13).

## Success criteria

- Proposed target: backup and restore of a one-year budget takes under 10 s on Wi-Fi.
- Zero data sent anywhere other than the user's chosen cloud.

## Dependencies

- Core: [#96](https://github.com/alimek/budget-lens-offline/issues/96).
- App: [#97](https://github.com/alimek/budget-lens-offline/issues/97), [#98](https://github.com/alimek/budget-lens-offline/issues/98), [#99](https://github.com/alimek/budget-lens-offline/issues/99), [#100](https://github.com/alimek/budget-lens-offline/issues/100), [#116](https://github.com/alimek/budget-lens-offline/issues/116).
- UI: [#69](https://github.com/alimek/budget-lens-offline/issues/69).
- E1: [#74](https://github.com/alimek/budget-lens-offline/issues/74), [#111](https://github.com/alimek/budget-lens-offline/issues/111).
- Gating (E9): [#104](https://github.com/alimek/budget-lens-offline/issues/104).

## Open questions

The [#48 research report](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263031199) questions are **decided** ([owner review, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)):
- "Remember nothing" is conditional: when key sync isn't available, a recovery code is offered once (never forced);
  "Move to another platform" creates it automatically.
- Our own small `synced-key` Expo module.
- A JSON payload in a `BLBK` AES-GCM container.
- Frequency: once a day on app open, plus "Back up now"; no background backup in MVP.
- Retention: the last 5 backups plus one per closed month, at most 12.
- NBP rate rows are excluded; manual rates are kept.

Still open (research):
- Backup scheduling & reliability: [#51](https://github.com/alimek/budget-lens-offline/issues/51) (the daily on-open backup now; background backup later).
- Cloud providers without a server: [#50](https://github.com/alimek/budget-lens-offline/issues/50).
- MVP sync scope: [#49](https://github.com/alimek/budget-lens-offline/issues/49).

Decided earlier: DB key model [#34](https://github.com/alimek/budget-lens-offline/issues/34) (Q2 superseded by #48).

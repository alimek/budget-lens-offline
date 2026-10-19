# PRD: Backup & restore via the user's iCloud / Google Drive (E8)

Epic: [#30](https://github.com/alimek/budget-lens-offline/issues/30) · Status: approved · MVP

## Problem

People don't want to lose their budget when they change or lose a phone, but they won't hand their data to a company
server, and they won't remember another password.

## Goal

Direction from the [owner, 2026-10-19](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6262913616):
- The backup is an **encrypted file** in the user's **own** iCloud app container or Google Drive appDataFolder.
- Its key is stored **automatically** in the platform's synced secret store: iOS Keychain with iCloud sync, Android
  Block Store. The user doesn't need to remember anything.
- After a reinstall or on a new device of the same platform, the app finds both the file and the key on its own.
- An **optional recovery code** (or export) is offered only for switching platforms (iOS ↔ Android).
- There is no Budget Lens server and no plaintext in the cloud.

## Scope

**In:**
- Encrypted backup file ([#96](https://github.com/alimek/budget-lens-offline/issues/96)), including items with their currencies, rate snapshots, manual rates and the
  locked base currency.
- Synced key storage (iOS Keychain `kSecAttrSynchronizable`, Android Block Store).
- iCloud ([#98](https://github.com/alimek/budget-lens-offline/issues/98)) and Google Drive ([#99](https://github.com/alimek/budget-lens-offline/issues/99)) providers.
- Backup settings, manual and automatic backups ([#100](https://github.com/alimek/budget-lens-offline/issues/100)).
- Automatic restore during onboarding ([#116](https://github.com/alimek/budget-lens-offline/issues/116)).
- Optional recovery code + file export for a platform switch ([#97](https://github.com/alimek/budget-lens-offline/issues/97)).

**Out:**
- Two-way record sync / CloudKit merge.
- Shared wallet.
- Any Budget Lens backend.
- A mandatory user password.
- App lock (post-MVP, [#34](https://github.com/alimek/budget-lens-offline/issues/34)).

## User stories

- As a user, I turn on backup and never have to remember a password.
- As a user, I see when my last backup ran and can back up now.
- As a user who reinstalls the app or sets up a new phone of the same platform, my budget is found and restored
  automatically.
- As a user moving from iPhone to Android (or back), I export the backup file and use a recovery code to restore it.

## Acceptance criteria (high level)

- Cloud files are unreadable without the key. A tampered file is rejected.
- Same-platform restore works without any user secret when the platform's key sync is available.
- When key sync is not available (e.g. iCloud Keychain off, Android without screen lock / E2EE), the app says so
  and offers the recovery code.
- A backup made on device A restores on device B with identical data, including closed months and rate snapshots.
  Older backup versions are migrated on restore.

## Success criteria

- Backup and restore of a one-year budget takes under 10 s on Wi-Fi.
- Zero data sent anywhere other than the user's chosen cloud.

## Dependencies

- Core: [#96](https://github.com/alimek/budget-lens-offline/issues/96).
- App: [#97](https://github.com/alimek/budget-lens-offline/issues/97), [#98](https://github.com/alimek/budget-lens-offline/issues/98), [#99](https://github.com/alimek/budget-lens-offline/issues/99), [#100](https://github.com/alimek/budget-lens-offline/issues/100), [#116](https://github.com/alimek/budget-lens-offline/issues/116).
- UI: [#69](https://github.com/alimek/budget-lens-offline/issues/69).
- E1: [#74](https://github.com/alimek/budget-lens-offline/issues/74), [#111](https://github.com/alimek/budget-lens-offline/issues/111).
- Gating (E9): [#104](https://github.com/alimek/budget-lens-offline/issues/104).

## Open questions

The [#48 research report](https://github.com/alimek/budget-lens-offline/issues/48) (2026-10-19) found that the direction holds with conditions:
- "Remember nothing" depends on iCloud Keychain (iOS) or Google Backup + screen lock (Android).
- expo-secure-store can't sync keys, so a small native module is needed.
- A platform switch needs the exported file as well as the code.

Its open questions for Grzegorz are **not decided yet** ([#48](https://github.com/alimek/budget-lens-offline/issues/48)):
- accepting the conditional promise
- our own synced-key module
- a recovery code that is offered, not forced
- a JSON payload in a `BLBK` AES-GCM container
- default backup frequency "after changes"
- retention
- excluding NBP rate rows

Other research:
- Backup scheduling: [#51](https://github.com/alimek/budget-lens-offline/issues/51).
- Cloud providers without a server: [#50](https://github.com/alimek/budget-lens-offline/issues/50).
- MVP sync scope: [#49](https://github.com/alimek/budget-lens-offline/issues/49).
- DB key model: [#34](https://github.com/alimek/budget-lens-offline/issues/34) (Q2 superseded by #48).

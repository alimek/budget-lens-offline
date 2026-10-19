# PRD: Backup & restore via the user's iCloud / Google Drive (E8)

Epic: [#30](https://github.com/alimek/budget-lens-offline/issues/30) · Status: approved · MVP

## Problem

People don't want to lose their budget when they change or lose a phone, but they won't hand their data to a company
server.

## Goal

Users back up an encrypted snapshot to their **own** iCloud app container or Google Drive appdata folder, manually or
on a schedule, and restore it on a new device with their recovery secret. There is no Budget Lens server and no
plaintext in the cloud.

## Scope

**In:**
- Encrypted snapshot format ([#96](https://github.com/alimek/budget-lens-offline/issues/96)), including items with their currencies, rate snapshots, cached and manual
  rates, and the locked base currency.
- Recovery secret ([#97](https://github.com/alimek/budget-lens-offline/issues/97)).
- iCloud ([#98](https://github.com/alimek/budget-lens-offline/issues/98)) and Google Drive ([#99](https://github.com/alimek/budget-lens-offline/issues/99)) providers.
- Backup settings and schedule ([#100](https://github.com/alimek/budget-lens-offline/issues/100)).
- Restore flow ([#116](https://github.com/alimek/budget-lens-offline/issues/116)).

**Out:**
- Two-way record sync / CloudKit merge.
- Shared wallet.
- Any Budget Lens backend.
- Changing the base currency on restore (it comes from the snapshot).

## User stories

- As a user, I create a recovery secret and back up to iCloud or Google Drive.
- As a user, I see when my last backup ran.
- As a user with a new phone, I restore my budget during onboarding by entering my recovery secret.
- As a user, I understand that losing the recovery secret means losing the backup.

## Acceptance criteria (high level)

- Cloud files are unreadable without the recovery secret. A tampered file is rejected.
- A backup made on device A restores on device B with identical data, including closed months and rate snapshots.
- Restore runs migrations for older snapshot versions.

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

- DB key & recovery model: [#34](https://github.com/alimek/budget-lens-offline/issues/34).
- Backup format & encryption: [#48](https://github.com/alimek/budget-lens-offline/issues/48).
- MVP sync scope: [#49](https://github.com/alimek/budget-lens-offline/issues/49).
- Cloud providers without a server: [#50](https://github.com/alimek/budget-lens-offline/issues/50).
- Backup scheduling: [#51](https://github.com/alimek/budget-lens-offline/issues/51).

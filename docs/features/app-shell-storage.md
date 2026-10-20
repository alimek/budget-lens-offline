# PRD: App shell & encrypted local storage (E1)

Epic: [#23](https://github.com/alimek/budget-lens-offline/issues/23) · Status: approved ([#34](https://github.com/alimek/budget-lens-offline/issues/34#issuecomment-6263677486), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263678079), [#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426), [#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530), [#48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)) · MVP

## Problem

People who budget want their financial data safe and private. Most budgeting apps need an account and store data on
the vendor's servers.

## Goal

An Expo SDK 58 app for iOS and Android whose data lives only in an encrypted SQLite database on the device. There is
no sign-up, and the first launch guides the user through a short onboarding.

## Scope

**In:**
- `apps/mobile` scaffold, navigation skeleton, design-system component layer.
- `packages/db` (Drizzle schema + migrations).
- SQLCipher with a device-only random key (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), a cipher guard, and a recovery screen
  for "database present, key missing". "Start over" keeps the orphaned DB for 30 days or until the first successful
  backup. The DB is not excluded from iOS device backup ([owner review #34](https://github.com/alimek/budget-lens-offline/issues/34#issuecomment-6263677486)).
- Schema per [#35](https://github.com/alimek/budget-lens-offline/issues/35): one `items` table with `kind`, rule versions as rows, payment status as its own table, no SQL
  default for `items.currency`, an encrypted copy before every pending migration, Drizzle 0.45.x ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)).
- App structure per [#36](https://github.com/alimek/budget-lens-offline/issues/36): **Expo Router** ([ADR 0006](../decisions/0006-app-stack.md)) with native tabs
  (`expo-router/native-tabs`), editors as `formSheet` routes, Expo UI for settings/pickers/switches, a
  non-secret `bl.lang` mirror, explicit Android backup rules without `allowBackup=false`, typed routes after beta
  ([owner review #36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263678079)).
- Onboarding (language, **base currency step + lock confirmation**, starting balance, privacy explanation). On
  Android it has one **"Enable backup to Google Drive"** step (Google Sign-In consent for `appDataFolder`); iOS needs no
  prompt ([owner review #48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)). It looks up an existing backup in the user's own iCloud / Google Drive
  ([#116](https://github.com/alimek/budget-lens-offline/issues/116)).
- Main navigation: five Expo Router `NativeTabs`: **Overview** (the Dashboard, first and default), Month, Forecast,
  Items, Settings ([#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426); [Variant A, chosen by @alimek](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530)). **Savings** is not a tab: it is a
  screen pushed from the Savings card on Overview. "Add item" is a toolbar `+` (iOS) / FAB (Android), never a tab.

**Out:**
- Accounts and any Budget Lens server.
- Cloud backup ([E8](cloud-backup.md)), except the onboarding backup lookup and the Android Drive consent step.
- Changing the base currency after onboarding.
- App lock (biometric/PIN): post-MVP ([#34](https://github.com/alimek/budget-lens-offline/issues/34), owner decision 2026-10-19).

## User stories

- As a new user, I can start budgeting without creating an account.
- As a new user, I choose my base currency once during onboarding and confirm that it cannot be changed later.
- As a user, I can trust that my data is encrypted at rest and never leaves my phone unless I back it up myself.
- As a user who reinstalls the app or gets a new phone of the same platform, onboarding finds my backup on its
  own ([#48](https://github.com/alimek/budget-lens-offline/issues/48), [E8](cloud-backup.md)).
- As a user who lost the encryption key (e.g. restored a phone backup), I see a clear recovery screen instead of an
  empty or broken app.

## Acceptance criteria (high level)

- The app refuses to run in a build without SQLCipher (`PRAGMA cipher_version` guard).
- Onboarding makes no network requests except the optional lookup of an existing backup in the user's own iCloud /
  Google Drive ([E8](cloud-backup.md), [#116](https://github.com/alimek/budget-lens-offline/issues/116)), on Android the Google Drive consent step, and the background EAS Update check of release builds ([ADR 0013](../decisions/0013-eas-update-network-exception.md)); the onboarding privacy explanation must mention that check, reusing the `privacy.updates` text already shown in Settings → *Privacy* (#191). Confirming it locks the base currency ([#139](https://github.com/alimek/budget-lens-offline/issues/139)).
- The DB file is excluded from Android Auto Backup. A missing key leads to the recovery screen.
- There is no backup prompt, reminder or nudge besides the Android consent step ([#48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263253821)).
- Every screen has a `screen-<name>` `testID` and all strings go through i18n (PL+EN).

## Success criteria

- A cold start to the onboarding screen works on the `BudgetLens-*` simulator/emulator with an encrypted DB.
- Proposed target: zero network requests during onboarding other than the optional backup lookup in the user's own
  iCloud / Google Drive (E8, #116), the Android Google Drive consent step and the EAS Update check (ADR 0013).

## Dependencies

- Development:
  - [#73](https://github.com/alimek/budget-lens-offline/issues/73) scaffold
  - [#74](https://github.com/alimek/budget-lens-offline/issues/74) packages/db
  - [#75](https://github.com/alimek/budget-lens-offline/issues/75) SQLCipher
  - [#110](https://github.com/alimek/budget-lens-offline/issues/110) navigation
  - [#111](https://github.com/alimek/budget-lens-offline/issues/111) onboarding
  - [#119](https://github.com/alimek/budget-lens-offline/issues/119) design system layer
  - [#139](https://github.com/alimek/budget-lens-offline/issues/139) base-currency lock
  - [#116](https://github.com/alimek/budget-lens-offline/issues/116) restore flow (backup lookup in onboarding)
- UI:
  - [#57](https://github.com/alimek/budget-lens-offline/issues/57) information architecture
  - [#58](https://github.com/alimek/budget-lens-offline/issues/58) design system
  - [#59](https://github.com/alimek/budget-lens-offline/issues/59) onboarding
  - [#60](https://github.com/alimek/budget-lens-offline/issues/60) recovery screens
- E2 settings and i18n: [#77](https://github.com/alimek/budget-lens-offline/issues/77), [#78](https://github.com/alimek/budget-lens-offline/issues/78).
- E2E: [#15](https://github.com/alimek/budget-lens-offline/issues/15).

## Open questions

- DB key & recovery model: [#34](https://github.com/alimek/budget-lens-offline/issues/34) (decided, [owner review #34](https://github.com/alimek/budget-lens-offline/issues/34#issuecomment-6263677486)).
- Schema & migrations: [#35](https://github.com/alimek/budget-lens-offline/issues/35) (decided; Q7 changed to "current rate only", [owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)).
- App architecture & navigation: [#36](https://github.com/alimek/budget-lens-offline/issues/36) (decided; tab bar Variant A [recorded on #36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530)).

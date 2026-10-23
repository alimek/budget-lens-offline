# PRD: App shell & local storage (E1)

Epic: [#23](https://github.com/alimek/budget-lens-offline/issues/23) · Status: approved ([#34](https://github.com/alimek/budget-lens-offline/issues/34#issuecomment-6263677486), [#35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802), [#36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263678079), [#36 Q1](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6263044426), [#36 tabs](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530), [#48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263841345)) · MVP

## Problem

People who budget want their financial data safe and private. Most budgeting apps need an account and store data on
the vendor's servers.

## Goal

An Expo SDK 58 app for iOS and Android whose data lives only in a plain SQLite database on the device, inside the app
sandbox and protected by the OS (#242, [ADR 0007](../decisions/0007-local-database.md)). There is no sign-up, and the
first launch guides the user through a short onboarding.

## Scope

**In:**
- `apps/mobile` scaffold, navigation skeleton, design-system component layer.
- `packages/db` (Drizzle schema + migrations): implemented in #74, with a database gate before data screens render.
  Implemented in #75: the copy taken before pending migrations and the boot/recovery screens.
- Plain SQLite: no SQLCipher, no database key, no app-level encryption ([#242](https://github.com/alimek/budget-lens-offline/issues/242),
  [ADR 0007](../decisions/0007-local-database.md)). Privacy comes from the app sandbox and the OS's own data
  protection; the app asks for nothing extra and has no key that can be lost.
- Exactly one recovery screen, shown when the database cannot be opened or migrated (interim UI until the #60
  mockups): "Try again" plus "Start over" behind a confirmation. "Start over" keeps the old file — it is renamed, not
  deleted, so E8 can still read it; deleting such files after 30 days or the first successful backup and restoring a
  backup are E8 work
  ([#96](https://github.com/alimek/budget-lens-offline/issues/96), [#97](https://github.com/alimek/budget-lens-offline/issues/97)). The DB is not excluded from iOS device backup ([owner review #34](https://github.com/alimek/budget-lens-offline/issues/34#issuecomment-6263677486)).
- **No migration from an encrypted database (#242):** an install updating from a build of #75 lands on the recovery
  screen, and accepting "Start over" leaves it with an **empty budget**. The encrypted file stays on the device for
  support and for E8, but this build cannot read it, and the key it needs is no longer stored: the data on that
  device is lost (owner decision, 2026-10-22, [decisions](../decisions.md)).
- Schema per [#35](https://github.com/alimek/budget-lens-offline/issues/35): one `items` table with `kind`, rule versions as rows, payment status as its own table, no SQL
  default for `items.currency`, a copy before every pending migration, Drizzle 0.45.x ([owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)).
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

- Minimum OS: **Android 8.0 (minSdk 26)**, set with `expo-build-properties`, and **iOS 16.4** (the SDK 58 default).
  Android 7 is not supported ([#44 decision](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340036713), [minimums decided on #44](https://github.com/alimek/budget-lens-offline/issues/44#issuecomment-6340102575), 2026-10-22; applied in the
  [#218](https://github.com/alimek/budget-lens-offline/issues/218) spike).
- For the first month, the user is asked which items added for it are already paid, so the starting balance isn't
  double-counted by the forecast; #59 / #111 place the step ([#43](https://github.com/alimek/budget-lens-offline/issues/43#issuecomment-6340492002), row 12).

**Out:**
- Accounts and any Budget Lens server.
- Cloud backup ([E8](cloud-backup.md)), except the onboarding backup lookup and the Android Drive consent step.
- Changing the base currency after onboarding.
- App lock (biometric/PIN): post-MVP ([#34](https://github.com/alimek/budget-lens-offline/issues/34), owner decision 2026-10-19).

## User stories

- As a new user, I can start budgeting without creating an account.
- As a new user, I choose my base currency once during onboarding and confirm that it cannot be changed later.
- As a user, I can trust that my data stays on my phone, inside the app's own sandbox, and never leaves it unless I
  back it up myself.
- As a user who reinstalls the app or gets a new phone of the same platform, onboarding finds my backup on its
  own ([#48](https://github.com/alimek/budget-lens-offline/issues/48), [E8](cloud-backup.md)).
- As a user whose database cannot be opened (a damaged file, a failed update, a device that refuses to answer), I
  see one clear recovery screen with a retry instead of an empty or broken app, and nothing is deleted without
  asking me (#242).

## Acceptance criteria (high level)

- The app opens a plain SQLite database: no SQLCipher in the build, no key in secure storage, no cipher pragma
  anywhere (#242).
- Onboarding makes no network requests except the optional lookup of an existing backup in the user's own iCloud /
  Google Drive ([E8](cloud-backup.md), [#116](https://github.com/alimek/budget-lens-offline/issues/116)), on Android the Google Drive consent step, and the background EAS Update check of release builds ([ADR 0013](../decisions/0013-eas-update-network-exception.md)); the onboarding privacy explanation must mention that check, reusing the `privacy.updates` text already shown in Settings → *Privacy* (#191). Confirming it locks the base currency ([#139](https://github.com/alimek/budget-lens-offline/issues/139)).
- The DB file is excluded from Android Auto Backup. A database that cannot be opened or migrated leads to the one
  recovery screen, which offers "Try again" and "Start over" behind a confirmation and deletes nothing itself. The EAS Update
  installation ID (`dev.expo.EASSharedPreferences`) stays in Android backups (#75): the privacy text in Settings,
  [updates.md](../release/updates.md#installation-id-storage) and the App Store privacy worksheet already disclose
  that a device backup can restore it, so excluding it would need a new build and a change to that disclosure.
- There is no backup prompt, reminder or nudge besides the Android consent step ([#48](https://github.com/alimek/budget-lens-offline/issues/48#issuecomment-6263253821)).
- Every screen has a `screen-<name>` `testID` and all strings go through i18n (PL+EN).

## Success criteria

- A cold start to the onboarding screen works on the `BudgetLens-*` simulator/emulator with a plain SQLite DB.
- Proposed target: zero network requests during onboarding other than the optional backup lookup in the user's own
  iCloud / Google Drive (E8, #116), the Android Google Drive consent step and the EAS Update check (ADR 0013).

## Dependencies

- Development:
  - [#73](https://github.com/alimek/budget-lens-offline/issues/73) scaffold
  - [#74](https://github.com/alimek/budget-lens-offline/issues/74) packages/db
  - [#75](https://github.com/alimek/budget-lens-offline/issues/75) database boot and recovery (SQLCipher added
    here, removed again by [#242](https://github.com/alimek/budget-lens-offline/issues/242))
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

- DB key & recovery model: [#34](https://github.com/alimek/budget-lens-offline/issues/34) (decided, then dropped with [#242](https://github.com/alimek/budget-lens-offline/issues/242): no key at all, one recovery screen).
- Schema & migrations: [#35](https://github.com/alimek/budget-lens-offline/issues/35) (decided; Q7 changed to "current rate only", [owner review #35](https://github.com/alimek/budget-lens-offline/issues/35#issuecomment-6263677802)).
- App architecture & navigation: [#36](https://github.com/alimek/budget-lens-offline/issues/36) (decided; tab bar Variant A [recorded on #36](https://github.com/alimek/budget-lens-offline/issues/36#issuecomment-6276141530)).

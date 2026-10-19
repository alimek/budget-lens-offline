# PRD: App shell & encrypted local storage (E1)

Epic: [#23](https://github.com/alimek/budget-lens-offline/issues/23) · Status: approved · MVP

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
- SQLCipher with a device-only random key, a cipher guard, and a recovery screen for "database present, key missing".
- Onboarding (language, **base currency step + lock confirmation**, starting balance, privacy explanation).

**Out:**
- Accounts and any Budget Lens server.
- Cloud backup ([E8](cloud-backup.md)).
- Changing the base currency after onboarding.

## User stories

- As a new user, I can start budgeting without creating an account.
- As a new user, I choose my base currency once during onboarding and confirm that it cannot be changed later.
- As a user, I can trust that my data is encrypted at rest and never leaves my phone unless I back it up myself.
- As a user who lost the encryption key (e.g. restored a phone backup), I see a clear recovery screen instead of an
  empty or broken app.

## Acceptance criteria (high level)

- The app refuses to run in a build without SQLCipher (`PRAGMA cipher_version` guard).
- Onboarding completes fully offline. Confirming it locks the base currency ([#139](https://github.com/alimek/budget-lens-offline/issues/139)).
- The DB file is excluded from Android Auto Backup. A missing key leads to the recovery screen.
- Every screen has a `screen-<name>` `testID` and all strings go through i18n (PL+EN).

## Success criteria

- A cold start to the onboarding screen works on the `BudgetLens-*` simulator/emulator with an encrypted DB.
- Zero network requests during onboarding.

## Dependencies

- Development:
  - [#73](https://github.com/alimek/budget-lens-offline/issues/73) scaffold
  - [#74](https://github.com/alimek/budget-lens-offline/issues/74) packages/db
  - [#75](https://github.com/alimek/budget-lens-offline/issues/75) SQLCipher
  - [#110](https://github.com/alimek/budget-lens-offline/issues/110) navigation
  - [#111](https://github.com/alimek/budget-lens-offline/issues/111) onboarding
  - [#119](https://github.com/alimek/budget-lens-offline/issues/119) design system layer
  - [#139](https://github.com/alimek/budget-lens-offline/issues/139) base-currency lock
- UI:
  - [#57](https://github.com/alimek/budget-lens-offline/issues/57) information architecture
  - [#58](https://github.com/alimek/budget-lens-offline/issues/58) design system
  - [#59](https://github.com/alimek/budget-lens-offline/issues/59) onboarding
  - [#60](https://github.com/alimek/budget-lens-offline/issues/60) recovery screens
- E2 settings and i18n: [#77](https://github.com/alimek/budget-lens-offline/issues/77), [#78](https://github.com/alimek/budget-lens-offline/issues/78).
- E2E: [#15](https://github.com/alimek/budget-lens-offline/issues/15).

## Open questions

- DB key & recovery model: [#34](https://github.com/alimek/budget-lens-offline/issues/34).
- Schema & migrations (incl. `items.currency`, rate snapshots): [#35](https://github.com/alimek/budget-lens-offline/issues/35).
- App architecture & navigation: [#36](https://github.com/alimek/budget-lens-offline/issues/36).

# PRD: Money, localization (PL/EN) & settings (E2)

Epic: [#24](https://github.com/alimek/budget-lens-offline/issues/24) · Status: approved · MVP

## Problem

Budget numbers must be exact and readable in the user's language. Users also handle money in more than one currency,
and they want their own warning limits and privacy on screen.

## Goal

Exact integer money in every supported currency (PLN + NBP table A), a fully translated UI (PL/EN), one local
`Settings` model that drives every calculation, a base currency that is locked after onboarding, and a privacy mode
that blurs amounts.

## Scope

**In:**
- Money parsing and formatting per currency exponent (done in [#2](https://github.com/alimek/budget-lens-offline/issues/2)).
- `Settings` model (done in [#76](https://github.com/alimek/budget-lens-offline/issues/76)).
- Base-currency lock ([#139](https://github.com/alimek/budget-lens-offline/issues/139)).
- i18n infrastructure ([#77](https://github.com/alimek/budget-lens-offline/issues/77)).
- Settings persistence and screen ([#78](https://github.com/alimek/budget-lens-offline/issues/78)).
- Privacy mode ([#79](https://github.com/alimek/budget-lens-offline/issues/79)).
- Amount input with currency selection ([#61](https://github.com/alimek/budget-lens-offline/issues/61)).

**Out:**
- Languages other than PL/EN.
- Arbitrary ISO currencies with manual rates (only PLN + NBP table A are supported).
- Changing the base currency after onboarding.

## User stories

- As a user, I enter "1 234,56" or "1234.56" and get the same amount.
- As a user, I enter an amount in EUR or JPY for an item, with the correct number of decimals.
- As a user, I see the app in Polish or English, following my device by default; anything not yet translated
  appears in English.
- As a user, I set my low-balance and large-expense thresholds (in the base currency).
- As a user, I can see my base currency in Settings but cannot change it after onboarding.
- As a user, I blur all amounts with one tap.

## Acceptance criteria (high level)

- No floats for amounts. Amounts are formatted with native `Intl` ([#131](https://github.com/alimek/budget-lens-offline/issues/131), ADR 0012) following the app language
  (pl / en-GB), with 2 fraction digits everywhere and capitalized month titles. Ambiguous input like `1.234` is
  rejected with a clear message ([owner review #38](https://github.com/alimek/budget-lens-offline/issues/38#issuecomment-6263678750)).
- i18n uses i18next + react-i18next + i18next-cli, JSON v4 plurals, namespaces per feature, translations in the repo,
  and the system language with an in-app override ([owner review #37](https://github.com/alimek/budget-lens-offline/issues/37#issuecomment-6263678423)).
- `baseCurrency` (renamed from `defaultCurrency`); conversions round half away from zero ([owner review #39](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263679210)).
- No hardcoded UI strings. **English is the source language**; missing keys fall back to English at runtime.
  There are **no translation checks in CI** ([#37](https://github.com/alimek/budget-lens-offline/issues/37), final owner decision 2026-10-19). Translations are
  filled in before release.
- Thresholds and currencies come only from `Settings`. `baseCurrency` is immutable after onboarding (core + repository).
- Privacy mode leaves no amount readable on any screen.

## Success criteria

- Round-trip parse/format property tests pass for every supported currency ([#122](https://github.com/alimek/budget-lens-offline/issues/122)).
- Switching language changes every visible string without a restart.

## Dependencies

- Core: [#2](https://github.com/alimek/budget-lens-offline/issues/2) and [#76](https://github.com/alimek/budget-lens-offline/issues/76) (done).
- App: [#77](https://github.com/alimek/budget-lens-offline/issues/77), [#78](https://github.com/alimek/budget-lens-offline/issues/78), [#79](https://github.com/alimek/budget-lens-offline/issues/79), [#139](https://github.com/alimek/budget-lens-offline/issues/139).
- UI: [#61](https://github.com/alimek/budget-lens-offline/issues/61), [#62](https://github.com/alimek/budget-lens-offline/issues/62).
- E1 shell: [#73](https://github.com/alimek/budget-lens-offline/issues/73), [#74](https://github.com/alimek/budget-lens-offline/issues/74).

## Open questions

- i18n: [#37](https://github.com/alimek/budget-lens-offline/issues/37) (decided, [owner review #37](https://github.com/alimek/budget-lens-offline/issues/37#issuecomment-6263678423)).
- Formatting on Hermes: [#38](https://github.com/alimek/budget-lens-offline/issues/38) (decided; Q1 superseded by native `Intl`, [owner review #38](https://github.com/alimek/budget-lens-offline/issues/38#issuecomment-6263678750)).
- Currency model (decided: per-item currency in MVP, [owner decision](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)): [#39](https://github.com/alimek/budget-lens-offline/issues/39).
- Cross rates and refresh: [#124](https://github.com/alimek/budget-lens-offline/issues/124) (decided, [owner review #124](https://github.com/alimek/budget-lens-offline/issues/124#issuecomment-6263679950)).

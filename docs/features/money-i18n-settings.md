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
- As a user, I see the app in Polish or English, following my device by default.
- As a user, I set my low-balance and large-expense thresholds (in the base currency).
- As a user, I can see my base currency in Settings but cannot change it after onboarding.
- As a user, I blur all amounts with one tap.

## Acceptance criteria (high level)

- No floats for amounts. Amounts are formatted with native `Intl` per locale and currency.
- No hardcoded UI strings; the CI missing-key check passes.
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

- i18n library: [#37](https://github.com/alimek/budget-lens-offline/issues/37).
- Formatting on Hermes: [#38](https://github.com/alimek/budget-lens-offline/issues/38).
- Currency model (decided: per-item currency in MVP, [owner decision](https://github.com/alimek/budget-lens-offline/issues/39#issuecomment-6263015126)): [#39](https://github.com/alimek/budget-lens-offline/issues/39).
- Cross rates: [#124](https://github.com/alimek/budget-lens-offline/issues/124).

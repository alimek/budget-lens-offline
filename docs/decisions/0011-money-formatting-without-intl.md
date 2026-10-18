# 0011 – Money formatting without native Intl, with CLDR data in core

Status: Proposed (#2), based on the research and recommendation in
[#38](https://github.com/alimek/budget-lens-offline/issues/38); implemented in PR #117. It becomes Accepted when
Grzegorz approves #117 (the compact output still waits for his sign-off there).

**Context.** The app runs on Hermes (Expo SDK 58, RN 0.88), whose `Intl` is partial and differs by platform (#38):
- on iOS, `Intl.NumberFormat` ignores `notation: "compact"`, `compactDisplay` and `signDisplay` and returns the
  uncompacted number ([hermes#1035](https://github.com/facebook/hermes/issues/1035));
- iOS formats with `NSNumberFormatter` and Android with the platform's ICU4J, whose CLDR version depends on the
  Android version, so the same call can give different strings (e.g. whether `pl` minimum grouping digits 2 is
  applied on iOS is unverified);
- Vitest runs on Node.js ICU, so tests of `Intl`-based code would not show what users see.

Money strings must be identical on iOS, Android and in tests, and exact for every safe `MinorUnits` amount
([0008](0008-money-minor-units.md)).

**Decision.**
- `packages/core` formats money and compact numbers with its own integer-only TypeScript code
  (`formatMoney`, `formatMoneyCompact` in `money-format.ts`). Digits come from the `bigint` of the minor units,
  never from `amount / 100`.
- The CLDR data it needs for the two app languages (`pl`; `en` with `en-GB` currency conventions and `en` compact
  suffixes) is transcribed into `packages/core/src/money-locale.ts`: separators, minimum grouping digits, symbol
  position and spacing, the #38 symbols and compact suffixes. Currency exponents are ISO 4217 (`currency.ts`, #39).
- `Intl` is not used in `packages/core/src`. A Biome `noRestrictedGlobals` override for `packages/core/src/**`
  enforces it (`biome.json`); the legacy characterization copies in `packages/core/test` still use `Intl`.
- The data is checked against ICU with the dev-only `pnpm check:cldr-parity` (`scripts/check-cldr-parity.mjs`),
  which compares the core formatters with Node.js `Intl.NumberFormat` for every supported currency and both
  languages and fails on any difference. It is not a CI job, so a Node.js/ICU upgrade cannot make CI flaky.

**Rejected alternatives.**
- **Hermes `Intl.NumberFormat`:** no compact notation or `signDisplay` on iOS, platform-dependent output.
- **FormatJS `Intl.NumberFormat` polyfill:** about 213 KB gzip (#38) for two languages, and still float-based
  input (`number`), so exact formatting of large amounts would need extra work.
- **`toLocaleString` / `toFixed` on `amount / 100`:** float conversion and the same Hermes gaps.

**Consequences.**
- Same output everywhere and exact for every safe amount; tests assert literal strings (with `\u00a0`).
- The CLDR data is maintained by hand. A new UI language means new locale data (and tests) in `money-locale.ts`;
  a new currency symbol is a data change. Run `pnpm check:cldr-parity` after a Node.js upgrade (new ICU/CLDR) or a
  change to `money-locale.ts`, and either update the data or document the difference in
  [../domain/money.md](../domain/money.md).
- Deliberate differences from ICU defaults are documented there: no `-0`, and HUF/IDR shown with their ISO 4217
  exponent (2 digits) where CLDR shows 0.
- CLDR data is Copyright © Unicode, Inc., under the [Unicode License v3](https://www.unicode.org/license.txt), which
  permits this use with attribution. The attribution is kept in `money-locale.ts` and in
  [../domain/money.md](../domain/money.md); no dependency is added.
- Date and month labels (#38) are not covered by this ADR's implementation yet; they follow the same approach when
  ported.

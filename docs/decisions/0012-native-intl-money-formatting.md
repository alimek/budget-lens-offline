# 0012 – Native Intl money formatting, always full amounts

Status: Accepted ([#131](https://github.com/alimek/budget-lens-offline/issues/131), owner decision 2026-10-18).
Supersedes [0011](0011-money-formatting-without-intl.md).

**Context.** ADR 0011 introduced integer-only formatting and hand-maintained CLDR tables to make output identical
across platforms. The [#38 Hermes probe](https://github.com/alimek/budget-lens-offline/issues/38#issuecomment-6255104039)
confirmed that native currency formatting works, but iOS and Android differ in Polish grouping and half-rounding.
Compact notation is ignored on iOS, `formatToParts` is missing there, `Intl.PluralRules` is missing on both,
and `signDisplay` is unreliable (`"negative"` throws). The owner now accepts native platform differences and
requires full amounts everywhere, including charts.

**Decision.**
- Use native `Intl.NumberFormat` with `style: "currency"` in `formatMoney`; select `pl-PL` for `pl`, `en-GB` for `en`.
- Keep integer `MinorUnits`, input validation and the ISO 4217 currency exponent table. Explicitly set fraction
  digits from that table. Convert to a major-unit number only at the final display boundary.
- Keep optional whole-unit display, rounding half away from zero with `bigint` before native formatting.
  Normalize zero before formatting, including values rounded to zero, without `signDisplay`.
- Remove `formatMoneyCompact`, its options type, all hand-maintained locale/CLDR formatting tables, the dev-only
  CLDR parity script and package command, and the Biome ban on Intl in core. Parsing stays unchanged and Intl-free.
- Do not use compact notation, `formatToParts`, `signDisplay` or `Intl.PluralRules` for money formatting.
- Tests check conversion, full amounts, currency exponents, whole-unit rounding and zero normalization using
  runtime-native expected output rather than fixed platform-dependent strings.

**Consequences.**
- Symbols, spacing and grouping follow the device's locale data; iOS, Android and Node.js output can differ.
  No locale tables or NumberFormat polyfill need maintenance.
- Native Hermes consumes floating-point major values for display. At extreme safe-integer minor amounts, a final
  minor digit can be lost in conversion. ADR 0011's exact display guarantee is removed; stored amounts, parsing
  and arithmetic remain exact integers.
- Chart callers use full amounts, optionally with `fractionDigits: 0`. No chart callers exist in this repo yet.
- UI text plurals still require `@formatjs/intl-pluralrules` in #37/#77; that work is outside #131.

**Rejected alternatives.** Retaining custom CLDR formatting or adding a NumberFormat polyfill would keep
maintenance or bundle cost for cross-platform output parity that the owner no longer requires. Native compact
formatting cannot meet the iOS requirement and is no longer part of the product's money display.

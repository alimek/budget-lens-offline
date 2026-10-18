# 0008 – Money as integer minor units

Status: Accepted (#1, #2). Decision summary of 2026-10-18: [#1 decisions
comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Context.** Legacy stores amounts as floats and parses them with `parseFloat`, which causes rounding errors.

**Decision.** All amounts are integers in minor units (grosze for PLN; the scale is the currency's ISO 4217 exponent,
#39), typed as the branded `MinorUnits` (a
safe-integer `number`, not `bigint` – #2)
(`packages/core/src/money.ts`).

**Consequences.** No floats for money in public APIs; conversions (e.g. exchange rates) round explicitly. See
[../domain/money.md](../domain/money.md).

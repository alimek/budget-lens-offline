// Schema v1 (#74) per the #35 report as amended by its resolution, #40 (`closed_occurrences`) and #124 (current
// rates only). Changing a table here needs `pnpm --filter @budget-lens/db db:generate`; see packages/db/README.md.
import type { CurrencyCode, MinorUnits, RateSource, YearMonth } from "@budget-lens/core";
import { type SQL, sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * A column name without its table. drizzle-kit copies CHECK and partial-index SQL verbatim into table rebuilds
 * (`CREATE TABLE __new_x`), where a table-qualified `"x"."col"` fails with "no such column".
 */
const c = (column: AnySQLiteColumn) => sql.identifier(column.name);

/** `YYYY-MM` with month 01–12; NULL passes, so nullable month columns stay optional. */
const isMonth = (column: AnySQLiteColumn): SQL =>
  sql`${c(column)} GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr(${c(column)}, 6, 2) BETWEEN '01' AND '12'`;

/** `YYYY-MM-DD`, the NBP effective-date shape; calendar validity is checked in core. */
const isDate = (column: AnySQLiteColumn): SQL =>
  sql`${c(column)} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`;

/** ISO 4217 shape; the supported set (PLN + NBP table A) is checked in core, so the list can change without a rebuild. */
const isCurrency = (column: AnySQLiteColumn): SQL => sql`${c(column)} GLOB '[A-Z][A-Z][A-Z]'`;

const isBoolean = (column: AnySQLiteColumn): SQL => sql`${c(column)} IN (0, 1)`;

const month = (name: string) => text(name).$type<YearMonth>();
const minor = (name: string) => integer(name).$type<MinorUnits>();
const currency = (name: string) => text(name).$type<CurrencyCode>();
/** UTC epoch milliseconds, written from an injected clock. */
const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });

const timestamps = {
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
};

/** Expenses and incomes in one table (#35 Q1); `kind` and `currency` are fixed after creation (#40). */
export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["expense", "income"] }).notNull(),
    name: text("name").notNull(),
    // No SQL default (#35 Q5): always written explicitly; may differ from the base currency (#39).
    currency: currency("currency").notNull(),
    note: text("note"),
    sortOrder: integer("sort_order").notNull().default(0),
    // Archive instead of hard delete (#81).
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (t) => [
    index("items_kind_archived_idx").on(t.kind, t.archivedAt),
    check("items_kind_chk", sql`${c(t.kind)} IN ('expense', 'income')`),
    check("items_currency_chk", isCurrency(t.currency)),
  ],
);

/**
 * "From this month on" edits as rows (#40): the version in force for month m has the greatest
 * `effective_from <= m`. Amounts are in the item's currency.
 */
export const itemRuleVersions = sqliteTable(
  "item_rule_versions",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    effectiveFrom: month("effective_from").notNull(),
    amountMinor: minor("amount_minor").notNull(),
    // NULL = one-time (then `target_month` is set); otherwise repeats every n months from `anchor_month`.
    intervalMonths: integer("interval_months"),
    anchorMonth: month("anchor_month"),
    targetMonth: month("target_month"),
    dayOfMonth: integer("day_of_month"),
    endMonth: month("end_month"),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("rule_versions_item_from_uq").on(t.itemId, t.effectiveFrom),
    check(
      "rule_versions_shape_chk",
      sql`(${c(t.intervalMonths)} IS NULL AND ${c(t.targetMonth)} IS NOT NULL) OR (${c(t.intervalMonths)} >= 1 AND ${c(t.anchorMonth)} IS NOT NULL AND ${c(t.targetMonth)} IS NULL)`,
    ),
    check("rule_versions_amount_chk", sql`${c(t.amountMinor)} >= 0`),
    check(
      "rule_versions_day_chk",
      sql`${c(t.dayOfMonth)} IS NULL OR ${c(t.dayOfMonth)} BETWEEN 1 AND 31`,
    ),
    check(
      "rule_versions_months_chk",
      sql`${isMonth(t.effectiveFrom)} AND (${c(t.anchorMonth)} IS NULL OR ${isMonth(t.anchorMonth)}) AND (${c(t.targetMonth)} IS NULL OR ${isMonth(t.targetMonth)}) AND (${c(t.endMonth)} IS NULL OR ${isMonth(t.endMonth)})`,
    ),
  ],
);

/** "Only this month" changes (E4), keyed by (item, month); `amount_minor` is in the item's currency. */
export const occurrenceOverrides = sqliteTable(
  "occurrence_overrides",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    month: month("month").notNull(),
    // NULL keeps the rule amount.
    amountMinor: minor("amount_minor"),
    skipped: integer("skipped", { mode: "boolean" }).notNull().default(false),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("overrides_item_month_uq").on(t.itemId, t.month),
    index("overrides_month_idx").on(t.month),
    check("overrides_month_chk", isMonth(t.month)),
    check("overrides_amount_chk", sql`${c(t.amountMinor)} IS NULL OR ${c(t.amountMinor)} >= 0`),
    check("overrides_skipped_chk", isBoolean(t.skipped)),
  ],
);

/** A row means paid (expense) or received (income) in that month (#35 Q4). */
export const paymentStatuses = sqliteTable(
  "payment_statuses",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    month: month("month").notNull(),
    settledAt: timestamp("settled_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.month] }),
    index("payment_month_idx").on(t.month),
    check("payment_month_chk", isMonth(t.month)),
  ],
);

/**
 * Budget months (core `BudgetMonth`); amounts in base-currency minor units. At most one `active` month (partial
 * unique index), so closing (#85) must close the old row before inserting the next active one.
 */
export const months = sqliteTable(
  "months",
  {
    month: month("month").primaryKey(),
    status: text("status", { enum: ["active", "closed"] }).notNull(),
    openingBalanceMinor: minor("opening_balance_minor").notNull(),
    closingBalanceMinor: minor("closing_balance_minor").notNull(),
    totalIncomeMinor: minor("total_income_minor").notNull(),
    totalExpensesMinor: minor("total_expenses_minor").notNull(),
    netChangeMinor: minor("net_change_minor").notNull(),
    // Set when closed: the closed month keeps the base currency of its snapshot.
    baseCurrency: currency("base_currency"),
    closedAt: timestamp("closed_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("months_single_active_uq")
      .on(t.status)
      .where(sql`${c(t.status)} = 'active'`),
    check("months_month_chk", isMonth(t.month)),
    check("months_status_chk", sql`${c(t.status)} IN ('active', 'closed')`),
    check(
      "months_closed_chk",
      sql`(${c(t.status)} = 'active' AND ${c(t.closedAt)} IS NULL AND ${c(t.baseCurrency)} IS NULL) OR (${c(t.status)} = 'closed' AND ${c(t.closedAt)} IS NOT NULL AND ${c(t.baseCurrency)} IS NOT NULL AND ${isCurrency(t.baseCurrency)})`,
    ),
  ],
);

/**
 * Frozen per-occurrence facts of a closed month (#40 Q3, #141), written in the close transaction (#85). Reading a
 * closed month never touches `exchange_rates`. The rate columns are NULL when the item is in the base currency.
 */
export const closedOccurrences = sqliteTable(
  "closed_occurrences",
  {
    month: month("month")
      .notNull()
      .references(() => months.month, { onDelete: "restrict" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    kind: text("kind", { enum: ["expense", "income"] }).notNull(),
    // Effective amount after overrides, in `currency` (the item's currency).
    amountMinor: minor("amount_minor").notNull(),
    currency: currency("currency").notNull(),
    // Rate used: 1 unit of `currency` = `rate_mid` PLN, as a decimal string (never a float).
    rateMid: text("rate_mid"),
    rateSource: text("rate_source").$type<RateSource>(),
    rateEffectiveDate: text("rate_effective_date"),
    // Converted amount in the month's base currency.
    baseAmountMinor: minor("base_amount_minor").notNull(),
    settled: integer("settled", { mode: "boolean" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.month, t.itemId] }),
    index("closed_occurrences_item_idx").on(t.itemId),
    check("closed_occurrences_kind_chk", sql`${c(t.kind)} IN ('expense', 'income')`),
    check("closed_occurrences_currency_chk", isCurrency(t.currency)),
    check(
      "closed_occurrences_amount_chk",
      sql`${c(t.amountMinor)} >= 0 AND ${c(t.baseAmountMinor)} >= 0`,
    ),
    check(
      "closed_occurrences_rate_chk",
      sql`(${c(t.rateMid)} IS NULL AND ${c(t.rateSource)} IS NULL AND ${c(t.rateEffectiveDate)} IS NULL) OR (${c(t.rateMid)} IS NOT NULL AND ${c(t.rateSource)} IN ('nbp', 'manual') AND ${isDate(t.rateEffectiveDate)})`,
    ),
    check("closed_occurrences_settled_chk", isBoolean(t.settled)),
  ],
);

/**
 * Typed singleton (`id = 1`) for core `Settings`. No SQL defaults: core `DEFAULT_SETTINGS` is the only source, and
 * a changed default never needs a table rebuild. `base_currency` is locked once `onboarding_completed_at` is set
 * (#139, repository guard).
 */
export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey(),
    language: text("language", { enum: ["system", "pl", "en"] }).notNull(),
    baseCurrency: currency("base_currency").notNull(),
    trackedCurrencies: text("tracked_currencies", { mode: "json" })
      .$type<readonly CurrencyCode[]>()
      .notNull(),
    lowBalanceThresholdMinor: minor("low_balance_threshold_minor").notNull(),
    largeExpenseThresholdMinor: minor("large_expense_threshold_minor").notNull(),
    forecastHorizonMonths: integer("forecast_horizon_months").notNull(),
    rateMaxAgeBusinessDays: integer("rate_max_age_business_days").notNull(),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    check("settings_singleton_chk", sql`${c(t.id)} = 1`),
    check("settings_base_currency_chk", isCurrency(t.baseCurrency)),
    check(
      "settings_thresholds_chk",
      sql`${c(t.lowBalanceThresholdMinor)} >= 0 AND ${c(t.largeExpenseThresholdMinor)} >= 0`,
    ),
    check(
      "settings_positive_chk",
      sql`${c(t.forecastHorizonMonths)} >= 1 AND ${c(t.rateMaxAgeBusinessDays)} >= 1`,
    ),
  ],
);

export const savings = sqliteTable(
  "savings",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    currency: currency("currency").notNull(),
    amountMinor: minor("amount_minor").notNull(),
    note: text("note"),
    archivedAt: timestamp("archived_at"),
    ...timestamps,
  },
  (t) => [check("savings_currency_chk", isCurrency(t.currency))],
);

/**
 * Current rates only, no history (#35 Q7, #124): one row per currency. The repository chooses the newer
 * NBP or manual quote before writing it. PLN is implicit and never stored.
 */
export const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    currency: currency("currency").notNull(),
    source: text("source").$type<RateSource>().notNull(),
    // 1 unit of `currency` = `mid` PLN, as a decimal string (never a float).
    mid: text("mid").notNull(),
    effectiveDate: text("effective_date").notNull(),
    // Fetch time (NBP) or entry time (manual).
    fetchedAt: timestamp("fetched_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.currency] }),
    check("exchange_rates_currency_chk", isCurrency(t.currency)),
    check("exchange_rates_source_chk", sql`${c(t.source)} IN ('nbp', 'manual')`),
    check("exchange_rates_date_chk", isDate(t.effectiveDate)),
  ],
);

/** Small app-level key/value facts that are not settings. */
export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

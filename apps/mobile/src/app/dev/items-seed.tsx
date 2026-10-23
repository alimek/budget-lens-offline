// Development-only seed for the Items list (#112): one press writes a small, deterministic set of items through
// the real repository, the other archives them again, so an e2e run can start from an empty list and from a
// populated one on the same device. Names come from i18n like every other text; the row ids carry a `gen` query
// parameter the test chooses, so a fresh run seeds new rows instead of colliding with the archived ones that the
// previous run left behind. Both presses also open the current month when none is open yet (#82), because a
// screen may only plan a change against a stored month and onboarding (#111) is not built yet.
import {
  addMonths,
  type CurrencyCode,
  type ItemType,
  type MinorUnits,
  type RuleVersion,
  type Schedule,
  toMinorUnits,
  type YearMonth,
} from "@budget-lens/core";
import {
  archiveItem,
  type BudgetDatabase,
  createItem,
  readActiveMonth,
  readItems,
  schema,
} from "@budget-lens/db";
import { randomUUID } from "expo-crypto";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { localCalendarMonth } from "@/db/active-month";
import { useDatabase } from "@/db/database-provider";
import { useActiveMonth } from "@/db/use-active-month";
import { formatMonthName } from "@/i18n/format-month-name";
import { Screen } from "@/ui/components/screen";
import { Text } from "@/ui/components/text";
import { PrimaryButton, SecondaryButton } from "@/ui/native/button";

/**
 * The Polish month cases, in the order the screen shows them (#63, decision 5). The nominative is the one form
 * that comes from native `Intl` rather than from the table, and Hermes has its own `Intl` build: an e2e test
 * reads this line back on both platforms, so a platform that declines the nominative ("lutego 2027" instead of
 * "luty 2027") fails there instead of shipping the wrong month.
 */
const POLISH_MONTH_CASES = ["nominative", "genitive", "instrumental", "locative"] as const;

/** February, the odd month out: *luty*, but *lutego* and twice *lutym*. */
const PROBE_MONTH = "2027-02";

const polishMonthCases = POLISH_MONTH_CASES.map((name) =>
  formatMonthName(PROBE_MONTH, "pl", { case: name }),
).join(" · ");

/** Every seeded row id starts with this, which is also exactly what "clear" archives. */
const SEED_PREFIX = "dev-seed-";

/** The repository deps: the clock and the new version ids are injected, never read inside the package (#81). */
const deps = { now: () => Date.now(), newId: randomUUID };

/**
 * Opens `month` as the app's active month when no month is open yet, so the seeded data is read by a screen that
 * has a month to anchor to. Onboarding (#111) will be the real writer of the first month; until it exists the
 * `months` table is empty and #82's sheet refuses to plan a change against the clock (its Save stays off with
 * the reason shown), which no e2e run could get past. Seeding a zeroed `active` row is the smallest development
 * stand-in for it: the balances belong to month closing (#85), which recomputes them.
 */
function ensureActiveMonth(db: BudgetDatabase, month: YearMonth): void {
  if (readActiveMonth(db) !== undefined) return;
  const at = new Date();
  db.insert(schema.months)
    .values({
      month,
      status: "active",
      openingBalanceMinor: toMinorUnits(0),
      closingBalanceMinor: toMinorUnits(0),
      totalIncomeMinor: toMinorUnits(0),
      totalExpensesMinor: toMinorUnits(0),
      netChangeMinor: toMinorUnits(0),
      createdAt: at,
      updatedAt: at,
    })
    .run();
}

/** The names of the seeded items, typed so the translated lookup stays type-safe. */
type SeedNameKey =
  | "dev.itemsSeed.names.rent"
  | "dev.itemsSeed.names.internet"
  | "dev.itemsSeed.names.streaming"
  | "dev.itemsSeed.names.carInsurance"
  | "dev.itemsSeed.names.oldPhone"
  | "dev.itemsSeed.names.salary";

interface SeedSpec {
  readonly slug: string;
  readonly nameKey: SeedNameKey;
  readonly kind: ItemType;
  readonly currency: CurrencyCode;
  readonly sortOrder: number;
  readonly amount: MinorUnits;
  /** First version's anchor, in months from the month the app is on. */
  readonly startOffset: number;
  readonly dayOfMonth?: number;
  readonly oneTime?: boolean;
  /** A second version at this offset gives the row its "Change from" badge. */
  readonly change?: { readonly offset: number; readonly amount: MinorUnits };
  /** Seeded straight into the archive, for the archived list. */
  readonly archived?: boolean;
}

const SPECS: readonly SeedSpec[] = [
  {
    slug: "rent",
    nameKey: "dev.itemsSeed.names.rent",
    kind: "expense",
    currency: "PLN",
    sortOrder: 1,
    amount: 320_000 as MinorUnits,
    startOffset: -9,
    dayOfMonth: 10,
  },
  {
    slug: "internet",
    nameKey: "dev.itemsSeed.names.internet",
    kind: "expense",
    currency: "PLN",
    sortOrder: 2,
    amount: 100_000 as MinorUnits,
    startOffset: -9,
    dayOfMonth: 15,
    change: { offset: 2, amount: 120_000 as MinorUnits },
  },
  {
    slug: "streaming",
    nameKey: "dev.itemsSeed.names.streaming",
    // A foreign-currency item: there is no rate for it yet (#92), so its row says "No rate yet".
    kind: "expense",
    currency: "JPY",
    sortOrder: 3,
    amount: 1_500 as MinorUnits,
    startOffset: -9,
    dayOfMonth: 1,
  },
  {
    slug: "car-insurance",
    nameKey: "dev.itemsSeed.names.carInsurance",
    kind: "expense",
    currency: "PLN",
    sortOrder: 4,
    amount: 150_000 as MinorUnits,
    startOffset: 0,
    oneTime: true,
  },
  {
    slug: "old-phone",
    nameKey: "dev.itemsSeed.names.oldPhone",
    kind: "expense",
    currency: "PLN",
    sortOrder: 5,
    amount: 60_000 as MinorUnits,
    startOffset: -12,
    archived: true,
  },
  {
    slug: "salary",
    nameKey: "dev.itemsSeed.names.salary",
    kind: "income",
    currency: "PLN",
    sortOrder: 1,
    amount: 850_000 as MinorUnits,
    startOffset: -9,
    dayOfMonth: 5,
  },
];

/** The rhythm of a spec anchored to `start`: monthly from then on, or one month for a one-time item. */
function scheduleOf(spec: SeedSpec, start: YearMonth): Schedule {
  const day = spec.dayOfMonth === undefined ? {} : { dayOfMonth: spec.dayOfMonth };
  return spec.oneTime === true
    ? { kind: "one-time", month: start, ...day }
    : { kind: "recurring", intervalMonths: 1, anchor: start, ...day };
}

/** The versions of a spec: the one in force, and the scheduled change when the spec has one. */
function versionsOf(spec: SeedSpec, month: YearMonth): RuleVersion[] {
  const start = addMonths(month, spec.startOffset);
  const first: RuleVersion = {
    effectiveFrom: start,
    amount: spec.amount,
    schedule: scheduleOf(spec, start),
  };
  if (spec.change === undefined) {
    return [first];
  }
  const changed: RuleVersion = {
    effectiveFrom: addMonths(month, spec.change.offset),
    amount: spec.change.amount,
    schedule: scheduleOf(spec, start),
  };
  return spec.change.offset > spec.startOffset ? [first, changed] : [changed, first];
}

/**
 * Development-only seeder behind `Stack.Protected guard={__DEV__}` (#75 R7). Open it with
 * `budget-lens:///dev/items-seed?gen=7`: "Seed" writes the set with ids `dev-seed-7-<slug>`, and "Clear" archives
 * every item the database holds, leaving an empty list whatever an earlier run left behind. A release build
 * cannot reach the route, so it can run none of this. The seeded item names are user data, written through i18n
 * like every other text in the app.
 */
export default function DevItemsSeed() {
  const { t } = useTranslation();
  const db = useDatabase();
  // Development-only, and it only ever writes rows anchored to roughly now, so the calendar month stands in
  // while no month is open yet (the screen's own fallback is a display-only one; see `useActiveMonth`).
  const { month: stored } = useActiveMonth();
  const month = stored ?? localCalendarMonth(new Date());
  const { gen = "1" } = useLocalSearchParams<{ readonly gen?: string }>();
  const [result, setResult] = useState("");

  const seed = () => {
    ensureActiveMonth(db, month);
    const known = new Set(readItems(db, { includeArchived: true }).items.map((item) => item.id));
    for (const spec of SPECS) {
      const id = `${SEED_PREFIX}${gen}-${spec.slug}`;
      if (known.has(id)) continue;
      createItem(
        db,
        {
          id,
          kind: spec.kind,
          name: t(spec.nameKey),
          currency: spec.currency,
          sortOrder: spec.sortOrder,
          versions: versionsOf(spec, month),
        },
        deps,
      );
      if (spec.archived === true) archiveItem(db, id, deps);
    }
    setResult(t("dev.itemsSeed.seeded"));
  };

  // Every item, not only the seeded ones: a run that failed halfway left its own rows in the list, and the
  // screen that starts from an empty list has to mean it.
  const clear = () => {
    ensureActiveMonth(db, month);
    for (const item of readItems(db, { includeArchived: true }).items) {
      archiveItem(db, item.id, deps);
    }
    setResult(t("dev.itemsSeed.cleared"));
  };

  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return (
    <Screen testID="screen-dev-items-seed">
      <Text testID="dev-items-seed-result">{result}</Text>
      <Text>{t("dev.itemsSeed.monthCases")}</Text>
      <Text testID="dev-month-cases">{polishMonthCases}</Text>
      {/* The month the rows are anchored to, which is the month a screen may plan against (#82): an e2e run
          reads it back instead of guessing from its own clock, which a stale `months` row could disagree with. */}
      <Text testID="dev-items-seed-month">{month}</Text>
      <PrimaryButton testID="dev-items-seed-seed" label={t("dev.itemsSeed.seed")} onPress={seed} />
      <SecondaryButton
        testID="dev-items-seed-clear"
        label={t("dev.itemsSeed.clear")}
        onPress={clear}
      />
    </Screen>
  );
}

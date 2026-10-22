// The one business rule of the months repository (#112): the active month is the row with `status = 'active'`,
// and a database whose months were never opened – before onboarding (#111) – has none.
import { toYearMonth } from "@budget-lens/core";
import { beforeEach, describe, expect, it } from "vitest";
import { readActiveMonth, runMigrations, schema } from "../src";
import { activeMonth, openTestDatabase } from "./helpers";

/** A closed month row: the same shape as the helper's active one, with what closing sets. */
const closedMonth = (month: string) => ({
  ...activeMonth(month),
  status: "closed" as const,
  closedAt: new Date(Date.UTC(2026, 8, 30)),
  baseCurrency: "PLN" as const,
});

let db: ReturnType<typeof openTestDatabase>;

beforeEach(() => {
  db = openTestDatabase();
  runMigrations(db);
});

describe("months repository", () => {
  it("has no active month before the first month has been opened", () => {
    // Arrange: a migrated database with no `months` row at all.

    // Act
    const month = readActiveMonth(db);

    // Assert
    expect(month).toBeUndefined();
  });

  it("reads the active month", () => {
    // Arrange
    db.insert(schema.months).values(activeMonth("2026-10")).run();

    // Act
    const month = readActiveMonth(db);

    // Assert
    expect(month).toEqual(toYearMonth("2026-10"));
  });

  it("ignores closed months", () => {
    // Arrange: only a closed month, so the list screen has nothing to anchor to.
    db.insert(schema.months).values(closedMonth("2026-09")).run();

    // Act
    const month = readActiveMonth(db);

    // Assert
    expect(month).toBeUndefined();
  });

  it("reads the active month among closed ones", () => {
    // Arrange
    db.insert(schema.months).values(closedMonth("2026-09")).run();
    db.insert(schema.months).values(activeMonth("2026-10")).run();

    // Act
    const month = readActiveMonth(db);

    // Assert
    expect(month).toEqual(toYearMonth("2026-10"));
  });
});

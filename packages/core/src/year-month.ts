/**
 * A calendar month written as `YYYY-MM` (months 01–12). Branded so that arbitrary strings cannot be used by
 * accident; create values with {@link toYearMonth} or narrow them with {@link isYearMonth}.
 */
export type YearMonth = string & { readonly __brand: "YearMonth" };

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isYearMonth(value: string): value is YearMonth {
  return YEAR_MONTH.test(value);
}

/** Converts a `YYYY-MM` string to {@link YearMonth}; throws a `RangeError` for anything else. */
export function toYearMonth(value: string): YearMonth {
  if (!isYearMonth(value)) {
    throw new RangeError(`Month must be written as YYYY-MM, received: ${value}`);
  }
  return value;
}

/** Months since January of year 0: a linear index that makes month arithmetic plain integer arithmetic. */
function toIndex(month: YearMonth): number {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
}

/** Index of `9999-12`, the last supported month (the supported domain is `0000-01` to `9999-12`). */
const LAST_INDEX = 9999 * 12 + 11;

function fromIndex(index: number): YearMonth {
  if (index < 0 || index > LAST_INDEX) {
    throw new RangeError(
      `Month is outside the supported range 0000-01 to 9999-12 (month index ${index})`,
    );
  }
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toYearMonth(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`);
}

/**
 * The month `count` months after `month` (before it for a negative `count`). Throws a `RangeError` when `count` is
 * not a safe integer or the result is outside `0000-01` to `9999-12`.
 */
export function addMonths(month: YearMonth, count: number): YearMonth {
  if (!Number.isSafeInteger(count)) {
    throw new RangeError(`Month count must be a safe integer, received: ${count}`);
  }
  return fromIndex(toIndex(month) + count);
}

/** Number of months from `from` to `to`: positive when `to` is later, 0 for the same month. */
export function monthsBetween(from: YearMonth, to: YearMonth): number {
  return toIndex(to) - toIndex(from);
}

/** Days in the month, with leap years (Gregorian calendar). */
export function daysInMonth(month: YearMonth): number {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  if (monthNumber === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(monthNumber) ? 30 : 31;
}

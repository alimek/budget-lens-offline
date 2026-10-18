import { afterEach, beforeEach, vi } from "vitest";

/**
 * Runs every test of the current file with a fixed process time zone and a frozen system clock.
 * The legacy code reads the device clock (`new Date()`) and local calendar fields, so both must
 * be pinned for the results to be deterministic.
 */
export function useFrozenClock(isoInstant: string, timeZone: string): void {
  let previousTimeZone: string | undefined;

  beforeEach(() => {
    previousTimeZone = process.env.TZ;
    process.env.TZ = timeZone;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoInstant));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (previousTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previousTimeZone;
    }
  });
}

/** Sets the process time zone and the system clock inside a single test. */
export function freezeClockAt(isoInstant: string, timeZone: string): void {
  process.env.TZ = timeZone;
  vi.setSystemTime(new Date(isoInstant));
}

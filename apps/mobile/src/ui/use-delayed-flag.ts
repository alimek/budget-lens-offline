import { useEffect, useState } from "react";

/**
 * `active` after it has stayed true for `delayMs`, and false as soon as it stops being true.
 *
 * The loading states of #112 use this: a live read is synchronous, so its pending state is gone within a frame
 * and a spinner that flashes is worse than none (#58: the loading screen appears after 300 ms).
 */
export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return shown;
}

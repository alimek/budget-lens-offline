import { useEffect, useRef } from "react";

interface NativeText {
  set(value: string): void;
}

/**
 * Keeps a native text state in step with a controlled `value`. The native field owns the text while typing, so the
 * prop is pushed only when it differs from what the field last reported: a re-render that lags behind fast input
 * never overwrites newer keystrokes. Returns the change handler to give the field.
 */
export function useSyncedText(
  text: NativeText,
  value: string,
  onChangeText: (value: string) => void,
): (next: string) => void {
  const reported = useRef(value);
  useEffect(() => {
    if (value === reported.current) return;
    reported.current = value;
    text.set(value);
  }, [text, value]);
  return (next) => {
    reported.current = next;
    onChangeText(next);
  };
}

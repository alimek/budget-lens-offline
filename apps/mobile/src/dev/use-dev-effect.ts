import { useEffect, useRef } from "react";

/**
 * An effect that must never run in a release build (#75 R7).
 *
 * The hook itself is called unconditionally, so hook order stays stable, and the guard sits inside the effect
 * where it cannot be forgotten the way a `return` above a `useEffect` is: Expo Router ships every file under
 * `src/app`, so a development route can still be mounted by a release build and its body runs only while
 * `__DEV__` is set. Development screens run once on mount, which is what this covers; a development route that
 * ever needs dependencies or cleanup uses `useEffect` behind its own `__DEV__` guard.
 */
export function useDevEffect(effect: () => void): void {
  // The callback changes on every render while the effect must run once, so it is read through a reference.
  const callback = useRef(effect);
  callback.current = effect;

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    callback.current();
  }, []);
}

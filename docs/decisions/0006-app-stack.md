# 0006 – App stack (Expo SDK 58)

Status: Accepted, not implemented yet (#1, #10)

**Decision.**
- Expo SDK 58 (React Native 0.88, New Architecture) with development builds; Expo Router for navigation.
- UI: Expo UI (native components) + Uniwind (Tailwind for React Native) for custom views.
- State: Zustand with the provider pattern (store created in a provider). Data from SQLite read with Drizzle
  `useLiveQuery`. TanStack Query only once network requests are added (NBP rates, license).
- Monorepo targets: `apps/mobile`, `packages/core`, `packages/db`.

**Consequences.** Expo Go is not enough (SQLCipher, cloud integrations). Known issues to verify on the first dev build
are listed in #10 (e.g. Uniwind asset loading on RN 0.88, `useLiveQuery` limitations).

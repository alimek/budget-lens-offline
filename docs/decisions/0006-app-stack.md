# 0006 – App stack (Expo SDK 58)

Status: Accepted, not implemented yet. Sources: #1 "Decyzje" (state, data reads, UI) and the #10 research
(closed) with its correction comment (SDK version, development builds); Expo Router: [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Decision.**
- Expo SDK 58 (React Native 0.88, New Architecture) with development builds (accepted per #10).
- Navigation: **Expo Router** ([#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427)).
- UI (#1): Expo UI (native components) + Uniwind (Tailwind for React Native) for custom views.
- State (#1): Zustand with the provider pattern (store created in a provider). Data from SQLite read with Drizzle
  `useLiveQuery`. TanStack Query only once network requests are added (NBP rates, license).
- Monorepo targets: `apps/mobile`, `packages/core`, `packages/db`.

**Open (not decided).** Chart library, minimum OS versions and the other questions from #10 – see
[../architecture.md](../architecture.md#open-questions).

**Consequences.** Expo Go is not enough (SQLCipher, cloud integrations). Known issues to verify on the first dev build
are listed in #10 (e.g. Uniwind asset loading on RN 0.88, `useLiveQuery` limitations).

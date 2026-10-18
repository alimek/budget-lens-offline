# 0002 – TypeScript 7 (`tsc`)

Status: Accepted. Supersedes the initial choice of `tsgo` from `@typescript/native-preview` (#1).

**Context.** #1 chose tsgo (native TypeScript preview). TypeScript 7.0 was released as stable with the native
compiler and `@typescript/native-preview` stopped receiving releases (#10).

**Decision.** Use the stable `typescript` 7.x package; typecheck with `tsc --noEmit`, `strict` mode
(`tsconfig.base.json`). No `@typescript/native-preview`.

**Consequences.** Tools that need the TypeScript JS API may need a TypeScript 6 package next to it; add one only when
such a tool is introduced.

# 0003 – Biome for lint and format

Status: Accepted (#1). Decision summary of 2026-10-18: [#1 decisions comment](https://github.com/alimek/budget-lens-offline/issues/1#issuecomment-6253590427).

**Decision.** Biome replaces ESLint + Prettier (`biome.json` at the root). `packages/core` has a
`noRestrictedImports` override forbidding React Native, Expo, Next.js and Supabase imports.

**Consequences.** Biome lacks some React Native / React Compiler rules available in ESLint plugins (#10); adding a
minimal ESLint is an open decision.

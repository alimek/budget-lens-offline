import { defineConfig } from "i18next-cli";

// Key extraction only (`pnpm i18n:extract`). Translations are never checked in CI (#37); missing keys fall back to
// English at runtime.
export default defineConfig({
  locales: ["en", "pl"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    ignore: ["src/**/*.test.ts"],
    output: "src/i18n/locales/{{language}}/{{namespace}}.json",
    primaryLanguage: "en",
    defaultNS: "translation",
    // Template-literal keys (e.g. `dev.designSystem.${key}`) are invisible to static extraction: never delete keys.
    removeUnusedKeys: false,
    sort: false,
    indentation: 2,
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Lets `theme.test.ts` import `global.css?raw` to check the tokens against `theme.ts`.
    css: true,
    coverage: {
      provider: "v8",
      include: [
        "src/ui/amount.ts",
        "src/ui/progress.ts",
        "src/ui/theme.ts",
        "src/ui/typography.ts",
        "src/updates/update-check.ts",
      ],
      reporter: ["text", ["text", { file: "coverage.txt" }], "html", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});

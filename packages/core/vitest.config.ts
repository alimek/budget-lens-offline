import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Compile-time-only assertions, never executed.
      exclude: ["src/**/__typetests__/**"],
      reporter: ["text", ["text", { file: "coverage.txt" }], "html", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});

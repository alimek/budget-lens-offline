import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", ["text", { file: "coverage.txt" }], "html", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});

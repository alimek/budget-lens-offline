import { defineConfig } from "drizzle-kit";

// Generated SQL lands in ./drizzle; `pnpm db:generate` then bundles it into src/migrations.generated.ts.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
});

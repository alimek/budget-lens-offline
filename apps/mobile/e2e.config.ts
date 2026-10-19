import { mobile } from "@e2e-dev/mobile";
import type { E2EConfig } from "e2e";

const bundleId = "com.budgetlens.offline";

export default {
  tests: "e2e/**/*.e2e.ts",
  workers: 1,
  trace: "on",
  video: "on",
  assertionTimeout: 30_000,
  targets: [
    {
      name: "ios",
      engine: mobile({ platform: "ios", device: "BudgetLens-CI", session: "budget-lens-ios" }),
      app: {
        bundleId,
        launchArguments: [
          "--initialUrl",
          "http://localhost:8081",
          "-EXDevMenuShowsAtLaunch",
          "NO",
          "-EXDevMenuIsOnboardingFinished",
          "YES",
          "-EXDevMenuShowFloatingActionButton",
          "NO",
        ],
      },
    },
    {
      name: "android",
      engine: mobile({
        platform: "android",
        device: "BudgetLens-Android",
        session: "budget-lens-android",
      }),
      app: { bundleId },
    },
  ],
} satisfies E2EConfig;

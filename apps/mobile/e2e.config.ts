import { mobile } from "@e2e-dev/mobile";
import type { E2EConfig } from "e2e";

const bundleId = "com.budgetlens.offline";

// Dedicated simulator/emulator names; override per machine (docs/mobile-development.md#development-builds).
const iosSimulator = process.env["E2E_IOS_SIMULATOR"] ?? "BudgetLens-iOS";
const androidAvd = process.env["E2E_ANDROID_AVD"] ?? "BudgetLens-Android";

export default {
  tests: "e2e/**/*.e2e.ts",
  workers: 1,
  trace: "on",
  video: "on",
  assertionTimeout: 30_000,
  targets: [
    {
      name: "ios",
      engine: mobile({ platform: "ios", device: iosSimulator, session: "budget-lens-ios" }),
      app: {
        bundleId,
        launchArguments: [
          "--initialUrl",
          "http://localhost:8073",
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
      // Android 17 recording retrieval fails in agent-device; screenshots remain enabled.
      video: "off",
      engine: mobile({
        platform: "android",
        device: androidAvd,
        session: "budget-lens-android",
      }),
      app: {
        bundleId,
        launchArguments: [
          "-a",
          "android.intent.action.VIEW",
          "-d",
          "exp+budget-lens://?__expo_url=http%3A%2F%2F127.0.0.1%3A8073&__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1",
        ],
      },
    },
  ],
} satisfies E2EConfig;

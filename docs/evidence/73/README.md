# Mobile scaffold verification (#73)

Captured on 2026-10-19 from Expo SDK 58 development builds using TesterArmy e2e 0.21.2,
with Metro on the repository's fixed port 8073. Only dedicated BudgetLens devices were used.

| Platform | Device | Result | Screenshots |
| --- | --- | --- | --- |
| iOS 27 | BudgetLens-CI | 6/6 smoke assertions passed | [Overview](ios-overview.png), [Savings](ios-savings.png) |
| Android 17 | BudgetLens-Android | 6/6 smoke assertions passed | [Overview](android-overview.png), [Savings](android-savings.png) |

The smoke suite verifies `screen-home`, all four other tab destinations, and Savings pushed inside
Overview. It uses no model, credentials, translated-label selectors or agent steps. App strings come
from bundled locale resources. These screenshots show the minimal scaffold; #119 owns the design system.

Commands run from the repo root:

```sh
pnpm --filter @budget-lens/mobile start
pnpm --filter @budget-lens/mobile exec expo run:android --device emulator-5556 --port 8073
adb -s emulator-5556 reverse tcp:8073 tcp:8073
pnpm --filter @budget-lens/mobile e2e:ios
E2E_TELEMETRY_DISABLED=1 pnpm --filter @budget-lens/mobile exec e2e run --target ios --grep Savings --output .e2e/ios-savings
pnpm --filter @budget-lens/mobile e2e:android
pnpm check
pnpm audit --audit-level high
pnpm check:licenses
```

The iOS development build was built and installed with `expo run:ios --device
8FB78517-C7B2-49E0-8F9B-16286E8D9ED6 --no-bundler` before the fixed-port change; the final smoke run
loads the updated JavaScript from port 8073. The Android development build succeeded and launched on
BudgetLens-Android. Raw traces and iOS video stay in ignored `apps/mobile/.e2e/` output. Android video
retrieval failed in agent-device, so Android uses screenshots and traces without skipping assertions.

Audit exits zero under the configured high/critical gate, with exactly two CLI/build-only exceptions
tracked in [#162](https://github.com/alimek/budget-lens-offline/issues/162), expiring 2026-11-19.
Both production exports with source maps passed; neither vulnerable package is bundled on either
platform. See [dependency evidence](../../mobile-development.md#dependency-compatibility-and-temporary-audit-exceptions).

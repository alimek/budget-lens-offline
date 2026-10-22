import { Redirect } from "expo-router";
import { RecoveryScreen } from "@/db/boot-screens";

const doNothing = () => undefined;

/**
 * Development-only preview of the recovery screen (#75), which a normal launch shows only when the database
 * refuses to open. Open it with `budget-lens:///dev/boot-screen` so the screen can be seen and screenshotted; in
 * a release build the route redirects away. A real unreadable database is reached through
 * `/dev/damage-database` instead (#75 R6, #242).
 */
export default function DevBootScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)/overview" />;
  }
  return <RecoveryScreen onRetry={doNothing} onStartOver={doNothing} />;
}

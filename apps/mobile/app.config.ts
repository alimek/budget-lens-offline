// Dynamic layer over app.json for release builds (#176). Static settings live in app.json; this file only applies
// optional, machine-specific values from the environment so that no team ID or personal data is committed.
// See docs/release/testflight.md for the variables and how the release script sets them.
import type { ConfigContext, ExpoConfig } from "expo/config";

/** `ios` config keys that a release build may set from an environment variable of the given name. */
const IOS_ENV_OVERRIDES = {
  bundleIdentifier: "IOS_BUNDLE_IDENTIFIER",
  buildNumber: "IOS_BUILD_NUMBER",
  appleTeamId: "APPLE_TEAM_ID",
} as const;

function iosEnvOverrides(): Partial<NonNullable<ExpoConfig["ios"]>> {
  const entries = Object.entries(IOS_ENV_OVERRIDES).flatMap(([key, envName]) => {
    const value = process.env[envName]?.trim();
    return value ? [[key, value]] : [];
  });
  return Object.fromEntries(entries);
}

export default ({ config }: ConfigContext): ExpoConfig =>
  ({ ...config, ios: { ...config.ios, ...iosEnvOverrides() } }) as ExpoConfig;
